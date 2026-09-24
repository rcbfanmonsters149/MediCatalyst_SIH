import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  Eye, 
  Check, 
  Copy, 
  Heart, 
  Lock, 
  Printer, 
  X,
  Stethoscope
} from '../icons';
import { UserBioData } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface AbhaQrCardProps {
  user: UserBioData;
  isOpen: boolean;
  onClose: () => void;
}

export type AccessScope = 'FULL_EHR' | 'EMERGENCY_ONLY';

export const AbhaQrCard: React.FC<AbhaQrCardProps> = ({ user, isOpen, onClose }) => {
  const { language } = useLanguage();
  const [scope, setScope] = useState<AccessScope>('FULL_EHR');
  const [tokenSalt, setTokenSalt] = useState<string>(() => {
    return localStorage.getItem('medcatalyst_qr_salt') || Math.random().toString(36).substring(2, 9);
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Construct target access URL
  const recordAccessUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/records?abha=${encodeURIComponent(user.healthId)}&token=${tokenSalt}&scope=${scope}`
    : `https://medcatalyst.gov.in/records?abha=${encodeURIComponent(user.healthId)}`;

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    QRCode.toDataURL(recordAccessUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => console.error('Failed to generate QR:', err));

    return () => {
      isMounted = false;
    };
  }, [recordAccessUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(recordAccessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerateToken = () => {
    setIsRegenerating(true);
    const newSalt = Math.random().toString(36).substring(2, 9);
    localStorage.setItem('medcatalyst_qr_salt', newSalt);
    setTokenSalt(newSalt);
    setTimeout(() => setIsRegenerating(false), 400);
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to print your Health QR card.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ABDM_Health_Card_${user.healthId}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: #fff; color: #0f172a; padding: 20px; }
            .card {
              max-width: 520px;
              margin: 0 auto;
              border: 2px solid #0284c7;
              border-radius: 18px;
              padding: 24px;
              background: #ffffff;
              box-shadow: 0 4px 15px rgba(0,0,0,0.06);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0284c7;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .gov-badge {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              color: #0369a1;
              letter-spacing: 0.5px;
            }
            .title {
              font-size: 19px;
              font-weight: 900;
              color: #0f172a;
              margin: 4px 0 0 0;
            }
            .body-grid {
              display: grid;
              grid-template-columns: 1fr 140px;
              gap: 16px;
              align-items: center;
            }
            .info-item {
              margin-bottom: 8px;
            }
            .label {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .value {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
            .qr-box {
              text-align: center;
              background: #f8fafc;
              padding: 10px;
              border-radius: 12px;
              border: 1px solid #cbd5e1;
            }
            .qr-box img {
              width: 120px;
              height: 120px;
              display: block;
            }
            .footer-note {
              margin-top: 16px;
              font-size: 10px;
              color: #475569;
              text-align: center;
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <div class="gov-badge">Government of India • Ayushman Bharat Digital Mission</div>
                <div class="title">ABHA Smart Emergency Health Card</div>
              </div>
              <div style="font-weight: 800; color: #0284c7; font-size: 11px; border: 1px solid #0284c7; padding: 3px 8px; border-radius: 6px;">
                EHR VERIFIED
              </div>
            </div>

            <div class="body-grid">
              <div>
                <div class="info-item">
                  <div class="label">Patient Full Name</div>
                  <div class="value" style="font-size: 17px; color: #0369a1;">${user.fullName}</div>
                </div>

                <div class="info-item">
                  <div class="label">ABHA Health ID Number</div>
                  <div class="value" style="font-family: monospace; font-size: 15px;">${user.healthId}</div>
                </div>

                <div style="display: flex; gap: 20px; margin-top: 6px;">
                  <div class="info-item">
                    <div class="label">Age / Gender</div>
                    <div class="value">${user.age} Yrs / ${user.gender}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Blood Group</div>
                    <div class="value" style="color: #dc2626; font-size: 15px;">${user.bloodGroup}</div>
                  </div>
                </div>

                <div class="info-item" style="margin-top: 4px;">
                  <div class="label">Emergency Contact</div>
                  <div class="value">${user.emergencyContacts[0]?.name || 'Family'} (${user.emergencyContacts[0]?.phone || user.phone})</div>
                </div>
              </div>

              <div class="qr-box">
                <img src="${qrDataUrl}" alt="Patient QR Code" />
                <div style="font-size: 9px; font-weight: 800; color: #0369a1; margin-top: 4px;">SCAN FOR EHR</div>
              </div>
            </div>

            <div class="footer-note">
              Scanned by authorized healthcare providers to access patient medical records securely on the National Health Grid.
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div 
        ref={cardRef}
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900 max-h-[92vh]"
      >
        {/* Modal Header (Clean Light Theme) */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                  {language === 'hi' 
                    ? 'आभा स्मार्ट डिजिटल स्वास्थ्य क्यूआर कोड' 
                    : (language === 'mr' 
                      ? 'आभा स्मार्ट डिजिटल आरोग्य क्यूआर कोड' 
                      : 'ABHA Smart Health QR Code')}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ABDM Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official Ayushman Bharat Digital Mission • Sovereign Patient Badge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Light Theme) */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Left Column: Patient Identity & Scope Selector (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              
              {/* Identity Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Ayushman Bharat Health Account
                    </span>
                    <span className="text-lg font-black text-blue-700 font-mono tracking-wide">
                      {user.healthId}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{user.bloodGroup}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Name</span>
                    <strong className="text-slate-900 font-bold text-sm">{user.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Age & Gender</span>
                    <strong className="text-slate-800">{user.age} Yrs • {user.gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Emergency SOS</span>
                    <a href={`tel:${user.emergencyContacts[0]?.phone}`} className="text-emerald-700 font-semibold hover:underline block truncate">
                      {user.emergencyContacts[0]?.phone || user.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">EHR Records</span>
                    <strong className="text-blue-700">{user.pastRecords.length} Hospital Visits</strong>
                  </div>
                </div>
              </div>

              {/* Doctor Access Scope Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'hi' ? 'डॉक्टर के लिए एक्सेस स्कोप:' : (language === 'mr' ? 'डॉक्टरांसाठी ऍक्सेस स्कोप:' : 'Doctor Access Scope on Scan:')}</span>
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('FULL_EHR')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      scope === 'FULL_EHR'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Full Medical Records</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('EMERGENCY_ONLY')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      scope === 'EMERGENCY_ONLY'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Emergency Triage Only</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Clean QR Code Box (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-emerald-300/60 relative">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Patient ABDM QR Code" 
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-7 h-7 animate-spin" />
                  </div>
                )}
                
                {/* Center Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleRegenerateToken}
                  disabled={isRegenerating}
                  title="Generate a new cryptographic access key"
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{language === 'hi' ? 'कुंजी रीसेट करें' : (language === 'mr' ? 'की रीसेट करा' : 'Reset QR Key')}</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Action Toolbar (Light Theme) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintCard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'hi' ? 'हेल्थ कार्ड प्रिंट करें' : (language === 'mr' ? 'आरोग्य कार्ड प्रिंट करा' : 'Print Health Card')}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Tele-Consult Link'}</span>
            </button>
          </div>

          <a
            href={`/records?abha=${encodeURIComponent(user.healthId)}&token=${tokenSalt}&scope=${scope}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>{language === 'hi' ? 'डॉक्टर दृश्य देखें' : (language === 'mr' ? 'डॉक्टर दृश्य पहा' : 'Preview Doctor View')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
