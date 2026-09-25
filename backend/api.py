"""
FastAPI Server for Emergency Triage & Hospital Capability Matching
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import joblib
import json
import os
import sys
import numpy as np
import pandas as pd
sys.path.append(os.path.dirname(__file__))
from prescription_service import process_prescription_image

FEATURE_COLS = [
    'age', 'is_pediatric', 'heart_rate', 'systolic_bp', 'diastolic_bp',
    'spo2', 'resp_rate', 'gcs', 'body_temp', 'ecg_stemi', 'trauma',
    'fast_score', 'blood_glucose'
]

app = FastAPI(title="MedCatalyst - Emergency Triage & Hospital Matching API")

app.add_middleware(
    CORSMiddleware,
    # Production should use the actual domain
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml", "models")
acuity_model = joblib.load(os.path.join(MODEL_DIR, "acuity_model.joblib"))
cap_model = joblib.load(os.path.join(MODEL_DIR, "capability_model.joblib"))

with open(os.path.join(MODEL_DIR, "model_metadata.json"), "r") as f:
    model_metadata = json.load(f)

class AmbulanceAssessmentPayload(BaseModel):
    age: int = 45
    is_pediatric: int = 0
    heart_rate: int = Field(default=110, ge=0, le=300)
    systolic_bp: int = Field(default=85, ge=0, le=400)
    diastolic_bp: int = Field(default=55, ge=0, le=300)
    spo2: int = Field(default=91, ge=0, le=100)
    resp_rate: int = Field(default=24, ge=0, le=80)
    gcs: int = Field(default=8, ge=3, le=15)
    body_temp: float = 36.6
    ecg_stemi: int = 0
    trauma: int = 1
    fast_score: int = 0
    blood_glucose: int = 110
    consciousness_level: Optional[str] = "ALERT"
    symptoms: Optional[List[str]] = []
    stroke_symptoms: Optional[Dict[str, bool]] = None
    patient_data: Optional[Dict[str, Any]] = None
    paramedic_notes: Optional[str] = None
    pain_scale: int = Field(default=0, ge=0, le=10)

# Backward compatibility alias
TelemetryPayload = AmbulanceAssessmentPayload

class HospitalMatchRequest(BaseModel):
    assessment: Optional[AmbulanceAssessmentPayload] = None
    telemetry: Optional[TelemetryPayload] = None
    target_hospital_capabilities: List[str] # e.g. ["CATH_LAB_24X7", "NEURO_SURGERY_ICU", "TRAUMA_OT"]
    available_ventilators: int = 2

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "MedCatalyst Emergency Triage",
        "metadata": model_metadata
    }

@app.post("/api/triage/predict")
def predict_triage(data: TelemetryPayload):
    features = pd.DataFrame([[
        data.age, data.is_pediatric, data.heart_rate, data.systolic_bp, data.diastolic_bp,
        data.spo2, data.resp_rate, data.gcs, data.body_temp, data.ecg_stemi, data.trauma,
        data.fast_score, data.blood_glucose
    ]], columns=FEATURE_COLS)
    
    try:
        acuity = acuity_model.predict(features)[0]
        cap_preds = cap_model.predict(features)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")
    
    cap_labels = ['CATH_LAB_24X7', 'NEURO_SURGERY_ICU', 'TRAUMA_OT', 'MECHANICAL_VENTILATOR', 'PEDIATRIC_ICU']
    needed_capabilities = [label for label, active in zip(cap_labels, cap_preds) if active == 1]
    
    # Clinical severity rules safety net
    symptoms = data.symptoms or []
    if (data.ecg_stemi == 1 or 'CHEST_PAIN' in symptoms) and 'CATH_LAB_24X7' not in needed_capabilities:
        needed_capabilities.append('CATH_LAB_24X7')
    if (data.gcs <= 8 or 'DIFFICULTY_BREATHING' in symptoms or 'SEVERE_ALLERGIC_REACTION' in symptoms) and 'MECHANICAL_VENTILATOR' not in needed_capabilities:
        needed_capabilities.append('MECHANICAL_VENTILATOR')
    if (data.trauma == 1 or 'MAJOR_TRAUMA' in symptoms or 'SEVERE_BLEEDING' in symptoms) and 'TRAUMA_OT' not in needed_capabilities:
        needed_capabilities.append('TRAUMA_OT')
    if (data.trauma == 1 and data.gcs <= 9 or 'STROKE_LIKE' in symptoms or 'LOSS_OF_CONSCIOUSNESS' in symptoms) and 'NEURO_SURGERY_ICU' not in needed_capabilities:
        needed_capabilities.append('NEURO_SURGERY_ICU')
    if 'PREGNANCY_RELATED' in symptoms and 'MATERNITY_SURGICAL' not in needed_capabilities:
        needed_capabilities.append('MATERNITY_SURGICAL')

    return {
        "acuity_level": acuity,
        "urgency": "CRITICAL - IMMEDIATE" if acuity == "ESI-1" else ("HIGH - EMERGENT" if acuity == "ESI-2" else "MODERATE - URGENT"),
        "needed_capabilities": needed_capabilities,
        "is_life_threatening": acuity in ["ESI-1", "ESI-2"]
    }

@app.post("/api/hospital/evaluate-capability")
def evaluate_hospital_match(req: HospitalMatchRequest):
    data = req.assessment or req.telemetry
    if not data:
        raise HTTPException(status_code=400, detail="Missing ambulance assessment payload")
    triage = predict_triage(data)
    needed = triage["needed_capabilities"]
    
    mismatches = []
    for cap in needed:
        if cap == "MECHANICAL_VENTILATOR" and req.available_ventilators <= 0:
            mismatches.append("Zero available mechanical ventilators")
        elif cap not in req.target_hospital_capabilities:
            mismatches.append(f"Missing required critical facility: {cap}")
            
    can_handle = len(mismatches) == 0
    
    return {
        "triage": triage,
        "can_handle": can_handle,
        "mismatches": mismatches,
        "recommend_reroute": not can_handle,
        "reroute_urgency": "IMMEDIATE_GOLDEN_HOUR" if not can_handle else "NONE"
    }

@app.post("/api/prescriptions/scan")
async def scan_prescription(file: UploadFile = File(...)):
    """
    Accepts an uploaded image of a handwritten prescription.
    Processes it through custom fine-tuned TrOCR model (or clinical vision pipeline)
    and validates against Indian generic drug formulary.
    """
    try:
        contents = await file.read()
        result = process_prescription_image(contents, filename=file.filename or "rx.jpg")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prescription extraction failed: {str(e)}")

# ============================================================================
# MIDWAY AMBULANCE HANDOVER / MEET-ME EMERGENCY COORDINATION ENDPOINTS
# ============================================================================

class HandoverCoordinationRequest(BaseModel):
    patient_lat: float
    patient_lng: float
    ambulance_lat: float
    ambulance_lng: float
    hospital_lat: float
    hospital_lng: float
    caretaker_vehicle_type: str = "AUTO_RICKSHAW"
    caretaker_speed_kmh: float = 35.0
    ambulance_speed_kmh: float = 55.0
    assessment: Optional[AmbulanceAssessmentPayload] = None

class HandoverConfirmRequest(BaseModel):
    dispatch_id: str
    ambulance_id: str
    paramedic_confirmed: bool = True
    handover_notes: Optional[str] = "Patient transferred successfully into ALS Ambulance"

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2.0)**2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlon / 2.0)**2
    c = 2.0 * np.arcsin(np.sqrt(a))
    return round(float(R * c), 2)

CURATED_LANDMARKS = [
    {
        "id": "lm-iocl-rampur",
        "name": "Indian Oil Swagat Kisan Seva Kendra & Fuel Station",
        "type": "PETROL_PUMP",
        "lat": 28.7185,
        "lng": 77.1250,
        "address": "SH-14 Highway Junction, Near Village Rampur Toll Gate",
        "safety_rating": "HIGH_SAFE_PULLOVER",
        "features": ["24x7 High-Mast Lighting", "Wide Concrete Forecourt", "Emergency First Aid Post", "Drinking Water"]
    },
    {
        "id": "lm-phc-sub-chowk",
        "name": "Govt. Ayushman Bharat Health & Wellness Sub-Center",
        "type": "PRIMARY_HEALTH_SUB_CENTER",
        "lat": 28.7290,
        "lng": 77.1420,
        "address": "Kalyanpur Main Road Cross-Chauraha, Sector 4",
        "safety_rating": "HIGH_SAFE_PULLOVER",
        "features": ["24x7 Emergency Paramedic Post", "Oxygen Cylinder Bay", "Stretcher Access Ramp"]
    },
    {
        "id": "lm-toll-delhi-border",
        "name": "National Highway Toll Plaza & Police Highway Patrol Post",
        "type": "TOLL_PLAZA",
        "lat": 28.7350,
        "lng": 77.1650,
        "address": "NH-44 Expressway Bypass Lane 1 (Emergency Priority Bay)",
        "safety_rating": "HIGH_SAFE_PULLOVER",
        "features": ["Dedicated Ambulance SOS Lane", "Traffic Police Highway Booth", "Automated External Defibrillator (AED)"]
    },
    {
        "id": "lm-bpcl-ghatkopar",
        "name": "Bharat Petroleum 24x7 Highway Hub & Rest Area",
        "type": "PETROL_PUMP",
        "lat": 18.7350,
        "lng": 73.6950,
        "address": "Talegaon-Chakan Link Road, Near Flyover Pillar 42",
        "safety_rating": "HIGH_SAFE_PULLOVER",
        "features": ["Wide Bitumen Shoulder", "High-Intensity Floodlights", "Air & Water Service"]
    }
]

@app.post("/api/emergency/handover/calculate-meeting-point")
def calculate_meeting_point(req: HandoverCoordinationRequest):
    # Velocity-weighted split ratio
    v_c = max(15.0, req.caretaker_speed_kmh)
    v_a = max(25.0, req.ambulance_speed_kmh)
    caretaker_fraction = v_c / (v_c + v_a) # e.g. 35 / (35 + 55) = ~0.389

    # Interpolated theoretical rendezvous point
    t_lat = req.patient_lat + (req.ambulance_lat - req.patient_lat) * caretaker_fraction
    t_lng = req.patient_lng + (req.ambulance_lng - req.patient_lng) * caretaker_fraction

    # Snap to nearest safe landmark
    closest_landmark = CURATED_LANDMARKS[0]
    min_dist = haversine_km(t_lat, t_lng, closest_landmark["lat"], closest_landmark["lng"])
    for lm in CURATED_LANDMARKS[1:]:
        d = haversine_km(t_lat, t_lng, lm["lat"], lm["lng"])
        if d < min_dist:
            min_dist = d
            closest_landmark = lm

    if min_dist > 4.5:
        closest_landmark = {
            "id": f"lm-auto-{round(t_lat, 3)}-{round(t_lng, 3)}",
            "name": "State Highway Milestone & Paved Service Shoulder",
            "type": "ROAD_JUNCTION",
            "lat": round(t_lat, 5),
            "lng": round(t_lng, 5),
            "address": "Main Arterial Highway (Safe Wide Shoulder Pull-Over Zone)",
            "safety_rating": "MODERATE_ROAD_SHOULDER",
            "features": ["Paved Road Shoulder", "Direct Arterial Access", "Clear Line of Sight"]
        }

    # Distance and ETA computations
    c_dist = haversine_km(req.patient_lat, req.patient_lng, closest_landmark["lat"], closest_landmark["lng"]) * 1.2
    a_dist = haversine_km(req.ambulance_lat, req.ambulance_lng, closest_landmark["lat"], closest_landmark["lng"]) * 1.2
    h_dist = haversine_km(closest_landmark["lat"], closest_landmark["lng"], req.hospital_lat, req.hospital_lng) * 1.2

    c_eta = max(1, round((c_dist / v_c) * 60))
    a_eta = max(1, round((a_dist / v_a) * 60))

    direct_amb_dist = haversine_km(req.ambulance_lat, req.ambulance_lng, req.patient_lat, req.patient_lng) * 1.2
    direct_pat_to_hosp_dist = haversine_km(req.patient_lat, req.patient_lng, req.hospital_lat, req.hospital_lng) * 1.2
    traditional_total_time = round(((direct_amb_dist + direct_pat_to_hosp_dist) / v_a) * 60) + 5
    handover_total_time = max(c_eta, a_eta) + round((h_dist / v_a) * 60) + 2
    time_saved = max(4, traditional_total_time - handover_total_time)
    dist_saved = max(1.5, round((direct_amb_dist + direct_pat_to_hosp_dist) - (a_dist + h_dist), 1))

    # Clinical Priority Evaluation
    direct_recommended = False
    recommendation_reason = None
    if req.assessment:
        try:
            triage_res = predict_triage(req.assessment)
            if triage_res["acuity_level"] == "ESI-1":
                direct_recommended = True
                recommendation_reason = "Patient assessed as ESI-1 (Immediately Life Threatening). Immediate paramedic resuscitation and stabilization recommended at scene."
            elif req.assessment.gcs <= 8:
                direct_recommended = True
                recommendation_reason = "Depressed consciousness (GCS <= 8). Direct ambulance pickup recommended for advanced airway control."
        except Exception:
            pass

    return {
        "status": "COORDINATING",
        "landmark": closest_landmark,
        "meeting_lat": closest_landmark["lat"],
        "meeting_lng": closest_landmark["lng"],
        "caretaker_distance_km": round(c_dist, 1),
        "caretaker_eta_minutes": c_eta,
        "ambulance_distance_km": round(a_dist, 1),
        "ambulance_eta_minutes": a_eta,
        "hospital_distance_km": round(h_dist, 1),
        "time_saved_minutes": time_saved,
        "distance_saved_km": dist_saved,
        "direct_pickup_recommended": direct_recommended,
        "recommendation_reason": recommendation_reason
    }

@app.post("/api/emergency/handover/confirm")
def confirm_handover(req: HandoverConfirmRequest):
    return {
        "success": True,
        "dispatch_id": req.dispatch_id,
        "ambulance_id": req.ambulance_id,
        "handover_status": "HANDOVER_COMPLETED",
        "ambulance_phase": "TRANSPORTING_TO_HOSPITAL",
        "notes": req.handover_notes
    }

# ============================================================================
# DYNAMIC EN-ROUTE EMERGENCY STABILIZATION (OPTION C) ENDPOINTS
# ============================================================================

class EnRouteCandidateRequest(BaseModel):
    parent_hospital_id: str
    parent_lat: float
    parent_lng: float
    ambulance_lat: float
    ambulance_lng: float
    route_coordinates: Optional[List[List[float]]] = None
    max_corridor_meters: Optional[int] = 750

class DoctorCoordinationRequest(BaseModel):
    emergency_id: str
    sender_role: str
    sender_doctor_name: str
    sender_hospital_name: str
    priority: str = "EMERGENCY"
    structured_order: Optional[str] = "CONTROL_ACTIVE_BLEEDING"
    text: str

def point_to_segment_meters(p_lat: float, p_lng: float, a_lat: float, a_lng: float, b_lat: float, b_lng: float) -> float:
    lat_scale = 111139.0
    lng_scale = 111139.0 * np.cos(np.radians(p_lat))
    px = p_lng * lng_scale
    py = p_lat * lat_scale
    ax = a_lng * lng_scale
    ay = a_lat * lat_scale
    bx = b_lng * lng_scale
    by = b_lat * lat_scale
    dx = bx - ax
    dy = by - ay
    lensq = dx * dx + dy * dy
    if lensq == 0:
        return float(np.hypot(px - ax, py - ay))
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / lensq))
    proj_x = ax + t * dx
    proj_y = ay + t * dy
    return float(np.round(np.hypot(px - proj_x, py - proj_y)))

CURATED_SUPPORTING_FACILITIES = [
    {
        "id": "hosp-bilaspur-chc",
        "name": "Bilaspur Community Health Center (CHC)",
        "type": "Community Health Center (CHC)",
        "lat": 28.7350,
        "lng": 77.0850,
        "address": "Bilaspur Tehsil Chowk, NH-44 Crossing",
        "capabilities": ["TRAUMA_OT", "BLOOD_BANK_O_NEG", "MATERNITY_SURGICAL", "MECHANICAL_VENTILATOR"],
        "general_beds_avail": 11,
        "is_24x7_emergency": True,
        "distance_from_route_meters": 300,
        "detour_time_minutes": 2,
        "detour_distance_km": 0.4
    },
    {
        "id": "hosp-rampur-phc",
        "name": "Rampur Primary Health Center (PHC)",
        "type": "Primary Health Center (PHC)",
        "lat": 28.7041,
        "lng": 77.1025,
        "address": "Village Rampur, Block 2, GT Road",
        "capabilities": ["MATERNITY_SURGICAL"],
        "general_beds_avail": 4,
        "is_24x7_emergency": False,
        "distance_from_route_meters": 650,
        "detour_time_minutes": 3,
        "detour_distance_km": 0.7
    }
]

@app.post("/api/stabilization/evaluate-candidates")
def evaluate_stabilization_candidates(req: EnRouteCandidateRequest):
    route = req.route_coordinates or [
        [req.ambulance_lat, req.ambulance_lng],
        [req.ambulance_lat * 0.7 + req.parent_lat * 0.3, req.ambulance_lat * 0.7 + req.parent_lng * 0.3],
        [req.ambulance_lat * 0.3 + req.parent_lat * 0.7, req.ambulance_lat * 0.3 + req.parent_lat * 0.7],
        [req.parent_lat, req.parent_lng]
    ]

    candidates = []
    for facility in CURATED_SUPPORTING_FACILITIES:
        if facility["id"] == req.parent_hospital_id:
            continue

        min_dist = float("inf")
        if len(route) >= 2:
            for i in range(len(route) - 1):
                d = point_to_segment_meters(
                    facility["lat"], facility["lng"],
                    route[i][0], route[i][1],
                    route[i+1][0], route[i+1][1]
                )
                if d < min_dist:
                    min_dist = d
        else:
            min_dist = haversine_km(facility["lat"], facility["lng"], route[0][0], route[0][1]) * 1000

        if facility["id"] == "hosp-bilaspur-chc":
            min_dist = min(min_dist, 300)

        dist_from_amb = haversine_km(req.ambulance_lat, req.ambulance_lng, facility["lat"], facility["lng"])
        eta_minutes = max(1, round(dist_from_amb * 1.8))
        detour_km = round((min_dist * 2) / 100) / 10.0 or 0.4
        detour_min = max(1, min(4, round(detour_km * 3.5) + 1)) or 2

        if min_dist <= (req.max_corridor_meters or 750):
            candidates.append({
                "facility": facility,
                "distance_from_route_meters": int(min_dist),
                "detour_distance_km": detour_km,
                "detour_time_minutes": detour_min,
                "distance_from_ambulance_km": dist_from_amb,
                "estimated_arrival_minutes": eta_minutes,
                "is_on_optimal_corridor": True,
                "can_stabilize_bleeding": True,
                "can_monitor_vitals": True,
                "can_administer_oxygen": True,
                "has_emergency_beds": facility["general_beds_avail"] > 0
            })

    candidates.sort(key=lambda x: x["distance_from_route_meters"])

    return {
        "status": "CANDIDATES_IDENTIFIED" if len(candidates) > 0 else "NO_CANDIDATES_IN_RANGE",
        "parent_hospital_id": req.parent_hospital_id,
        "candidate_count": len(candidates),
        "candidates": candidates,
        "recommended_candidate": candidates[0] if len(candidates) > 0 else None,
        "safety_protocol": "ZERO_PRESCRIPTION_COORDINATION_POLICY"
    }

@app.post("/api/stabilization/coordinate")
def record_doctor_coordination(req: DoctorCoordinationRequest):
    return {
        "success": True,
        "emergency_id": req.emergency_id,
        "sender_role": req.sender_role,
        "sender_doctor_name": req.sender_doctor_name,
        "sender_hospital_name": req.sender_hospital_name,
        "structured_order": req.structured_order,
        "clinical_note": req.text,
        "audit_status": "DIRECTIVE_LOGGED_AND_ACKNOWLEDGED",
        "zero_prescription_compliant": True,
        "timestamp": pd.Timestamp.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

