"""
Validation Script for Emergency Triage & Hospital Capability Classifier
Tests clinical corner cases against expected acuity and capability outputs.
"""

import joblib
import os
import numpy as np

def run_tests():
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    acuity_clf = joblib.load(os.path.join(model_dir, 'acuity_model.joblib'))
    cap_clf = joblib.load(os.path.join(model_dir, 'capability_model.joblib'))
    
    print("Testing ML Emergency Triage Model...")
    
    # Test Case 1: Severe Head Trauma Bike Accident (GCS 8, Trauma=1, Low BP)
    # Features: age, is_pediatric, hr, sbp, dbp, spo2, rr, gcs, temp, ecg_stemi, trauma, fast_score, glucose
    sample_trauma = np.array([[52, 0, 125, 85, 55, 89, 26, 8, 36.5, 0, 1, 0, 120]])
    acuity_trauma = acuity_clf.predict(sample_trauma)[0]
    caps_trauma = cap_clf.predict(sample_trauma)[0]
    # Caps order: ['req_cath_lab', 'req_neuro_icu', 'req_trauma_ot', 'req_ventilator', 'req_pediatric_icu']
    
    print(f"Test 1 [Head Trauma]: Predicted Acuity={acuity_trauma} (Expected: ESI-1/ESI-2)")
    print(f"Test 1 [Head Trauma]: Caps=[Neuro-ICU={caps_trauma[1]}, Trauma-OT={caps_trauma[2]}, Vent={caps_trauma[3]}]")
    assert acuity_trauma in ['ESI-1', 'ESI-2'], f"Expected ESI-1/2 for severe trauma, got {acuity_trauma}"
    assert caps_trauma[1] == 1, "Expected Neuro-ICU requirement for GCS 8 trauma"
    
    # Test Case 2: Acute STEMI (ST-Elevation Myocardial Infarction)
    sample_stemi = np.array([[60, 0, 115, 95, 65, 94, 22, 14, 36.8, 1, 0, 0, 140]])
    acuity_stemi = acuity_clf.predict(sample_stemi)[0]
    caps_stemi = cap_clf.predict(sample_stemi)[0]
    
    print(f"Test 2 [Acute STEMI]: Predicted Acuity={acuity_stemi} (Expected: ESI-1/ESI-2)")
    print(f"Test 2 [Acute STEMI]: Caps=[Cath-Lab={caps_stemi[0]}]")
    assert caps_stemi[0] == 1, "Expected 24/7 Cath Lab requirement for STEMI"
    
    # Test Case 3: Mild Fever / Stable vitals
    sample_mild = np.array([[28, 0, 76, 120, 80, 98, 16, 15, 37.2, 0, 0, 0, 95]])
    acuity_mild = acuity_clf.predict(sample_mild)[0]
    caps_mild = cap_clf.predict(sample_mild)[0]
    
    print(f"Test 3 [Mild Patient]: Predicted Acuity={acuity_mild} (Expected: ESI-3/ESI-4)")
    print(f"Test 3 [Mild Patient]: Total specialized capabilities needed = {sum(caps_mild)}")
    assert sum(caps_mild) == 0, "Expected zero specialized tertiary units for mild outpatient"
    
    print("\nALL CLINICAL TRIAGE & CAPABILITY ML TESTS PASSED! (100% PASS)")

if __name__ == '__main__':
    run_tests()
