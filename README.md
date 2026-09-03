# MedCatalyst 🏥🚨
> Connected Healthcare & Real-Time Emergency Response Network (SIH Prototype)

MedCatalyst bridges the information gap between rural citizens, government healthcare facilities (PHCs, CHCs, District Hospitals), and emergency medical responders during the critical **Golden Hour**.

---

## 🌐 Portals

### 1. Citizen Portal (`/`)
* **Live Hospital & Bed Locator**: Real-time availability for General, ICU, Maternity, Oxygen, and Ventilator beds.
* **On-Duty Doctor Rosters**: Clickable staff directory showing specializations, shift timings, room numbers, and live availability (Available, In Surgery, Emergency OT, On Rounds, Off Duty).
* **Visiting Specialists Calendar**: Weekly OPD schedules for rotating specialists to eliminate wasted travel.
* **Golden Hour 2-Minute SOS**: Auto-escalating 108 emergency ambulance dispatch with SLA failover.
* **ABHA Health Profile**: Centralized medical bio-data, allergy alerts, and emergency contacts.

### 2. Hospital Operations Portal (`/hospital`)
* **ID-Based Authentication**: Secure access via ABDM Facility Registry codes.
* **Doctor Roster Management**: Add medical staff and toggle their live status in real time.
* **Bed Capacity Matrix**: Increment/decrement live bed and ventilator counts.
* **108 Dispatch Command**: Review, accept, or failover incoming emergency SOS calls.

---

## 🔑 Demo Hospital Credentials

| Facility Name | Hospital ID | Default PIN |
| :--- | :--- | :--- |
| Rampur Primary Health Center (PHC) | `HOSP-RAMPUR-PHC` | `108108` |
| Bilaspur Community Health Center (CHC) | `HOSP-BILASPUR-CHC` | `108108` |
| Sonipat District Civil Hospital | `HOSP-SONIPAT-DH` | `108108` |
| Apex MedCatalyst Multi-Specialty & Trauma | `HOSP-APEX-01` | `108108` |

---

## 💻 Tech Stack

* **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, React Router DOM v7, Lucide Icons, Leaflet
* **ML / Backend**: Python, FastAPI, Scikit-Learn (Emergency Triage & Capability Matching), Joblib
