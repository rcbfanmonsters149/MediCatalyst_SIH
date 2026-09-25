import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Scan, 
  X, 
  Camera, 
  Upload, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Stethoscope, 
  Heart, 
  FileText, 
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  UserCheck
} from '../icons';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Hospital, UserBioData } from '../../types';
import { recordAuditEvent } from '../../services/blockchainService';
import { useNavigate } from 'react-router-dom';

interface DoctorQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital;
  onNotify: (msg: string) => void;
  onOpenPrescriptionForUser?: (user: UserBioData) => void;
}

export const DoctorQrScannerModal: React.FC<DoctorQrScannerModalProps> = ({
  isOpen,
  onClose,
  hospital,
  onNotify,
  onOpenPrescriptionForUser
}) => {
  const { user, blockchainNetwork } = useApp();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [scanMode, setScanMode] = useState<'CAMERA' | 'FILE' | 'MANUAL'>('CAMERA');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [scannedPatient, setScannedPatient] = useState<UserBioData | null>(null);
  const [scanRawData, setScanRawData] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'hospital-qr-scanner-region';

  // Handle successful QR Code detection
  const handleScanSuccess = async (decodedText: string) => {
    setScanRawData(decodedText);
    
    // Stop camera once scanned
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
    }

    // Resolve patient (in our demo app, maps to the sovereign user or checks ABHA)
    setScannedPatient(user);

    // Record on-chain audit log for hospital doctor
    try {
      await recordAuditEvent({
        recordIdHash: `ABHA:${user.healthId}`,
        accessor: hospital.id,
        accessorName: `${hospital.doctorsOnDuty[0]?.name || 'Medical Officer'} (${hospital.name})`,
        actionType: 'RECORD_ACCESSED',
        blockNumber: blockchainNetwork.currentBlock + 1,
        txHash: `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
        details: `Doctor at ${hospital.name} unlocked patient records via OPD scanner workstation`
      });
    } catch (e) {
      console.error(e);
    }

    onNotify(`Patient ${user.fullName} (${user.healthId}) identified! Records unlocked.`);
  };

  // Start Camera Scanning
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 }
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera start error:', err);
      setCameraError(
        err?.message || 'Camera access denied or no camera device found. You can upload an image or enter ABHA ID manually.'
      );
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && scanMode === 'CAMERA' && !scannedPatient) {
      const timer = setTimeout(() => {
        startCamera();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode, scannedPatient]);

  // Handle File Upload Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }
      const decodedText = await scannerRef.current.scanFile(file, true);
      handleScanSuccess(decodedText);
    } catch (err: any) {
      alert('Could not decode QR code from the selected image. Please make sure the QR is clear and well-lit.');
    }
  };

  // Handle Manual Look-Up
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    // Matches demo user
    setScannedPatient(user);
    onNotify(`Patient ${user.fullName} (${user.healthId}) loaded via manual search!`);
  };

  const handleResetScanner = () => {
    setScannedPatient(null);
    setScanRawData(null);
    setManualInput('');
    setScanMode('CAMERA');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg font-heading">
                  Scan Patient Health QR
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ABDM Verified
                </span>
              </div>
              <p className="text-xs text-blue-200">
                {hospital.name} • Clinical OPD / Emergency Triage Desk
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Mode Toggle (Camera vs File vs Manual) */}
        {!scannedPatient && (
          <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 text-xs font-bold">
            <button
              onClick={() => {
                setScanMode('CAMERA');
                startCamera();
              }}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                scanMode === 'CAMERA'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Stream</span>
            </button>

            <button
              onClick={() => {
                stopCamera();
                setScanMode('FILE');
              }}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                scanMode === 'FILE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload QR Image</span>
            </button>

            <button
              onClick={() => {
                stopCamera();
                setScanMode('MANUAL');
              }}
              className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                scanMode === 'MANUAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual ABHA ID</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* STATE 1: SCANNING IN PROGRESS */}
          {!scannedPatient && (
            <div className="space-y-4">
              
              {/* Camera Scanner View */}
              {scanMode === 'CAMERA' && (
                <div className="space-y-3">
                  <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden border-2 border-dashed border-blue-400 bg-slate-950 min-h-[260px] flex items-center justify-center">
                    <div id={qrRegionId} className="w-full"></div>
                    
                    {cameraError && (
                      <div className="p-4 text-center text-rose-300 text-xs space-y-2 absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                        <p className="font-semibold">{cameraError}</p>
                        <button
                          onClick={() => setScanMode('MANUAL')}
                          className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 cursor-pointer"
                        >
                          Use Manual Search Instead
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs text-slate-500">
                    Hold the patient's phone or physical health card QR code in front of the camera.
                  </p>
                </div>
              )}

              {/* File Upload View */}
              {scanMode === 'FILE' && (
                <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-4 bg-slate-50 hover:bg-blue-50/50 transition">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Select QR Code Image</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Upload a photo, screenshot, or scan of the patient's QR code</p>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition">
                    <span>Browse Image File</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              )}

              {/* Manual ABHA Input View */}
              {scanMode === 'MANUAL' && (
                <form onSubmit={handleManualSearch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Enter Patient ABHA ID or Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. 91-2849-5830-1092 or 98765 43210"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Quick Demo Button */}
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                    <span className="text-blue-900 font-medium">Quick Demo Patient: <strong>{user.fullName} ({user.healthId})</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setScannedPatient(user);
                        onNotify(`Demo patient loaded: ${user.fullName}`);
                      }}
                      className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      Load Patient
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* STATE 2: PATIENT SUCCESSFULLY IDENTIFIED */}
          {scannedPatient && (
            <div className="space-y-5 animate-in fade-in">
              
              {/* Verification Success Pill */}
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                    <span>Patient Health Records Unlocked</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-emerald-800 mt-0.5">
                    ABHA Sovereign consent verified on-chain. Zero raw PHI exposure.
                  </p>
                </div>
              </div>

              {/* Patient Quick Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                      {scannedPatient.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">
                        {scannedPatient.fullName}
                      </h4>
                      <div className="text-xs font-mono font-bold text-blue-700">
                        ABHA: {scannedPatient.healthId}
                      </div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                    <span>{scannedPatient.bloodGroup}</span>
                  </span>
                </div>

                {/* Vitals Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-3 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Age & Gender</span>
                    <strong className="text-slate-800">{scannedPatient.age} Yrs • {scannedPatient.gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <strong className="text-slate-800">{scannedPatient.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Past Records</span>
                    <strong className="text-blue-700">{scannedPatient.pastRecords.length} Hospital Visits</strong>
                  </div>
                </div>

                {/* Allergy Red Alert */}
                {scannedPatient.allergies && scannedPatient.allergies.length > 0 && (
                  <div className="p-3 bg-rose-100/70 border border-rose-300 rounded-xl text-xs space-y-1">
                    <span className="font-extrabold text-rose-900 flex items-center gap-1 text-[11px] uppercase tracking-wide">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Contraindicated Allergies Alert:</span>
                    </span>
                    <p className="text-rose-950 font-bold">
                      {scannedPatient.allergies.map(a => `${a.allergen} (${a.reaction})`).join('; ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for the Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/records?abha=${encodeURIComponent(scannedPatient.healthId)}`);
                  }}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  <span>Open Full EHR Clinical File</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPrescriptionForUser) {
                      onOpenPrescriptionForUser(scannedPatient);
                    } else {
                      navigate(`/records?abha=${encodeURIComponent(scannedPatient.healthId)}`);
                    }
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Issue Rx & Lab Records</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResetScanner}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Another Patient QR</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
