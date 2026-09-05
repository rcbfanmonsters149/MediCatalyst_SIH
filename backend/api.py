"""
FastAPI Server for Emergency Triage & Hospital Capability Matching
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import joblib
import json
import os
import numpy as np

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
    features = np.array([[
        data.age, data.is_pediatric, data.heart_rate, data.systolic_bp, data.diastolic_bp,
        data.spo2, data.resp_rate, data.gcs, data.body_temp, data.ecg_stemi, data.trauma,
        data.fast_score, data.blood_glucose
    ]])
    
    try:
        acuity = acuity_model.predict(features)[0]
        cap_preds = cap_model.predict(features)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {str(e)}")
    
    cap_labels = ['CATH_LAB_24X7', 'NEURO_SURGERY_ICU', 'TRAUMA_OT', 'MECHANICAL_VENTILATOR', 'PEDIATRIC_ICU']
    needed_capabilities = [label for label, active in zip(cap_labels, cap_preds) if active == 1]
    
    # Clinical severity rules safety net
    if data.ecg_stemi == 1 and 'CATH_LAB_24X7' not in needed_capabilities:
        needed_capabilities.append('CATH_LAB_24X7')
    if data.gcs <= 8 and 'MECHANICAL_VENTILATOR' not in needed_capabilities:
        needed_capabilities.append('MECHANICAL_VENTILATOR')
    if data.trauma == 1 and data.gcs <= 9 and 'NEURO_SURGERY_ICU' not in needed_capabilities:
        needed_capabilities.append('NEURO_SURGERY_ICU')

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
