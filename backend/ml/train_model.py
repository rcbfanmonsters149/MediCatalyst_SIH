"""
Emergency Triage & Hospital Capability Matching Model
Trained manually on clinical emergency triage criteria (Emergency Severity Index - ESI).
Predicts patient acuity and specialized hospital capability requirements from in-ambulance telemetry.
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

def generate_emergency_dataset(n_samples=6000, random_state=42):
    np.random.seed(random_state)
    data = []
    
    for _ in range(n_samples):
        # 0: Mild, 1: Acute STEMI/Cardiac, 2: Severe Trauma, 3: Acute Stroke, 4: Respiratory, 5: Sepsis
        archetype = np.random.choice([0, 1, 2, 3, 4, 5], p=[0.25, 0.20, 0.20, 0.15, 0.10, 0.10])
        age = int(np.random.randint(5, 88))
        is_pediatric = 1 if age < 14 else 0
        
        if archetype == 0:  # Mild
            hr = int(np.random.normal(78, 10))
            sbp = int(np.random.normal(122, 12))
            dbp = int(np.random.normal(80, 8))
            spo2 = int(np.clip(np.random.normal(98, 1), 94, 100))
            rr = int(np.random.normal(16, 2))
            gcs = 15
            temp = round(float(np.random.normal(36.8, 0.5)), 1)
            ecg_stemi = 0
            trauma = 0
            fast_score = 0
            glucose = int(np.random.normal(105, 15))
            acuity = "ESI-4" if np.random.rand() > 0.3 else "ESI-3"
            req_cath = 0
            req_neuro = 0
            req_trauma = 0
            req_vent = 0
            req_picu = 0

        elif archetype == 1:  # Cardiac / STEMI
            hr = int(np.clip(np.random.normal(115, 25), 40, 180))
            sbp = int(np.clip(np.random.normal(100, 30), 65, 200))
            dbp = int(sbp * 0.65)
            spo2 = int(np.clip(np.random.normal(93, 4), 82, 99))
            rr = int(np.random.normal(24, 4))
            gcs = int(np.clip(np.random.choice([15, 14, 13, 10], p=[0.6, 0.2, 0.1, 0.1]), 3, 15))
            temp = round(float(np.random.normal(36.7, 0.4)), 1)
            ecg_stemi = 1 if np.random.rand() > 0.15 else 0
            trauma = 0
            fast_score = 0
            glucose = int(np.random.normal(130, 30))
            acuity = "ESI-1" if (ecg_stemi == 1 or sbp < 85 or gcs < 12) else "ESI-2"
            req_cath = 1 if (ecg_stemi == 1 or sbp < 90) else 0
            req_neuro = 0
            req_trauma = 0
            req_vent = 1 if (spo2 < 88 or gcs < 9) else 0
            req_picu = 0

        elif archetype == 2:  # Severe Trauma / Bike accident
            hr = int(np.clip(np.random.normal(125, 20), 80, 175))
            sbp = int(np.clip(np.random.normal(90, 25), 55, 150))
            dbp = int(sbp * 0.6)
            spo2 = int(np.clip(np.random.normal(91, 5), 75, 98))
            rr = int(np.clip(np.random.normal(26, 6), 10, 42))
            gcs = int(np.clip(np.random.choice([6, 8, 9, 11, 14], p=[0.25, 0.25, 0.2, 0.15, 0.15]), 3, 15))
            temp = round(float(np.random.normal(36.4, 0.8)), 1)
            ecg_stemi = 0
            trauma = 1
            fast_score = 0
            glucose = int(np.random.normal(120, 25))
            acuity = "ESI-1" if (gcs <= 8 or sbp < 80) else "ESI-2"
            req_cath = 0
            req_neuro = 1 if gcs <= 10 else 0
            req_trauma = 1
            req_vent = 1 if (spo2 < 86 or gcs <= 8) else 0
            req_picu = 1 if is_pediatric else 0

        elif archetype == 3:  # Acute Stroke
            hr = int(np.clip(np.random.normal(88, 15), 60, 130))
            sbp = int(np.clip(np.normal(175, 25) if hasattr(np, 'normal') else np.random.normal(175, 25), 140, 230))
            dbp = int(np.clip(np.random.normal(105, 15), 85, 135))
            spo2 = int(np.clip(np.random.normal(95, 3), 88, 99))
            rr = int(np.random.normal(18, 3))
            gcs = int(np.clip(np.random.choice([10, 12, 13, 14], p=[0.3, 0.3, 0.2, 0.2]), 3, 15))
            temp = round(float(np.random.normal(37.0, 0.5)), 1)
            ecg_stemi = 0
            trauma = 0
            fast_score = int(np.random.choice([2, 3]))
            glucose = int(np.random.normal(125, 30))
            acuity = "ESI-2" if gcs >= 10 else "ESI-1"
            req_cath = 0
            req_neuro = 1
            req_trauma = 0
            req_vent = 1 if gcs <= 8 else 0
            req_picu = 0

        elif archetype == 4:  # Respiratory
            hr = int(np.clip(np.random.normal(130, 18), 90, 170))
            sbp = int(np.clip(np.random.normal(135, 20), 95, 180))
            dbp = int(sbp * 0.65)
            spo2 = int(np.clip(np.random.normal(78, 8), 60, 89))
            rr = int(np.clip(np.random.normal(36, 6), 28, 48))
            gcs = int(np.clip(np.random.choice([9, 11, 13, 15], p=[0.2, 0.3, 0.3, 0.2]), 3, 15))
            temp = round(float(np.random.normal(37.4, 0.8)), 1)
            ecg_stemi = 0
            trauma = 0
            fast_score = 0
            glucose = int(np.random.normal(110, 20))
            acuity = "ESI-1" if spo2 < 80 else "ESI-2"
            req_cath = 0
            req_neuro = 0
            req_trauma = 0
            req_vent = 1
            req_picu = 1 if is_pediatric else 0

        else:  # Sepsis
            hr = int(np.clip(np.random.normal(128, 15), 100, 165))
            sbp = int(np.clip(np.random.normal(82, 15), 55, 105))
            dbp = int(sbp * 0.6)
            spo2 = int(np.clip(np.random.normal(92, 4), 84, 98))
            rr = int(np.clip(np.random.normal(28, 4), 22, 38))
            gcs = int(np.clip(np.random.choice([11, 13, 14], p=[0.4, 0.4, 0.2]), 3, 15))
            temp = round(float(np.random.choice([39.2, 39.8, 35.2], p=[0.6, 0.3, 0.1])), 1)
            ecg_stemi = 0
            trauma = 0
            fast_score = 0
            glucose = int(np.random.normal(140, 40))
            acuity = "ESI-1" if sbp < 75 else "ESI-2"
            req_cath = 0
            req_neuro = 0
            req_trauma = 0
            req_vent = 1 if (spo2 < 88 or sbp < 70) else 0
            req_picu = 1 if is_pediatric else 0

        data.append({
            'age': age,
            'is_pediatric': is_pediatric,
            'heart_rate': hr,
            'systolic_bp': sbp,
            'diastolic_bp': dbp,
            'spo2': spo2,
            'resp_rate': rr,
            'gcs': gcs,
            'body_temp': temp,
            'ecg_stemi': ecg_stemi,
            'trauma': trauma,
            'fast_score': fast_score,
            'blood_glucose': glucose,
            'acuity': acuity,
            'req_cath_lab': req_cath,
            'req_neuro_icu': req_neuro,
            'req_trauma_ot': req_trauma,
            'req_ventilator': req_vent,
            'req_pediatric_icu': req_picu
        })
        
    return pd.DataFrame(data)

def train_and_export():
    print("1. Generating clinical emergency triage dataset...")
    df = generate_emergency_dataset(n_samples=6000)
    
    feature_cols = [
        'age', 'is_pediatric', 'heart_rate', 'systolic_bp', 'diastolic_bp',
        'spo2', 'resp_rate', 'gcs', 'body_temp', 'ecg_stemi', 'trauma',
        'fast_score', 'blood_glucose'
    ]
    
    X = df[feature_cols]
    y_acuity = df['acuity']
    target_cap_cols = ['req_cath_lab', 'req_neuro_icu', 'req_trauma_ot', 'req_ventilator', 'req_pediatric_icu']
    y_caps = df[target_cap_cols]
    
    X_train, X_test, y_acuity_train, y_acuity_test, y_caps_train, y_caps_test = train_test_split(
        X, y_acuity, y_caps, test_size=0.2, random_state=42
    )
    
    print(f"2. Training Acuity Classifier on {len(X_train)} emergency cases...")
    acuity_clf = RandomForestClassifier(n_estimators=80, max_depth=10, random_state=42)
    acuity_clf.fit(X_train, y_acuity_train)
    acuity_preds = acuity_clf.predict(X_test)
    acuity_acc = accuracy_score(y_acuity_test, acuity_preds)
    print(f"Acuity Classification Accuracy: {acuity_acc:.4f}")
    print(classification_report(y_acuity_test, acuity_preds))
    
    print("3. Training Multi-Capability Matching Classifier...")
    cap_clf = MultiOutputClassifier(RandomForestClassifier(n_estimators=80, max_depth=10, random_state=42))
    cap_clf.fit(X_train, y_caps_train)
    cap_preds = cap_clf.predict(X_test)
    cap_acc = accuracy_score(y_caps_test, cap_preds)
    print(f"Capabilities Accuracy: {cap_acc:.4f}")
    
    os.makedirs('backend/ml/models', exist_ok=True)
    os.makedirs('src/ml_export', exist_ok=True)
    
    joblib.dump(acuity_clf, 'backend/ml/models/acuity_model.joblib')
    joblib.dump(cap_clf, 'backend/ml/models/capability_model.joblib')
    
    metadata = {
        'model_name': 'EmergencyTriageClassifier_v1',
        'algorithm': 'RandomForestClassifier_MultiOutput',
        'training_samples': 6000,
        'features': feature_cols,
        'capability_targets': target_cap_cols,
        'acuity_accuracy': float(acuity_acc),
        'capability_accuracy': float(cap_acc),
        'feature_importances': {
            feat: float(imp) for feat, imp in zip(feature_cols, acuity_clf.feature_importances_)
        }
    }
    
    with open('backend/ml/models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
        
    with open('src/ml_export/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
        
    print("Exported models successfully!")

if __name__ == '__main__':
    train_and_export()
