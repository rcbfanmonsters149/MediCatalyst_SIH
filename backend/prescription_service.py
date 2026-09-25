import os
import io
import json
import re
from typing import List, Dict, Any, Optional
from PIL import Image

CURRENT_DIR = os.path.dirname(__file__)
LEXICON_PATH = os.path.join(CURRENT_DIR, "ml", "data", "indian_drugs_master.json")
MODEL_DIR = os.path.join(CURRENT_DIR, "ml", "models", "trocr_doctor_prescription")

INDIAN_DRUGS = []
if os.path.exists(LEXICON_PATH):
    try:
        with open(LEXICON_PATH, "r", encoding="utf-8") as f:
            INDIAN_DRUGS = json.load(f)
    except Exception as e:
        print(f"Warning: Failed to load drug lexicon: {e}")

if not INDIAN_DRUGS:
    INDIAN_DRUGS = [
        {"name": "Paracetamol", "aliases": ["pcm", "dolo", "crocin", "calpol", "pyrigesic"], "standard_dosages": ["650mg", "500mg"], "common_frequency": "1-0-1", "instructions": "After food with warm water"},
        {"name": "Pantoprazole", "aliases": ["pantocid", "pantodac", "pantop", "pan40"], "standard_dosages": ["40mg"], "common_frequency": "1-0-0", "instructions": "Morning empty stomach"},
        {"name": "Azithromycin", "aliases": ["azithro", "azee", "azithral"], "standard_dosages": ["500mg"], "common_frequency": "1-0-0", "instructions": "After food for 3 days"},
        {"name": "Amoxicillin", "aliases": ["novamox", "amoxyclav", "augmentin"], "standard_dosages": ["500mg"], "common_frequency": "1-0-1", "instructions": "After meals"},
        {"name": "Metformin", "aliases": ["glycomet", "glyciphage", "gluformin"], "standard_dosages": ["500mg"], "common_frequency": "1-0-1", "instructions": "With meals"},
        {"name": "Cetirizine", "aliases": ["cetzine", "alerid", "okacet"], "standard_dosages": ["10mg"], "common_frequency": "0-0-1", "instructions": "At bedtime"},
        {"name": "Telmisartan", "aliases": ["telma", "telpres", "telsartan"], "standard_dosages": ["40mg"], "common_frequency": "1-0-0", "instructions": "Morning daily"},
        {"name": "Ibuprofen", "aliases": ["brufen", "combiflam", "ibugesic"], "standard_dosages": ["400mg"], "common_frequency": "1-0-1", "instructions": "After food"},
        {"name": "Ciprofloxacin", "aliases": ["ciplox", "cifran"], "standard_dosages": ["500mg"], "common_frequency": "1-0-1", "instructions": "With water"},
        {"name": "Cefixime", "aliases": ["taxim-o", "mahacef", "ceftas", "zifi"], "standard_dosages": ["200mg"], "common_frequency": "1-0-1", "instructions": "After meals"},
        {"name": "Montelukast", "aliases": ["montair", "montek", "telekast"], "standard_dosages": ["10mg"], "common_frequency": "0-0-1", "instructions": "At bedtime"},
        {"name": "Diclofenac", "aliases": ["voveran", "volini", "dynapar"], "standard_dosages": ["50mg"], "common_frequency": "1-0-1", "instructions": "After meals"}
    ]

# Global model references
trocr_model = None
trocr_processor = None
torch_module = None

def load_trocr_model_if_available():
    global trocr_model, trocr_processor, torch_module
    if os.path.exists(MODEL_DIR) and os.path.exists(os.path.join(MODEL_DIR, "config.json")):
        try:
            import torch
            from transformers import RobertaTokenizer, AutoImageProcessor, TrOCRProcessor, VisionEncoderDecoderModel
            print(f"Loading custom fine-tuned TrOCR from {MODEL_DIR}...")
            tokenizer = RobertaTokenizer.from_pretrained(MODEL_DIR)
            image_processor = AutoImageProcessor.from_pretrained(MODEL_DIR)
            trocr_processor = TrOCRProcessor(image_processor=image_processor, tokenizer=tokenizer)
            trocr_model = VisionEncoderDecoderModel.from_pretrained(MODEL_DIR)
            trocr_model.eval()
            torch_module = torch
            print("Custom TrOCR model loaded successfully into backend!")
        except Exception as e:
            print(f"Note: Custom TrOCR weights found but torch/transformers could not load ({e}). Using rule-based fallback.")

# Attempt loading at startup
load_trocr_model_if_available()

def simple_levenshtein(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return simple_levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def fuzzy_match_drug(token: str) -> Optional[Dict[str, Any]]:
    clean = re.sub(r'[^a-zA-Z0-9]', '', token).lower()
    if len(clean) < 3:
        return None

    # Strict check for 3-letter tokens: Only allow exact match to 'pcm'
    if len(clean) == 3:
        if clean == 'pcm':
            for drug in INDIAN_DRUGS:
                if drug["name"].lower() == "paracetamol":
                    return {"drug": drug, "similarity": 1.0}
        return None

    best_drug = None
    best_similarity = 0.0

    for drug in INDIAN_DRUGS:
        targets = [drug["name"].lower()] + [a.lower() for a in drug.get("aliases", [])]
        for target in targets:
            if len(target) < 3:
                continue

            # Exact match
            if clean == target:
                return {"drug": drug, "similarity": 1.0}

            # Levenshtein distance check (no substring includes!)
            dist = simple_levenshtein(clean, target)
            max_len = max(len(clean), len(target))
            similarity = 1.0 - (dist / max_len)

            threshold = 0.85 if len(target) <= 4 else 0.80
            if similarity >= threshold and similarity > best_similarity:
                best_similarity = similarity
                best_drug = drug

    if best_drug:
        return {"drug": best_drug, "similarity": best_similarity}
    return None

def verify_prescription_document(raw_text: str) -> Dict[str, Any]:
    if not raw_text or len(raw_text.strip()) < 8:
        return {"is_valid": False, "score": 0, "anchors": []}

    lower = raw_text.lower()
    anchors = []
    score = 0

    # 1. Prescription Symbol / Slip Headers (+3)
    if re.search(r'\b(?:rx|r/x|prescription|remedy)\b', lower):
        score += 3
        anchors.append("Rx / Prescription Header")

    # 2. Doctor / Clinic / Hospital (+2)
    if re.search(r'\b(?:dr\.?|doctor|mbbs|m\.b\.b\.s|md|m\.d\.|clinic|hospital|dispensary|opd|consultant|physician|surgeon)\b', lower):
        score += 2
        anchors.append("Doctor / Facility Header")

    # 3. Clinical Sections (+2)
    if re.search(r'\b(?:diagnosis|diag|dx|vitals|bp|pulse|spo2|temp|chief complaint|complaints?|advice)\b', lower):
        score += 2
        anchors.append("Clinical Consultation Section")

    # 4. Formulations (+2)
    if re.search(r'\b(?:tab\.?|tablet|tablets|cap\.?|capsule|capsules|syp\.?|syrup|inj\.?|injection)\b', lower):
        score += 2
        anchors.append("Formulation (Tab/Cap/Syp/Inj)")

    # 5. Dosing markers (+2)
    if re.search(r'\b(?:\d+\s*(?:mg|mcg|ml|gm|iu)|1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|od|bd|tid|qid|hs|sos)\b', lower):
        score += 2
        anchors.append("Dose / Frequency")

    # 6. Drug check
    tokens = re.split(r'[\s,;()\n]+', lower)
    drug_matches = 0
    for tok in tokens:
        if len(tok) >= 4 or tok == 'pcm':
            m = fuzzy_match_drug(tok)
            if m:
                drug_matches += 1
                anchors.append(f"Drug: {m['drug']['name']}")

    if drug_matches > 0:
        score += min(drug_matches * 2, 6)

    is_valid = score >= 4 and (drug_matches > 0 or score >= 5)
    return {"is_valid": is_valid, "score": score, "anchors": anchors}

def extract_clinical_entities_from_text(raw_text: str) -> Dict[str, Any]:
    verification = verify_prescription_document(raw_text)
    if not verification["is_valid"]:
        return {
            "is_prescription": False,
            "rejection_reason": "No clinical prescription markers, Rx headers, or valid pharmaceuticals detected.",
            "doctor_name": "",
            "doctor_specialty": "",
            "diagnosis": "",
            "vitals_detected": "",
            "clinical_advice": "",
            "medications": [],
            "overall_confidence": 0.0
        }

    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    
    doctor_name = ""
    doctor_specialty = ""
    diagnosis = ""
    vitals_detected = ""
    clinical_advice = ""
    medications = []
    seen_drugs = set()

    for line in lines:
        # Check doctor name
        doc_match = re.search(r'(?:Dr\.?|Doctor)\s+([A-Za-z\s.]+)', line, re.IGNORECASE)
        if doc_match and len(doc_match.group(1).strip()) > 3:
            doctor_name = f"Dr. {doc_match.group(1).strip()}"

        if re.search(r'internal medicine|general physician|cardiologist|pediatrician', line, re.IGNORECASE):
            doctor_specialty = line.strip()

        # Check diagnosis
        diag_match = re.search(r'(?:Diagnosis|Diag|Dx|Impression|Chief Complaint)[:\s]+([^|\n]+)', line, re.IGNORECASE)
        if diag_match:
            diagnosis = diag_match.group(1).strip()
        elif not diagnosis and re.search(r'\b(fever|urti|cough|cold|infection|hypertension|diabetes|gastritis|asthma|bronchitis|pain|headache)\b', line, re.IGNORECASE):
            diagnosis = re.sub(r'^[0-9.\-\s*]+', '', line).strip()

        # Check vitals
        if re.search(r'bp\s*[:\d]|spo2|pulse|temp', line, re.IGNORECASE):
            vitals_detected = line.strip()

        # Check advice
        if re.search(r'\b(advice|instruction|review|follow[- ]up|water|steam|rest)\b', line, re.IGNORECASE) and not re.search(r'tab\.|cap\.', line, re.IGNORECASE):
            clinical_advice += (" " if clinical_advice else "") + re.sub(r'^(?:advice|instructions?)[:\s-]*', '', line, flags=re.IGNORECASE).strip()

        # Scan for medications
        tokens = re.split(r'[\s,;()]+', line)
        for token in tokens:
            matched = fuzzy_match_drug(token)
            if matched and matched["drug"]["name"] not in seen_drugs:
                drug = matched["drug"]
                seen_drugs.add(drug["name"])

                # Dosage extraction
                dosage_match = re.search(r'(\d+\s*(?:mg|g|ml|mcg|iu))', line, re.IGNORECASE)
                dosage = dosage_match.group(1) if dosage_match else (drug.get("standard_dosages", ["500mg"])[0])

                # Frequency extraction
                freq_match = re.search(r'\b(1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|OD|BD|TID|QID|HS|SOS)\b', line, re.IGNORECASE)
                if freq_match:
                    raw_f = freq_match.group(1).upper()
                    if raw_f in ['1-0-1', 'BD']:
                        freq = '1-0-1 (After Food)'
                    elif raw_f in ['1-0-0', 'OD']:
                        freq = '1-0-0 (Morning)'
                    elif raw_f in ['0-0-1', 'HS']:
                        freq = '0-0-1 (Bedtime)'
                    elif raw_f in ['1-1-1', 'TID']:
                        freq = '1-1-1 (After Meals)'
                    elif raw_f == 'SOS':
                        freq = 'SOS (As Needed)'
                    else:
                        freq = raw_f
                else:
                    freq = drug.get("common_frequency", "1-0-1 (After Food)")

                # Duration extraction
                dur_match = re.search(r'(\d+\s*(?:days?|weeks?|months?|d\b))', line, re.IGNORECASE)
                duration = dur_match.group(1).replace('d', 'Days') if dur_match else "5 Days"

                # Instructions
                instructions = drug.get("instructions", "Take after meals")
                if re.search(r'empty stomach|before food|before breakfast', line, re.IGNORECASE):
                    instructions = "Morning 30 mins before breakfast"
                elif re.search(r'after food|after meals', line, re.IGNORECASE):
                    instructions = "Take after meals with water"
                elif re.search(r'bedtime|night', line, re.IGNORECASE):
                    instructions = "Take at bedtime"

                medications.append({
                    "name": drug["name"],
                    "dosage": dosage,
                    "frequency": freq,
                    "duration": duration,
                    "instructions": instructions,
                    "confidence": round(matched["similarity"] * 100, 1)
                })

    if len(medications) == 0 and verification["score"] < 5:
        return {
            "is_prescription": False,
            "rejection_reason": "No recognizable pharmaceutical medications found.",
            "doctor_name": "",
            "doctor_specialty": "",
            "diagnosis": "",
            "vitals_detected": "",
            "clinical_advice": "",
            "medications": [],
            "overall_confidence": 0.0
        }

    confidence_base = 88.0 if len(medications) > 0 else 60.0
    overall_confidence = min(confidence_base + (len(medications) * 2.5), 98.0)

    return {
        "is_prescription": True,
        "doctor_name": doctor_name,
        "doctor_specialty": doctor_specialty or "General Medicine",
        "diagnosis": diagnosis,
        "vitals_detected": vitals_detected,
        "clinical_advice": clinical_advice,
        "medications": medications,
        "overall_confidence": round(overall_confidence, 1)
    }

def process_prescription_image(image_bytes: bytes, filename: str = "rx.jpg") -> Dict[str, Any]:
    try:
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image format: {str(e)}")

    transcribed_lines = []
    model_used = "TrOCR Vision Transformer & Indian Generic Drug Master"

    # If TrOCR model is loaded, slice and transcribe image lines
    if trocr_model is not None and trocr_processor is not None and torch_module is not None:
        try:
            width, height = pil_image.size
            num_slices = min(max(height // 120, 3), 8)
            slice_h = height // num_slices

            for i in range(num_slices):
                top = i * slice_h
                bottom = min((i + 1) * slice_h + 15, height)
                box = (0, top, width, bottom)
                cropped_band = pil_image.crop(box)

                pixel_values = trocr_processor(cropped_band, return_tensors="pt").pixel_values
                with torch_module.no_grad():
                    generated_ids = trocr_model.generate(pixel_values, max_length=64)
                line_text = trocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
                if line_text and len(line_text.strip()) > 3:
                    transcribed_lines.append(line_text.strip())
            
            raw_text = "\n".join(transcribed_lines)
            model_used = "Fine-Tuned TrOCR (Custom Medical ViT - Local)"
        except Exception as e:
            print(f"TrOCR line slicing note: {e}")
            raw_text = ""
    else:
        raw_text = ""

    clinical_data = extract_clinical_entities_from_text(raw_text)

    if not clinical_data.get("is_prescription", False):
        return {
            "status": "rejected",
            "is_prescription": False,
            "rejection_reason": clinical_data.get("rejection_reason", "Not a medical prescription"),
            "model_used": model_used,
            "is_custom_model_loaded": trocr_model is not None,
            "transcription_summary": raw_text or "No text detected",
            "doctor_name": "",
            "doctor_specialty": "",
            "diagnosis": "",
            "vitals_detected": "",
            "clinical_advice": "",
            "medications": [],
            "overall_confidence": 0.0
        }

    return {
        "status": "success",
        "is_prescription": True,
        "model_used": model_used,
        "is_custom_model_loaded": trocr_model is not None,
        "transcription_summary": raw_text or "Processed via Optical Character Recognition",
        "doctor_name": clinical_data["doctor_name"],
        "doctor_specialty": clinical_data["doctor_specialty"],
        "diagnosis": clinical_data["diagnosis"],
        "vitals_detected": clinical_data["vitals_detected"],
        "clinical_advice": clinical_data["clinical_advice"],
        "medications": clinical_data["medications"],
        "overall_confidence": clinical_data["overall_confidence"]
    }
