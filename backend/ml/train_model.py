"""
Emergency Triage & Hospital Capability Matching Model Trainer
Supports training on:
  1. Real-world CSV datasets (e.g. hospital exports or emergency_triage_template.csv)
  2. SQL Databases (PostgreSQL / SQLite via SQLAlchemy)
  3. MIMIC-IV-ED Benchmark
  4. Clinical Synthetic Generator (Fallback / Testing)
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.multioutput import MultiOutputClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib

# Import clinical preprocessor
try:
    from backend.ml.preprocessor import (
        FEATURE_COLS, CAPABILITY_TARGET_COLS, 
        preprocess_clinical_dataset, extract_features_and_targets
    )
except ImportError:
    # Handle direct script execution from within ml directory
    from preprocessor import (
        FEATURE_COLS, CAPABILITY_TARGET_COLS, 
        preprocess_clinical_dataset, extract_features_and_targets
    )

def generate_emergency_dataset(n_samples=6000, random_state=42) -> pd.DataFrame:
    """Generates synthetic clinical emergency dataset based on ESI criteria (fallback mode)."""
    np.random.seed(random_state)
    data = []
    
    for _ in range(n_samples):
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
            sbp = int(np.clip(np.random.normal(175, 25), 140, 230))
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

def load_from_csv(file_path: str) -> pd.DataFrame:
    """Loads and preprocesses clinical data from a CSV file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset CSV not found at: {file_path}")
    print(f"Loading data from CSV: {file_path}")
    df = pd.read_csv(file_path)
    return preprocess_clinical_dataset(df, is_training=True)

def load_from_db(db_url: str) -> pd.DataFrame:
    """Loads clinical data from a SQL database table."""
    try:
        from sqlalchemy import create_engine
    except ImportError:
        raise ImportError("sqlalchemy is required to load from a database. Run: pip install sqlalchemy")
    
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url)
    query = "SELECT * FROM emergency_triage_records WHERE acuity IS NOT NULL;"
    df = pd.read_sql(query, engine)
    return preprocess_clinical_dataset(df, is_training=True)

def load_from_mimic(mimic_path: str) -> pd.DataFrame:
    """Loads and converts from a MIMIC-IV-ED triage file."""
    try:
        from backend.ml.mimic_adapter import convert_mimic_triage_to_medcatalyst
    except ImportError:
        from mimic_adapter import convert_mimic_triage_to_medcatalyst
    
    df = convert_mimic_triage_to_medcatalyst(mimic_path)
    return preprocess_clinical_dataset(df, is_training=True)

def train_and_export(
    source: str = 'csv',
    data_path: str = 'backend/ml/data/emergency_triage_template.csv',
    db_url: str = None,
    synthetic_samples: int = 6000
):
    print("=" * 60)
    print(f"MedCatalyst ML Training Pipeline: Source = [{source.upper()}]")
    print("=" * 60)

    # 1. Ingest Dataset
    if source == 'csv':
        if os.path.exists(data_path):
            df = load_from_csv(data_path)
            # If CSV has very few template rows (< 100), augment with synthetic to ensure stable training
            if len(df) < 100:
                print(f"Notice: CSV contains {len(df)} records. Augmenting with synthetic clinical archetypes for full distribution coverage...")
                synth_df = generate_emergency_dataset(n_samples=synthetic_samples)
                synth_df = preprocess_clinical_dataset(synth_df, is_training=True)
                df = pd.concat([df, synth_df], ignore_index=True)
        else:
            print(f"Warning: CSV at {data_path} not found. Falling back to synthetic clinical dataset.")
            df = generate_emergency_dataset(n_samples=synthetic_samples)
            df = preprocess_clinical_dataset(df, is_training=True)

    elif source == 'db':
        if not db_url:
            raise ValueError("Must provide --db-url when using --source db")
        df = load_from_db(db_url)

    elif source == 'mimic':
        df = load_from_mimic(data_path)

    else:  # synthetic
        print(f"Generating synthetic clinical triage dataset with {synthetic_samples} cases...")
        df = generate_emergency_dataset(n_samples=synthetic_samples)
        df = preprocess_clinical_dataset(df, is_training=True)

    print(f"Total clinical records ready for training: {len(df)}")
    print(f"Acuity class distribution:\n{df['acuity'].value_counts()}")

    # 2. Extract Features & Targets
    X, y_acuity, y_caps = extract_features_and_targets(df)

    X_train, X_test, y_acuity_train, y_acuity_test, y_caps_train, y_caps_test = train_test_split(
        X, y_acuity, y_caps, test_size=0.2, random_state=42, stratify=y_acuity
    )

    # 3. Train Acuity Classifier with Balanced Class Weights (Critical for real-world clinical skew)
    print(f"\nTraining Acuity Classifier on {len(X_train)} patient cases (RandomForest with class_weight='balanced')...")
    acuity_clf = RandomForestClassifier(
        n_estimators=100, 
        max_depth=12, 
        class_weight='balanced', 
        random_state=42,
        n_jobs=-1
    )
    acuity_clf.fit(X_train, y_acuity_train)
    acuity_preds = acuity_clf.predict(X_test)
    acuity_acc = accuracy_score(y_acuity_test, acuity_preds)
    print(f"Acuity Classification Accuracy: {acuity_acc:.4f}")
    print("\nDetailed Clinical Acuity Classification Report:")
    print(classification_report(y_acuity_test, acuity_preds, zero_division=0))

    # 4. Train Multi-Capability Matching Classifier
    print("Training Multi-Capability Matching Classifier...")
    cap_clf = MultiOutputClassifier(
        RandomForestClassifier(
            n_estimators=100, 
            max_depth=12, 
            class_weight='balanced', 
            random_state=42,
            n_jobs=-1
        )
    )
    cap_clf.fit(X_train, y_caps_train)
    cap_preds = cap_clf.predict(X_test)
    cap_acc = accuracy_score(y_caps_test, cap_preds)
    print(f"Hospital Capabilities Matching Accuracy: {cap_acc:.4f}")

    # 5. Export Models & Rich Metadata
    os.makedirs('backend/ml/models', exist_ok=True)
    os.makedirs('src/ml_export', exist_ok=True)

    joblib.dump(acuity_clf, 'backend/ml/models/acuity_model.joblib')
    joblib.dump(cap_clf, 'backend/ml/models/capability_model.joblib')

    metadata = {
        'model_name': 'EmergencyTriageClassifier_v2_RealDataReady',
        'algorithm': 'RandomForestClassifier_MultiOutput_Balanced',
        'data_source': source,
        'training_samples': len(df),
        'features': FEATURE_COLS,
        'capability_targets': CAPABILITY_TARGET_COLS,
        'acuity_accuracy': float(acuity_acc),
        'capability_accuracy': float(cap_acc),
        'classes': list(acuity_clf.classes_),
        'feature_importances': {
            feat: float(imp) for feat, imp in zip(FEATURE_COLS, acuity_clf.feature_importances_)
        }
    }

    with open('backend/ml/models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    with open('src/ml_export/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)

    print("\nSUCCESS: Exported trained models and metadata to 'backend/ml/models/' and 'src/ml_export/'!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train MedCatalyst Emergency Triage ML Models")
    parser.add_argument(
        '--source', 
        choices=['csv', 'db', 'mimic', 'synthetic'], 
        default='csv',
        help="Data source: 'csv', 'db', 'mimic', or 'synthetic'"
    )
    parser.add_argument(
        '--data-path', 
        default='backend/ml/data/emergency_triage_template.csv',
        help="Path to CSV or MIMIC dataset file"
    )
    parser.add_argument(
        '--db-url', 
        default=None,
        help="Database URI (e.g. postgresql://user:pass@localhost/db or sqlite:///data.db)"
    )
    parser.add_argument(
        '--synthetic-samples', 
        type=int, 
        default=6000,
        help="Number of synthetic cases to generate in synthetic or augmentation mode"
    )

    args = parser.parse_args()
    train_and_export(
        source=args.source,
        data_path=args.data_path,
        db_url=args.db_url,
        synthetic_samples=args.synthetic_samples
    )
