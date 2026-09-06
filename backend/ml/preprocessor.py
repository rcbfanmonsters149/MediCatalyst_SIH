"""
Clinical Data Preprocessing & Validation Pipeline
Cleans real-world clinical telemetry, handles missing vitals via clinical median imputation,
filters sensor noise, and standardizes features for MedCatalyst models.
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any, Optional

FEATURE_COLS = [
    'age', 'is_pediatric', 'heart_rate', 'systolic_bp', 'diastolic_bp',
    'spo2', 'resp_rate', 'gcs', 'body_temp', 'ecg_stemi', 'trauma',
    'fast_score', 'blood_glucose'
]

CAPABILITY_TARGET_COLS = [
    'req_cath_lab', 'req_neuro_icu', 'req_trauma_ot', 'req_ventilator', 'req_pediatric_icu'
]

# Clinically accepted adult median baseline values for missing sensor telemetry
CLINICAL_DEFAULTS: Dict[str, Any] = {
    'age': 45,
    'is_pediatric': 0,
    'heart_rate': 80,
    'systolic_bp': 120,
    'diastolic_bp': 80,
    'spo2': 98,
    'resp_rate': 16,
    'gcs': 15,
    'body_temp': 36.8,
    'ecg_stemi': 0,
    'trauma': 0,
    'fast_score': 0,
    'blood_glucose': 110
}

# Physiological plausibility boundaries (filters out disconnected sensors / motion artifacts)
PHYSIOLOGICAL_BOUNDS = {
    'heart_rate': (20, 260),
    'systolic_bp': (40, 260),
    'diastolic_bp': (20, 180),
    'spo2': (40, 100),
    'resp_rate': (4, 65),
    'gcs': (3, 15),
    'body_temp': (30.0, 44.0),
    'fast_score': (0, 3),
    'blood_glucose': (20, 600)
}

def standardize_acuity_label(val: Any) -> Optional[str]:
    """Standardizes various acuity representations to ESI-1, ESI-2, ESI-3, ESI-4."""
    if pd.isna(val):
        return None
    val_str = str(val).strip().upper()
    if val_str in ['1', 'ESI-1', 'ESI 1', 'RESUSCITATION']:
        return 'ESI-1'
    elif val_str in ['2', 'ESI-2', 'ESI 2', 'EMERGENT']:
        return 'ESI-2'
    elif val_str in ['3', 'ESI-3', 'ESI 3', 'URGENT']:
        return 'ESI-3'
    elif val_str in ['4', '5', 'ESI-4', 'ESI-5', 'ESI 4', 'ESI 5', 'LESS URGENT', 'NON-URGENT']:
        return 'ESI-4'
    return val_str

def preprocess_clinical_dataset(
    df: pd.DataFrame, 
    is_training: bool = True
) -> pd.DataFrame:
    """
    Cleans and preprocesses a clinical dataframe.
    - Imputes missing columns and values with clinical baselines.
    - Clips extreme non-physiological outliers.
    - Enforces binary and integer types where appropriate.
    """
    cleaned = df.copy()

    # Ensure all 13 feature columns exist in dataframe
    for col in FEATURE_COLS:
        if col not in cleaned.columns:
            cleaned[col] = CLINICAL_DEFAULTS[col]

    # Calculate is_pediatric dynamically if age is present but is_pediatric is missing
    if 'age' in cleaned.columns:
        cleaned['age'] = pd.to_numeric(cleaned['age'], errors='coerce').fillna(CLINICAL_DEFAULTS['age'])
        cleaned['is_pediatric'] = cleaned.apply(
            lambda r: 1 if r['age'] < 14 else (0 if pd.isna(r.get('is_pediatric')) else int(r['is_pediatric'])), 
            axis=1
        )

    # Impute missing feature values
    for col, default_val in CLINICAL_DEFAULTS.items():
        cleaned[col] = pd.to_numeric(cleaned[col], errors='coerce').fillna(default_val)

    # Clip outliers to physiologically possible bounds
    for col, (min_val, max_val) in PHYSIOLOGICAL_BOUNDS.items():
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].clip(lower=min_val, upper=max_val)

    # Convert discrete columns to integer
    int_cols = ['age', 'is_pediatric', 'heart_rate', 'systolic_bp', 'diastolic_bp', 
                'spo2', 'resp_rate', 'gcs', 'ecg_stemi', 'trauma', 'fast_score', 'blood_glucose']
    for col in int_cols:
        cleaned[col] = cleaned[col].round().astype(int)

    cleaned['body_temp'] = cleaned['body_temp'].round(1).astype(float)

    if is_training:
        # Require target acuity label for training
        if 'acuity' in cleaned.columns:
            cleaned['acuity'] = cleaned['acuity'].apply(standardize_acuity_label)
            cleaned = cleaned.dropna(subset=['acuity'])
        else:
            raise ValueError("Training dataset must contain an 'acuity' target column.")

        # Ensure capability targets exist, filling missing with 0
        for cap in CAPABILITY_TARGET_COLS:
            if cap not in cleaned.columns:
                cleaned[cap] = 0
            else:
                cleaned[cap] = pd.to_numeric(cleaned[cap], errors='coerce').fillna(0).astype(int).clip(0, 1)

    return cleaned

def extract_features_and_targets(
    df: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    """Splits preprocessed DataFrame into X features, y_acuity, and y_capabilities."""
    X = df[FEATURE_COLS]
    y_acuity = df['acuity']
    y_caps = df[CAPABILITY_TARGET_COLS]
    return X, y_acuity, y_caps
