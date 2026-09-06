# Clinical Emergency Triage Datasets (MedCatalyst)

This directory houses clinical datasets for training MedCatalyst's emergency acuity and hospital capability models.

## Dataset Structure

Files should be in CSV format with the following columns:

### 1. Patient Identifiers & Metadata
* `patient_id`: Unique anonymized record ID (e.g. `PT-1001`). Note: Do **NOT** include real PII (names, Aadhaar, ABHA, phone numbers).
* `age`: Age in years (0 to 110).
* `is_pediatric`: `1` if age < 14, else `0`.

### 2. Vital Signs & Telemetry (13 Model Features)
* `heart_rate`: Heart rate in beats per minute (e.g. 40 - 220).
* `systolic_bp`: Systolic blood pressure in mmHg (e.g. 50 - 240).
* `diastolic_bp`: Diastolic blood pressure in mmHg (e.g. 30 - 140).
* `spo2`: Blood oxygen saturation percentage (40 - 100).
* `resp_rate`: Respiratory rate in breaths per minute (6 - 60).
* `gcs`: Glasgow Coma Scale (3 to 15).
* `body_temp`: Body temperature in °C (32.0 to 42.0).
* `ecg_stemi`: Binary flag (`1` for ST-Elevation Myocardial Infarction detected on 12-lead ECG, else `0`).
* `trauma`: Binary flag (`1` for blunt/penetrating polytrauma, else `0`).
* `fast_score`: Cincinnati Prehospital / FAST stroke score (0 to 3: facial droop, arm drift, abnormal speech).
* `blood_glucose`: Random blood sugar in mg/dL (20 to 600).

### 3. Target Labels (Ground Truth)
* `acuity`: Clinical Emergency Severity Index acuity: `ESI-1`, `ESI-2`, `ESI-3`, or `ESI-4`.
* `req_cath_lab`: `1` if patient required emergency cardiac catheterization (angioplasty), else `0`.
* `req_neuro_icu`: `1` if patient required neurosurgical intervention or neuro-ICU monitoring, else `0`.
* `req_trauma_ot`: `1` if patient required emergency trauma operating theater resuscitation, else `0`.
* `req_ventilator`: `1` if patient required invasive mechanical ventilation, else `0`.
* `req_pediatric_icu`: `1` if patient required pediatric intensive care (PICU), else `0`.

## Handling Missing Data
The preprocessing pipeline (`backend/ml/preprocessor.py`) automatically imputes missing vitals with clinical medians and clips sensor noise, so incomplete in-transit telemetry does not crash training.
