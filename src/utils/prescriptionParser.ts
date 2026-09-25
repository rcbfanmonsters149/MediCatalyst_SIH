/**
 * Dynamic Clinical Prescription OCR Parser with Strict Document Verification
 * and Jan Aushadhi Generic Drug Matching.
 */
import type { PrescriptionMedication } from '../types';

export interface ParsedPrescriptionResult {
  isPrescription: boolean;
  rejectionReason?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  diagnosis?: string;
  vitalsDetected?: string;
  clinicalAdvice?: string;
  medications: PrescriptionMedication[];
  rawText: string;
  overallConfidence: number;
}

interface DrugEntry {
  generic: string;
  aliases: string[];
  defaultDosage: string;
  defaultFrequency: string;
  instructions: string;
}

export const INDIAN_DRUG_LEXICON: DrugEntry[] = [
  { generic: 'Paracetamol', aliases: ['pcm', 'dolo', 'crocin', 'calpol', 'pyrigesic', 'pacimol', 'dolo650', 'crocin650'], defaultDosage: '650 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take with warm water after meals' },
  { generic: 'Pantoprazole', aliases: ['pantocid', 'pantodac', 'pantop', 'pan40', 'pan-d', 'pantocid-40'], defaultDosage: '40 mg', defaultFrequency: '1-0-0 (Empty Stomach)', instructions: 'Morning 30 mins before breakfast' },
  { generic: 'Azithromycin', aliases: ['azithro', 'azee', 'azithral', 'zithromax', 'azimax'], defaultDosage: '500 mg', defaultFrequency: '1-0-0 (After Food)', instructions: 'After meals for 3-5 days' },
  { generic: 'Amoxicillin', aliases: ['novamox', 'amoxyclav', 'augmentin', 'clamox'], defaultDosage: '500 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take with meals' },
  { generic: 'Metformin', aliases: ['glycomet', 'glyciphage', 'gluformin', 'metfor'], defaultDosage: '500 mg', defaultFrequency: '1-0-1 (With Food)', instructions: 'Take with meals to minimize GI distress' },
  { generic: 'Cetirizine', aliases: ['cetzine', 'alerid', 'okacet', 'ceterizine', 'cetrizen'], defaultDosage: '10 mg', defaultFrequency: '0-0-1 (Bedtime)', instructions: 'Take at bedtime' },
  { generic: 'Telmisartan', aliases: ['telma', 'telpres', 'telsartan', 'telmikind'], defaultDosage: '40 mg', defaultFrequency: '1-0-0 (Morning)', instructions: 'Take daily after breakfast' },
  { generic: 'Atorvastatin', aliases: ['atorva', 'atorlip', 'lipitor', 'storvas'], defaultDosage: '10 mg', defaultFrequency: '0-0-1 (Bedtime)', instructions: 'Take at night' },
  { generic: 'Ibuprofen', aliases: ['brufen', 'combiflam', 'ibugesic'], defaultDosage: '400 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take after meals' },
  { generic: 'Ciprofloxacin', aliases: ['ciplox', 'cifran', 'cipro'], defaultDosage: '500 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take with plenty of water' },
  { generic: 'Levocetirizine', aliases: ['levocet', 'xyzal', 'tecast'], defaultDosage: '5 mg', defaultFrequency: '0-0-1 (Bedtime)', instructions: 'Take at night' },
  { generic: 'Omeprazole', aliases: ['omez', 'ocid', 'omizac'], defaultDosage: '20 mg', defaultFrequency: '1-0-0 (Empty Stomach)', instructions: 'Morning before food' },
  { generic: 'Amlodipine', aliases: ['amlong', 'amlovas', 'stamlo', 'amlosun'], defaultDosage: '5 mg', defaultFrequency: '1-0-0 (Morning)', instructions: 'Daily morning' },
  { generic: 'Doxycycline', aliases: ['doxy', 'microdox', 'doxydoc'], defaultDosage: '100 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take with full glass of water' },
  { generic: 'Montelukast', aliases: ['montair', 'montek', 'telekast', 'monticope'], defaultDosage: '10 mg', defaultFrequency: '0-0-1 (Bedtime)', instructions: 'Take at bedtime' },
  { generic: 'Diclofenac', aliases: ['voveran', 'dicloran', 'volini', 'dynapar'], defaultDosage: '50 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take after food for pain' },
  { generic: 'Domperidone', aliases: ['domstal', 'vomistop', 'motinorm'], defaultDosage: '10 mg', defaultFrequency: '1-0-1 (Before Food)', instructions: 'Take 15-30 mins before food' },
  { generic: 'Cefixime', aliases: ['taxim-o', 'mahacef', 'ceftas', 'zifi'], defaultDosage: '200 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take after meals for 5 days' },
  { generic: 'Metoprolol', aliases: ['betaloc', 'metolar', 'starpress'], defaultDosage: '25 mg', defaultFrequency: '1-0-0 (Morning)', instructions: 'Take in morning' },
  { generic: 'Glimepiride', aliases: ['amaryl', 'glypride', 'zoryl'], defaultDosage: '1 mg', defaultFrequency: '1-0-0 (Before Food)', instructions: 'Before breakfast' },
  { generic: 'Rabeprazole', aliases: ['razo', 'happi', 'rabicip', 'veloz'], defaultDosage: '20 mg', defaultFrequency: '1-0-0 (Empty Stomach)', instructions: 'Morning before food' },
  { generic: 'Ranitidine', aliases: ['rantac', 'zinetac', 'aciloc'], defaultDosage: '150 mg', defaultFrequency: '1-0-1 (Before Food)', instructions: 'Before food' },
  { generic: 'Aceclofenac', aliases: ['zerodol', 'hifenac', 'aceclo'], defaultDosage: '100 mg', defaultFrequency: '1-0-1 (After Food)', instructions: 'Take after meals' },
  { generic: 'Vitamin D3', aliases: ['calcirol', 'd-rise', 'uprise', 'cholecalciferol'], defaultDosage: '60000 IU', defaultFrequency: 'Once weekly', instructions: 'Take once weekly after milk/meal' },
  { generic: 'B-Complex', aliases: ['becosules', 'polybion', 'neurobion'], defaultDosage: '1 Cap', defaultFrequency: '1-0-0 (Morning)', instructions: 'Take daily after breakfast' }
];

function levenshteinDistance(s1: string, s2: string): number {
  if (s1.length < s2.length) return levenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;

  let previousRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const insertions = previousRow[j + 1] + 1;
      const deletions = currentRow[j] + 1;
      const substitutions = previousRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currentRow.push(Math.min(insertions, deletions, substitutions));
    }
    previousRow = currentRow;
  }
  return previousRow[s2.length];
}

/**
 * Strict token matching against Jan Aushadhi generic lexicon.
 * Avoids false positives from arbitrary 3-letter substrings.
 */
function matchDrugToken(token: string): { drug: DrugEntry; similarity: number } | null {
  const clean = token.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length < 3) return null;

  // Strict check for 3-letter tokens: Only allow exact match to 'pcm'
  if (clean.length === 3) {
    if (clean === 'pcm') {
      const pcm = INDIAN_DRUG_LEXICON.find(d => d.generic === 'Paracetamol');
      if (pcm) return { drug: pcm, similarity: 1.0 };
    }
    return null;
  }

  let bestMatch: DrugEntry | null = null;
  let highestSimilarity = 0;

  for (const entry of INDIAN_DRUG_LEXICON) {
    const targets = [entry.generic.toLowerCase(), ...entry.aliases.map(a => a.toLowerCase())];
    for (const target of targets) {
      if (target.length < 3) continue;

      // 1. Exact match (case insensitive)
      if (clean === target) {
        return { drug: entry, similarity: 1.0 };
      }

      // 2. Strict Levenshtein distance check (no substring matching!)
      const dist = levenshteinDistance(clean, target);
      const maxLen = Math.max(clean.length, target.length);
      const similarity = 1.0 - dist / maxLen;

      // For 4-letter words, require similarity >= 0.85 (max 0-1 error)
      // For longer words, require similarity >= 0.80
      const threshold = target.length <= 4 ? 0.85 : 0.80;
      if (similarity >= threshold && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = entry;
      }
    }
  }

  if (bestMatch) {
    return { drug: bestMatch, similarity: highestSimilarity };
  }
  return null;
}

/**
 * Validates whether the raw text contains clinical prescription markers.
 * Rejects non-medical images (memes, food, scenery, receipts, general text).
 */
export function verifyPrescriptionDocument(text: string): { isValid: boolean; score: number; anchorsFound: string[] } {
  if (!text || text.trim().length < 8) {
    return { isValid: false, score: 0, anchorsFound: [] };
  }

  const lower = text.toLowerCase();
  const anchorsFound: string[] = [];
  let score = 0;

  // 1. Prescription Symbol & Slip Headers (+3)
  if (/\b(?:rx|r\/x|prescription|rx\s*:|remedy)\b/i.test(lower)) {
    score += 3;
    anchorsFound.push('Rx Symbol / Prescription Header');
  }

  // 2. Doctor, Medical Degree & Clinic Markers (+2)
  if (/\b(?:dr\.?|doctor|mbbs|m\.b\.b\.s|md|m\.d\.|clinic|hospital|dispensary|opd|consultant|physician|surgeon)\b/i.test(lower)) {
    score += 2;
    anchorsFound.push('Doctor / Clinic Header');
  }

  // 3. Clinical Sections (+2)
  if (/\b(?:diagnosis|diag|dx|vitals|bp|pulse|spo2|temp|chief complaint|complaints?|advice|investigations?)\b/i.test(lower)) {
    score += 2;
    anchorsFound.push('Clinical Sections (Diagnosis/Vitals/Advice)');
  }

  // 4. Pharmaceutical Formulations (+2)
  if (/\b(?:tab\.?|tablet|tablets|cap\.?|capsule|capsules|syp\.?|syrup|inj\.?|injection|ointment|drops)\b/i.test(lower)) {
    score += 2;
    anchorsFound.push('Pharmaceutical Form (Tab/Cap/Syp/Inj)');
  }

  // 5. Dosages and Frequencies (+2)
  if (/\b(?:\d+\s*(?:mg|mcg|ml|gm|iu)|1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|od|bd|tid|qid|hs|sos)\b/i.test(lower)) {
    score += 2;
    anchorsFound.push('Dosage / Frequency (mg/1-0-1/OD/BD)');
  }

  // 6. Check if any known drug matches exist in the text
  let drugMatches = 0;
  const tokens = lower.split(/[\s,;()\n]+/);
  for (const token of tokens) {
    if (token.length >= 4 || token === 'pcm') {
      const match = matchDrugToken(token);
      if (match) {
        drugMatches++;
        if (!anchorsFound.includes(`Drug: ${match.drug.generic}`)) {
          anchorsFound.push(`Drug: ${match.drug.generic}`);
        }
      }
    }
  }

  if (drugMatches > 0) {
    score += Math.min(drugMatches * 2, 6);
  }

  // To be a valid prescription, we require at least score >= 4 AND (drugMatches > 0 OR score >= 5)
  const isValid = score >= 4 && (drugMatches > 0 || score >= 5);

  return { isValid, score, anchorsFound };
}

/**
 * Dynamically parses raw text produced by OCR from a prescription image.
 * If text is not a valid prescription, returns isPrescription: false with empty medications.
 */
export function parsePrescriptionText(rawText: string): ParsedPrescriptionResult {
  const verification = verifyPrescriptionDocument(rawText);

  if (!verification.isValid) {
    return {
      isPrescription: false,
      rejectionReason: 'Invalid Document: No medical prescription markers, Rx headers, or valid medications detected.',
      doctorName: '',
      doctorSpecialty: '',
      diagnosis: '',
      vitalsDetected: '',
      clinicalAdvice: '',
      medications: [],
      rawText,
      overallConfidence: 0
    };
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let doctorName = '';
  let doctorSpecialty = '';
  let diagnosis = '';
  let vitalsDetected = '';
  let clinicalAdvice = '';
  const detectedMeds: PrescriptionMedication[] = [];
  const foundDrugNames = new Set<string>();

  for (const line of lines) {
    // 1. Doctor Detection
    const docMatch = line.match(/(?:Dr\.?|Doctor)\s+([A-Za-z\s.]+)/i);
    if (docMatch && docMatch[1].trim().length > 3) {
      doctorName = `Dr. ${docMatch[1].trim()}`;
    }

    // 2. Specialty Detection
    if (/internal medicine|general physician|cardiologist|pediatrician|dermatologist|orthopedic/i.test(line)) {
      doctorSpecialty = line.trim();
    }

    // 3. Diagnosis Detection
    const diagMatch = line.match(/(?:Diagnosis|Diag|Dx|Impression|Chief Complaint|Complaints?|Rx for)[:\s]+([^|\n]+)/i);
    if (diagMatch && diagMatch[1].trim().length > 3) {
      diagnosis = diagMatch[1].trim();
    } else if (!diagnosis && /\b(fever|urti|cough|cold|infection|hypertension|bp|diabetes|gastritis|asthma|bronchitis|gerd|pain|headache)\b/i.test(line)) {
      diagnosis = line.replace(/^[0-9.\-\s*]+/, '').trim();
    }

    // 4. Vitals Detection
    if (/\b(?:bp\s*[:\d]|spo2|pulse|temp|temperature)\b/i.test(line)) {
      vitalsDetected = line.trim();
    }

    // 5. Clinical Advice Detection
    if (/\b(advice|instruction|review|follow[- ]up|water|diet|steam|rest)\b/i.test(line) && !line.includes('Tab.') && !line.includes('Cap.')) {
      clinicalAdvice += (clinicalAdvice ? ' ' : '') + line.replace(/^(?:advice|instructions?)[:\s-]*/i, '').trim();
    }

    // 6. Dynamic Medicine Token Scanning
    // Multi-word checks
    if (/vitamin\s*d\s*3|cholecalciferol/i.test(line) && !foundDrugNames.has('Vitamin D3')) {
      foundDrugNames.add('Vitamin D3');
      detectedMeds.push({
        name: 'Vitamin D3',
        dosage: '60000 IU',
        frequency: 'Once weekly',
        duration: '4 Weeks',
        instructions: 'Take once weekly after milk/meal'
      });
    }

    if (/b[- ]?complex|becosules|neurobion/i.test(line) && !foundDrugNames.has('B-Complex')) {
      foundDrugNames.add('B-Complex');
      detectedMeds.push({
        name: 'B-Complex',
        dosage: '1 Cap',
        frequency: '1-0-0 (Morning)',
        duration: '15 Days',
        instructions: 'Take daily after breakfast'
      });
    }

    const tokens = line.split(/[\s,;()]+/);
    for (const token of tokens) {
      const match = matchDrugToken(token);
      if (match && !foundDrugNames.has(match.drug.generic)) {
        foundDrugNames.add(match.drug.generic);

        // Extract Dosage from line or default
        const dosageMatch = line.match(/(\d+\s*(?:mg|g|ml|mcg|iu))/i);
        const dosage = dosageMatch ? dosageMatch[1].replace(/\s+/, ' ') : match.drug.defaultDosage;

        // Extract Frequency from line or default
        let frequency = match.drug.defaultFrequency;
        const freqMatch = line.match(/\b(1-0-1|1-0-0|0-0-1|1-1-1|0-1-0|OD|BD|TID|QID|HS|SOS)\b/i);
        if (freqMatch) {
          const rawF = freqMatch[1].toUpperCase();
          if (rawF === '1-0-1' || rawF === 'BD') frequency = '1-0-1 (After Food)';
          else if (rawF === '1-0-0' || rawF === 'OD') frequency = '1-0-0 (Morning)';
          else if (rawF === '0-0-1' || rawF === 'HS') frequency = '0-0-1 (Bedtime)';
          else if (rawF === '1-1-1' || rawF === 'TID') frequency = '1-1-1 (After Meals)';
          else if (rawF === 'SOS') frequency = 'SOS (As Needed)';
          else frequency = rawF;
        }

        // Extract Duration from line
        let duration = '5 Days';
        const durMatch = line.match(/(\d+\s*(?:days?|weeks?|months?|d\b))/i);
        if (durMatch) {
          duration = durMatch[1].replace(/d\b/i, 'Days');
        }

        // Extract Instructions
        let instr = match.drug.instructions;
        if (/empty stomach|before food|before breakfast/i.test(line)) {
          instr = 'Morning 30 mins before food';
        } else if (/after food|after meals/i.test(line)) {
          instr = 'Take after meals with water';
        } else if (/bedtime|night/i.test(line)) {
          instr = 'Take at bedtime';
        }

        detectedMeds.push({
          name: match.drug.generic,
          dosage,
          frequency,
          duration,
          instructions: instr
        });
      }
    }
  }

  // If no medications were extracted and verification score was borderline, reject
  if (detectedMeds.length === 0 && verification.score < 5) {
    return {
      isPrescription: false,
      rejectionReason: 'No recognizable pharmaceutical medications found in document.',
      doctorName: '',
      doctorSpecialty: '',
      diagnosis: '',
      vitalsDetected: '',
      clinicalAdvice: '',
      medications: [],
      rawText,
      overallConfidence: 0
    };
  }

  // Calculate dynamic confidence score
  const confidenceBase = detectedMeds.length > 0 ? 88 : 65;
  const confidenceBonus = Math.min(detectedMeds.length * 3 + verification.score, 10);
  const overallConfidence = Math.min(confidenceBase + confidenceBonus, 98.0);

  return {
    isPrescription: true,
    doctorName,
    doctorSpecialty,
    diagnosis,
    vitalsDetected,
    clinicalAdvice,
    medications: detectedMeds,
    rawText,
    overallConfidence: Number(overallConfidence.toFixed(1))
  };
}
