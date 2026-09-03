# MedCatalyst 🏥🚨
### Smart India Hackathon (SIH) Prototype
**Empowering Rural & Underserved Communities with Connected Emergency Healthcare & Doctor Availability**

---

## 🌟 Overview

**MedCatalyst** is an intelligent dual-portal healthcare network designed to bridge the critical information gap between rural citizens, government healthcare facilities (PHCs, CHCs, District Hospitals), and emergency medical responders during the **Golden Hour**.

The platform features two synchronized portals:
1. **Public Citizen Portal (`/`)**: A clean, accessible patient interface to search nearby healthcare centers, inspect real-time available beds, view on-duty doctor rosters with live availability status, and initiate an auto-escalating emergency ambulance dispatch.
2. **Hospital Operations Command Portal (`/hospital`)**: A dedicated administrative dashboard for hospital staff to authenticate with unique Hospital IDs, manage doctors' duty rosters (specializations, shifts, real-time availability/busy statuses), adjust bed counts, and handle inbound 108 emergency requests.

---

## 🚀 Key Features

### 👨‍👩‍👧‍👦 1. Public Citizen Portal (`/`)
* **Real-Time Hospital & Bed Locator**: Search facilities by village, block, facility type (PHC, CHC, District Hospital, Apex Center), ICU availability, or 24x7 certification.
* **Interactive Live Doctor Roster**: Click on any hospital to view all on-duty medical officers, their specializations, shift timings, room numbers, and live availability (🟢 Available, 🟡 In Surgery, 🔴 Emergency OT, 🟠 On Ward Rounds, ⚪ Off Duty).
* **Visiting Specialists Calendar**: Live schedules for rotating specialists (Cardiologists, Gynecologists, Pediatricians) to eliminate wasted rural travel.
* **Golden Hour 2-Minute Waterfall SOS Dispatch**: Voice (Hindi/English) and text ambulance requests with an automated 2-minute SLA failover engine that cascades calls to the next hospital if unacknowledged.
* **Citizen Profile & ABHA Digital Locker**: Centralized personal medical records, ABHA health ID card, verified life-threatening allergy alerts (e.g. Penicillin anaphylaxis), and emergency contacts.

### 🏥 2. Hospital Operations Portal (`/hospital`)
* **Unique Hospital ID Authentication**: Secure login via ABDM Facility Registry codes (e.g. `HOSP-RAMPUR-PHC`, `HOSP-BILASPUR-CHC`, `HOSP-SONIPAT-DH`, `HOSP-APEX-01`).
* **Real-Time Doctor Command Roster**: Add new doctors with designation, department, shift timings, and chamber numbers.
* **One-Click Real-Time Status Switcher**: Toggle doctors between *Available*, *In Surgery / OT*, *In Emergency Trauma*, *On Ward Rounds*, and *Off Duty*. Changes are broadcast live to citizens searching on the public portal.
* **Live Bed Matrix Counter**: Real-time increment/decrement controls for General Beds, ICU Beds, Maternity Beds, Oxygen Beds, and Mechanical Ventilators.
* **Inbound Emergency 108 Dispatch Receiver**: Accept dispatch and deploy ambulances or decline with automated failover.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, React Router DOM v7
* **Icons & Maps**: Lucide React, Leaflet & React-Leaflet
* **State & Sync**: React Context API, LocalStorage persistence, Multi-Tab StorageEvent Synchronization
* **Machine Learning / Backend**: Python 3, FastAPI, Scikit-Learn (Random Forest ESI Triage & Hospital Capability Classifier), Joblib

---

## 📦 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)
* Python 3.10+ (optional, for ML server backend)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd SIH_4
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - **Citizen Portal**: [http://localhost:5173/](http://localhost:5173/)
   - **Hospital Portal**: [http://localhost:5173/hospital](http://localhost:5173/hospital)

### Production Build

```bash
npm run build
```

---

## 🔑 Demo Hospital Credentials

When testing the Hospital Operations Portal (`/hospital`), you can use any of the following demo facilities or click the 1-click login chips:

| Facility Name | Hospital ID / Code | Default PIN |
| :--- | :--- | :--- |
| **Rampur Primary Health Center (PHC)** | `HOSP-RAMPUR-PHC` | `108108` |
| **Bilaspur Community Health Center (CHC)** | `HOSP-BILASPUR-CHC` | `108108` |
| **Sonipat District Civil Hospital** | `HOSP-SONIPAT-DH` | `108108` |
| **Apex MedCatalyst Multi-Specialty & Trauma** | `HOSP-APEX-01` | `108108` |

---

## 📜 License

This project was built for the Smart India Hackathon (SIH) prototype evaluation. All rights reserved.
