"""
Validation Script for Emergency Triage & Hospital Capability Classifier
Tests clinical corner cases, missing data imputation, and outlier bounds.
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib

try:
    from backend.ml.preprocessor import preprocess_clinical_dataset, FEATURE_COLS
except ImportError:
    from preprocessor import preprocess_clinical_dataset, FEATURE_COLS

def test_preprocessor():
    print("--- 1. Testing Clinical Data Preprocessor ---")
    
    # Test record with missing vitals and extreme outliers
    messy_data = pd.DataFrame([{
        'age': 8,
        'heart_rate': -99,        # Impossible negative HR -> should clip to 20
        'systolic_bp': 350,       # Outlier -> should clip to 260
        'diastolic_bp': None,     # Missing -> should impute 80
        'spo2': 88,
        'resp_rate': None,        # Missing -> should impute 16
        'gcs': 14,
        'body_temp': None,        # Missing -> should impute 36.8
        'blood_glucose': None,    # Missing -> should impute 110
        'acuity': '1'             # Should standardize to ESI-1
    }])
    
    cleaned = preprocess_clinical_dataset(messy_data, is_training=True)
    
    assert cleaned.loc[0, 'heart_rate'] == 20, f"Expected clipped HR of 20, got {cleaned.loc[0, 'heart_rate']}"
    assert cleaned.loc[0, 'systolic_bp'] == 260, f"Expected clipped SBP of 260, got {cleaned.loc[0, 'systolic_bp']}"
    assert cleaned.loc[0, 'diastolic_bp'] == 80, f"Expected imputed DBP of 80, got {cleaned.loc[0, 'diastolic_bp']}"
    assert cleaned.loc[0, 'is_pediatric'] == 1, f"Expected is_pediatric=1 for age 8, got {cleaned.loc[0, 'is_pediatric']}"
    assert cleaned.loc[0, 'acuity'] == 'ESI-1', f"Expected standardized acuity 'ESI-1', got {cleaned.loc[0, 'acuity']}"
    assert cleaned.loc[0, 'blood_glucose'] == 110, f"Expected default glucose 110, got {cleaned.loc[0, 'blood_glucose']}"
    
    print("PASS: Preprocessor correctly handled missing vitals, outlier bounds, and pediatric inference.")

def test_model_predictions():
    print("\n--- 2. Testing ML Clinical Predictions ---")
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    acuity_path = os.path.join(model_dir, 'acuity_model.joblib')
    cap_path = os.path.join(model_dir, 'capability_model.joblib')
    
    if not os.path.exists(acuity_path) or not os.path.exists(cap_path):
        print("Models not yet trained. Run train_model.py first.")
        return

    acuity_clf = joblib.load(acuity_path)
    cap_clf = joblib.load(cap_path)
    
    # Test Case 1: Severe Head Trauma Bike Accident (GCS 8, Trauma=1, Low BP)
    sample_trauma = pd.DataFrame([[52, 0, 125, 85, 55, 89, 26, 8, 36.5, 0, 1, 0, 120]], columns=FEATURE_COLS)
    acuity_trauma = acuity_clf.predict(sample_trauma)[0]
    caps_trauma = cap_clf.predict(sample_trauma)[0]
    # Caps: ['req_cath_lab', 'req_neuro_icu', 'req_trauma_ot', 'req_ventilator', 'req_pediatric_icu']
    
    print(f"Test Case 1 [Head Trauma]: Predicted Acuity={acuity_trauma} (Expected: ESI-1 or ESI-2)")
    print(f"Test Case 1 [Head Trauma]: Capabilities={caps_trauma}")
    assert acuity_trauma in ['ESI-1', 'ESI-2'], f"Expected high acuity for severe trauma, got {acuity_trauma}"
    assert caps_trauma[1] == 1, "Expected Neuro-ICU requirement for GCS 8 head trauma"
    
    # Test Case 2: Acute STEMI
    sample_stemi = pd.DataFrame([[60, 0, 115, 95, 65, 94, 22, 14, 36.8, 1, 0, 0, 140]], columns=FEATURE_COLS)
    acuity_stemi = acuity_clf.predict(sample_stemi)[0]
    caps_stemi = cap_clf.predict(sample_stemi)[0]
    print(f"Test Case 2 [Acute STEMI]: Predicted Acuity={acuity_stemi} (Expected: ESI-1 or ESI-2)")
    print(f"Test Case 2 [Acute STEMI]: Cath Lab Requirement={caps_stemi[0]} (Expected: 1)")
    assert caps_stemi[0] == 1, "Expected 24/7 Cath Lab requirement for STEMI"
    
    # Test Case 3: Mild Outpatient
    sample_mild = pd.DataFrame([[28, 0, 76, 120, 80, 98, 16, 15, 37.2, 0, 0, 0, 95]], columns=FEATURE_COLS)
    acuity_mild = acuity_clf.predict(sample_mild)[0]
    caps_mild = cap_clf.predict(sample_mild)[0]
    print(f"Test Case 3 [Mild Patient]: Predicted Acuity={acuity_mild} (Expected: ESI-3 or ESI-4)")
    print(f"Test Case 3 [Mild Patient]: Total specialized units needed={sum(caps_mild)} (Expected: 0)")
    assert sum(caps_mild) == 0, "Expected zero specialized tertiary units for mild outpatient"
    
    print("\nALL CLINICAL TRIAGE & CAPABILITY ML TESTS PASSED! (100% PASS)")

def run_all_tests():
    test_preprocessor()
    test_model_predictions()

if __name__ == '__main__':
    run_all_tests()
