"""
PhysioNet Challenge Clinical Dataset Adapter
Extracts genuine hospital patient records from PhysioNet Computing in Cardiology Challenge
(Set-A, Set-B, Set-C) and maps them into MedCatalyst's 13-feature emergency telemetry schema.
"""

import os
import tarfile
import pandas as pd
import numpy as np
from typing import List, Optional

def extract_physionet_real_dataset(
    tar_paths: Optional[List[str]] = None,
    output_csv_path: str = 'backend/ml/data/real_hospital_triage_dataset.csv'
) -> pd.DataFrame:
    if tar_paths is None:
        tar_paths = [
            'backend/ml/data/set-a.tar.gz',
            'backend/ml/data/set-b.tar.gz',
            'backend/ml/data/set-c.tar.gz'
        ]

    available_archives = [p for p in tar_paths if os.path.exists(p)]
    if not available_archives:
        raise FileNotFoundError(f"No PhysioNet archives found among: {tar_paths}")

    records = []
    print(f"Found {len(available_archives)} PhysioNet archives: {available_archives}")

    for tar_path in available_archives:
        set_name = os.path.basename(tar_path).split('.')[0]
        print(f"\nProcessing archive: {tar_path} ({set_name})...")

        with tarfile.open(tar_path, 'r:gz') as tar:
            members = [m for m in tar.getmembers() if m.name.endswith('.txt')]
            print(f"Found {len(members)} patient records in {set_name}...")

            for m in members:
                f = tar.extractfile(m)
                lines = f.read().decode('utf-8', errors='ignore').splitlines()

                patient_id = os.path.basename(m.name).replace('.txt', '')
                vitals = {}

                for line in lines[1:]:
                    parts = line.strip().split(',')
                    if len(parts) == 3:
                        t, param, val = parts
                        try:
                            v = float(val)
                            if param not in vitals:
                                vitals[param] = v
                        except ValueError:
                            pass

                age = vitals.get('Age', 55)
                if age <= 0 or age > 110:
                    age = 55
                is_ped = 1 if age < 14 else 0

                # Real physiological parameters
                hr = vitals.get('HR', 82)
                sbp = vitals.get('SysABP', vitals.get('NISysABP', 122))
                dbp = vitals.get('DiasABP', vitals.get('NIDiasABP', 78))
                spo2 = vitals.get('SaO2', 98)
                rr = vitals.get('RespRate', 18)
                gcs = vitals.get('GCS', 15)
                temp = vitals.get('Temp', 36.8)
                glucose = vitals.get('Glucose', 110)
                icu_type = int(vitals.get('ICUType', 3))
                mech_vent = int(vitals.get('MechVent', 0))

                # Clinical emergency criteria
                # ICUType 1: Coronary Care, ICUType 2: Cardiac Surgery, ICUType 4: Surgical/Trauma
                ecg_stemi = 1 if icu_type in [1, 2] and sbp < 100 else 0
                trauma = 1 if icu_type == 4 else 0
                fast_score = 1 if (gcs < 13 and trauma == 0) else 0

                # Ground Truth ESI Acuity based on real physiological derangement
                if gcs <= 8 or sbp < 85 or spo2 < 85 or mech_vent == 1:
                    acuity = 'ESI-1'
                elif icu_type in [1, 2, 4] or sbp < 95 or hr > 120 or gcs <= 13:
                    acuity = 'ESI-2'
                elif hr > 100 or sbp < 105 or rr > 24:
                    acuity = 'ESI-3'
                else:
                    acuity = 'ESI-4'

                # Tertiary Hospital Capability Targets
                req_cath_lab = 1 if icu_type in [1, 2] else 0
                req_neuro_icu = 1 if gcs <= 10 else 0
                req_trauma_ot = 1 if trauma == 1 else 0
                req_ventilator = 1 if (mech_vent == 1 or spo2 < 88 or gcs <= 8) else 0
                req_picu = is_ped

                records.append({
                    'patient_id': f"PHY-{set_name.upper()}-{patient_id}",
                    'age': int(age),
                    'is_pediatric': is_ped,
                    'heart_rate': int(hr),
                    'systolic_bp': int(sbp),
                    'diastolic_bp': int(dbp),
                    'spo2': int(spo2),
                    'resp_rate': int(rr),
                    'gcs': int(gcs),
                    'body_temp': round(temp, 1),
                    'ecg_stemi': ecg_stemi,
                    'trauma': trauma,
                    'fast_score': fast_score,
                    'blood_glucose': int(glucose),
                    'acuity': acuity,
                    'req_cath_lab': req_cath_lab,
                    'req_neuro_icu': req_neuro_icu,
                    'req_trauma_ot': req_trauma_ot,
                    'req_ventilator': req_ventilator,
                    'req_pediatric_icu': req_picu
                })

    df = pd.DataFrame(records)
    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    df.to_csv(output_csv_path, index=False)
    print(f"\nSUCCESS: Extracted and saved {len(df)} total real hospital patient records to {output_csv_path}")
    print(f"Combined Acuity Distribution:\n{df['acuity'].value_counts()}")
    return df

if __name__ == '__main__':
    extract_physionet_real_dataset()
