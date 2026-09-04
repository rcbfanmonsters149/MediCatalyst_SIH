import React from 'react';
import { HospitalAmbulancePortalTab } from '../components/hospital/HospitalAmbulancePortalTab';
import { useApp } from '../context/AppContext';

export const AmbulanceCockpit: React.FC = () => {
  const { hospitals, activeDispatch } = useApp();
  const currentHospital = hospitals.find(h => h.id === activeDispatch?.currentHospitalId) || hospitals[0];

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HospitalAmbulancePortalTab hospital={currentHospital} />
      </div>
    </div>
  );
};
