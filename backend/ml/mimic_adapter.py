"""
MIMIC-IV-ED (PhysioNet) Benchmark Dataset Adapter
Converts raw MIMIC-IV Emergency Department triage records into MedCatalyst's 13-feature schema.
"""

import os
import pandas as pd
from typing import Optional

def convert_mimic_triage_to_medcatalyst(
    triage_csv_path: str,
    output_csv_path: Optional[str] = None,
    max_records: Optional[int] = 50000
) -> pd.DataFrame:
    """
    Reads MIMIC-IV-ED triage.csv and maps columns:
      - temperature -> body_temp (auto-detects and converts Fahrenheit to Celsius)
      - heartrate -> heart_rate
      - resprate -> resp_rate
      - o2sat -> spo2
      - sbp -> systolic_bp
      - dbp -> diastolic_bp
      - acuity -> acuity (ESI 1..5 mapped to ESI-1..4)
    """
    if not os.path.exists(triage_csv_path):
        raise FileNotFoundError(f"MIMIC triage CSV not found at: {triage_csv_path}")

    print(f"Loading MIMIC-IV-ED records from {triage_csv_path}...")
    df = pd.read_csv(triage_csv_path, nrows=max_records)

    mapped = pd.DataFrame()
    mapped['patient_id'] = df.get('stay_id', df.index).astype(str)

    # Vitals mapping
    mapped['heart_rate'] = pd.to_numeric(df.get('heartrate'), errors='coerce')
    mapped['systolic_bp'] = pd.to_numeric(df.get('sbp'), errors='coerce')
    mapped['diastolic_bp'] = pd.to_numeric(df.get('dbp'), errors='coerce')
    mapped['resp_rate'] = pd.to_numeric(df.get('resprate'), errors='coerce')
    mapped['spo2'] = pd.to_numeric(df.get('o2sat'), errors='coerce')

    # Temperature (MIMIC records in Fahrenheit; convert if > 45)
    temp = pd.to_numeric(df.get('temperature'), errors='coerce')
    mapped['body_temp'] = temp.apply(lambda f: round((f - 32) * 5 / 9, 1) if pd.notna(f) and f > 45 else f)

    # Defaults for features not in MIMIC triage table
    mapped['age'] = 45  # Or merged from patients.csv if present
    mapped['is_pediatric'] = 0
    mapped['gcs'] = 15
    mapped['ecg_stemi'] = 0
    mapped['trauma'] = 0
    mapped['fast_score'] = 0
    mapped['blood_glucose'] = 110

    # Acuity mapping (ESI 1 to 5)
    acuity_map = {1: 'ESI-1', 2: 'ESI-2', 3: 'ESI-3', 4: 'ESI-4', 5: 'ESI-4'}
    mapped['acuity'] = pd.to_numeric(df.get('acuity'), errors='coerce').map(acuity_map)

    # Capability targets (derived from vital indicators)
    mapped['req_cath_lab'] = 0
    mapped['req_neuro_icu'] = 0
    mapped['req_trauma_ot'] = 0
    mapped['req_ventilator'] = mapped['spo2'].apply(lambda s: 1 if pd.notna(s) and s < 85 else 0)
    mapped['req_pediatric_icu'] = 0

    # Filter rows with valid acuity
    mapped = mapped.dropna(subset=['acuity'])

    if output_csv_path:
        os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
        mapped.to_csv(output_csv_path, index=False)
        print(f"Saved {len(mapped)} converted records to {output_csv_path}")

    return mapped

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        convert_mimic_triage_to_medcatalyst(
            sys.argv[1], 
            sys.argv[2] if len(sys.argv) > 2 else 'backend/ml/data/mimic_converted.csv'
        )
    else:
        print("Usage: python mimic_adapter.py <path_to_triage.csv> [output_path.csv]")
