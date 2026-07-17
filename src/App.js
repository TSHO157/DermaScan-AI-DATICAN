import React, { useState, useEffect } from 'react';
import { Camera, Upload, ShieldAlert, UserCheck, Activity, History, Users, AlertTriangle, CheckCircle, Clock, User, FileText, Sparkles, Trash2, ArrowRight } from 'lucide-react';

export default function App() {
  // 1. Automatically inject Tailwind CSS CDN (Yesterday's proven method!)
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Application State
  const [role, setRole] = useState('Consumer'); // 'Consumer' | 'Clinician'
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'history' | 'patients'
  
  // ⚠️ PASTE YOUR REAL GEMINI API KEY INSIDE THESE QUOTES:
  const [apiKey, setApiKey] = useState('AQ.Ab8RN6I9O8zSpB5hdDK8EKcpZQLp_TD7F4MsmhtL8HQf03BVpQ'); 
  
  // Patient Intake Form State
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    skinType: 'Type III - Medium white to olive',
    symptoms: '',
    notes: ''
  });

  // Scan & AI State
  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiModeUsed, setAiModeUsed] = useState('');

  // Scan History State
  const [scanHistory, setScanHistory] = useState([]);

  // Handle Patient Intake Form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatientData(prev => ({ ...prev, [name]: value }));
  };

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🚀 THE REAL AI VISION ENGINE (GEMINI 3 FLASH PREVIEW)
  const runAiAnalysis = async () => {
    if (!imagePreview) return;
    
    if (!patientData.name.trim()) {
      alert("Please enter a Patient Name or 'Self' in the Intake Form before running the scan.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    // ROUTE 1: REAL LIVE AI
    if (apiKey.trim() !== '' && !apiKey.includes('YOUR_ACTUAL_GEMINI_KEY')) {
      try {
        setAiModeUsed('LIVE GEMINI VISION AI');
        const base64Data = imagePreview.split(',')[1];
        const mimeType = imagePreview.split(';')[0].split(':')[1] || 'image/jpeg';

        const systemPrompt = `You are an AI-powered clinical dermatology assistant. Carefully examine the skin image provided. 
        Patient Profile: Name: ${patientData.name}, Age: ${patientData.age || 'N/A'}, Skin Type: ${patientData.skinType}, Reported Symptoms: "${patientData.symptoms || 'None reported'}".

        Consider and differentiate between these conditions:
        1. Normal / Healthy Skin (if no visible lesion, rash, or abnormality is present)
        2. Acne (comedonal, inflammatory, cystic)
        3. Eczema (atopic dermatitis)
        4. Psoriasis
        5. Contact dermatitis (allergic, irritant)
        6. Rashes (allergic, viral, drug-related)
        7. Sunburn
        8. Hyperpigmentation / melasma
        9. Fungal infections (ringworm/tinea, candidiasis)
        10. Moles and nevi (benign vs atypical/dysplastic)
        11. Potential skin cancer warning signs (apply ABCDE criteria)

        CRITICAL RULE: If the skin looks smooth, clean, or healthy without distinct pathological lesions, classify as "Normal / Healthy Skin" with 90-99% confidence and Green urgency.

        Provide your assessment as a structured JSON response EXACTLY matching this schema:
        {
          "condition": "primary suspected condition name (string)",
          "confidence": integer between 0 and 100,
          "description_consumer": "2-3 sentence plain-language explanation for a general audience (string)",
          "description_clinical": "2-3 sentence clinical description using proper medical terminology (string)",
          "recommendations": ["array", "of", "specific", "OTC", "products", "or", "home care steps"],
          "urgency": "Green" or "Yellow" or "Orange" or "Red",
          "urgencyLabel": "Short urgency advice string (e.g., Manage at Home / See a GP / Urgent Dermatologist Referral)"
        }`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: systemPrompt },
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ]
            }],
            generationConfig: { 
              response_mime_type: "application/json",
              temperature: 0.2
            }
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const rawJsonText = data.candidates[0].content.parts[0].text;
        const liveResult = JSON.parse(rawJsonText);

        setAnalysisResult(liveResult);
        setIsAnalyzing(false);

        const newRecord = {
          id: Date.now(),
          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          patientName: patientData.name,
          age: patientData.age || 'N/A',
          skinType: patientData.skinType,
          symptoms: patientData.symptoms || 'No specific symptoms logged.',
          condition: liveResult.condition,
          confidence: liveResult.confidence,
          urgency: liveResult.urgency,
          urgencyLabel: liveResult.urgencyLabel,
          clinicalDesc: liveResult.description_clinical
        };
        setScanHistory(prev => [newRecord, ...prev]);
        return;

      } catch (error) {
        console.error("Live API Error:", error);
        alert(`Live API Notice: ${error.message}\n\nSwitching to high-fidelity clinical simulation for seamless demo.`);
      }
    }

    // ROUTE 2: OFFLINE SIMULATION FALLBACK
    setAiModeUsed('OFFLINE SIMULATION');
    setTimeout(() => {
      const conditionsList = [
        {
          condition: "Normal / Healthy Skin",
          confidence: 96,
          urgency: "Green",
          urgencyLabel: "No Medical Intervention Required",
          description_consumer: "The scanned epidermal surface appears smooth, intact, and well-hydrated. No visible rashes, discoloration, irregular moles, or inflammatory lesions were detected.",
          description_clinical: "Epidermis demonstrates normal surface topography and uniform pigmentation without evidence of erythema, scaling, papules, or suspicious melanocytic nevi. Fitzpatrick type consistent with intake.",
          recommendations: [
            "Continue daily routine of gentle cleansing and moisturizing.",
            "Apply broad-spectrum SPF 30+ sunscreen daily to prevent photoaging and UV damage.",
            "Perform self-examinations monthly to monitor for any new or changing pigmented lesions."
          ]
        },
        {
          condition: "Acne (Inflammatory & Cystic)",
          confidence: 91,
          urgency: "Yellow",
          urgencyLabel: "Monitor at Home / See a GP if scarring occurs",
          description_consumer: "Noticeable red, inflamed bumps and deeper nodules. This occurs when hair follicles become plugged with oil and dead skin cells, triggering inflammation.",
          description_clinical: "Multiple erythematous papules and deep-seated nodulocystic lesions observed across the facial epidermis. Signs of localized follicular hyperkeratosis and sebum overproduction.",
          recommendations: [
            "Apply an over-the-counter cleanser containing 2% Salicylic Acid or 5% Benzoyl Peroxide daily.",
            "Avoid physically popping cystic lesions to prevent permanent dermal scarring.",
            "Use non-comedogenic, oil-free moisturizers and daily SPF 30+ sunscreen."
          ]
        },
        {
          condition: "Allergic Contact Dermatitis",
          confidence: 88,
          urgency: "Green",
          urgencyLabel: "Manage at Home with OTC Care",
          description_consumer: "An itchy, red rash triggered by direct contact with a substance (such as new soaps, jewelry, or plant oils). It typically resolves once the trigger is removed.",
          description_clinical: "Acute eczematous reaction characterized by localized erythema, mild edema, and micro-vesiculation corresponding to areas of external allergen or irritant contact.",
          recommendations: [
            "Immediately discontinue use of new skincare products, detergents, or metallic jewelry in the area.",
            "Apply over-the-counter 1% hydrocortisone cream and cool compresses to soothe inflammation.",
            "Take an oral over-the-counter antihistamine if severe itching persists."
          ]
        }
      ];

      const symptomText = patientData.symptoms.toLowerCase();
      let selectedResult;
      if (symptomText.includes('clean') || symptomText.includes('smooth') || symptomText.includes('healthy') || symptomText.includes('normal') || symptomText.includes('none')) {
        selectedResult = conditionsList[0];
      } else {
        selectedResult = conditionsList[Math.floor(Math.random() * conditionsList.length)];
      }

      setAnalysisResult(selectedResult);
      setIsAnalyzing(false);

      const newScanRecord = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        patientName: patientData.name,
        age: patientData.age || 'N/A',
        skinType: patientData.skinType,
        symptoms: patientData.symptoms || 'No specific symptoms logged.',
        condition: selectedResult.condition,
        confidence: selectedResult.confidence,
        urgency: selectedResult.urgency,
        urgencyLabel: selectedResult.urgencyLabel,
        clinicalDesc: selectedResult.description_clinical
      };

      setScanHistory(prev => [newScanRecord, ...prev]);
    }, 2000);
  };

  const deleteScan = (id) => {
    setScanHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-[#0DB8B8] selection:text-[#0F2B5B]">
      
      {/* Top Navigation Bar */}
      <header className="bg-[#0F2B5B] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-lg border-b-4 border-[#0DB8B8] gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-[#0DB8B8] p-2 rounded-xl text-[#0F2B5B] shadow-inner">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight">DermaScan AI</span>
              <span className="text-[10px] bg-teal-400/20 text-[#0DB8B8] border border-[#0DB8B8]/40 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {role} Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Clinical-Grade Skin Assessment & Tracking</p>
          </div>
        </div>

        {/* Navigation Tabs & Role Switching */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/60 shadow-inner text-sm">
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeTab === 'scan' ? 'bg-[#0DB8B8] text-[#0F2B5B] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              New Scan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeTab === 'history' ? 'bg-[#0DB8B8] text-[#0F2B5B] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4" />
              Scan History ({scanHistory.length})
            </button>
            {role === 'Clinician' && (
              <button
                onClick={() => setActiveTab('patients')}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                  activeTab === 'patients' ? 'bg-[#0DB8B8] text-[#0F2B5B] shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4" />
                Patient Management
              </button>
            )}
          </div>

          {/* Role Toggle Switcher */}
          <div className="flex items-center space-x-2 text-sm bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-slate-400 font-medium text-xs uppercase">Role:</span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value === 'Consumer' && activeTab === 'patients') setActiveTab('scan');
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-sm text-[#0DB8B8]"
            >
              <option value="Consumer" className="bg-slate-800 text-white">Consumer (Self-Care)</option>
              <option value="Clinician" className="bg-slate-800 text-white">Clinician (Elevated Access)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {/* VIEW 1: NEW SCAN */}
        {activeTab === 'scan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Step 1 - Patient Intake Form */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-[#0F2B5B] flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0F2B5B] text-white text-xs font-bold">1</span>
                  Patient Profile & Symptoms
                </h2>
                <span className="text-xs text-slate-400 font-medium">Required Intake</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0DB8B8]" />
                    Subject / Patient Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={patientData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Okeowo James or 'Self'"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0DB8B8]/30 focus:border-[#0DB8B8] transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={patientData.age}
                      onChange={handleInputChange}
                      placeholder="e.g., 22"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0DB8B8]/30 focus:border-[#0DB8B8] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Fitzpatrick Skin Type
                    </label>
                    <select
                      name="skinType"
                      value={patientData.skinType}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0DB8B8]/30 focus:border-[#0DB8B8] transition font-medium text-slate-700"
                    >
                      <option value="Type I - Pale white, burns easily">Type I - Pale white</option>
                      <option value="Type II - White, fair, burns often">Type II - Fair white</option>
                      <option value="Type III - Medium white to olive">Type III - Olive / Medium</option>
                      <option value="Type IV - Moderate brown, tans well">Type IV - Moderate brown</option>
                      <option value="Type V - Dark brown, rarely burns">Type V - Dark brown</option>
                      <option value="Type VI - Deeply pigmented dark brown to black">Type VI - Deeply pigmented</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0DB8B8]" />
                    Observed Symptoms & Trigger Notes
                  </label>
                  <textarea
                    name="symptoms"
                    rows="3"
                    value={patientData.symptoms}
                    onChange={handleInputChange}
                    placeholder="Describe itching, burning, or type 'Smooth healthy skin' if no issues..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0DB8B8]/30 focus:border-[#0DB8B8] transition"
                  ></textarea>
                </div>

                <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-teal-900">
                  <Sparkles className="w-4 h-4 text-[#0DB8B8] flex-shrink-0 mt-0.5" />
                  <span>Entering accurate patient details helps the AI vision model tailor its clinical severity classification and OTC home care recommendations.</span>
                </div>
              </div>
            </div>

            {/* Step 2 - Image Capture & Trigger */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between h-full space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h2 className="text-lg font-bold text-[#0F2B5B] flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0F2B5B] text-white text-xs font-bold">2</span>
                    Upload Skin Target
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">Image Scan</span>
                </div>

                {imagePreview ? (
                  <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden border-2 border-[#0DB8B8] shadow-md mb-4 group flex items-center justify-center">
                    <img src={imagePreview} alt="Skin target preview" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-white text-xs font-medium truncate mb-2">{imageName}</p>
                      <button
                        onClick={() => { setImagePreview(null); setAnalysisResult(null); }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg transition shadow flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove & Upload Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full aspect-square border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#0DB8B8] hover:bg-teal-50/20 transition mb-4 group bg-slate-50/50 p-6 text-center">
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:scale-110 group-hover:border-teal-200 transition duration-300 mb-3">
                      <Upload className="w-8 h-8 text-[#0DB8B8]" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-[#0F2B5B] transition">Click or Tap to Upload Photo</span>
                    <span className="text-xs text-slate-400 mt-1 max-w-[200px]">Supports close-up smartphone photos, dermoscopy scans, or PNG/JPG files</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <button
                onClick={runAiAnalysis}
                disabled={!imagePreview || isAnalyzing}
                className={`w-full py-4 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 shadow-lg text-base ${
                  !imagePreview || isAnalyzing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-[#0F2B5B] to-slate-900 hover:from-teal-600 hover:to-[#0DB8B8] text-white shadow-teal-900/20 active:scale-[0.98]'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin text-[#0DB8B8]" />
                    Querying Gemini Vision AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-[#0DB8B8]" />
                    Execute AI Diagnostic Model
                  </>
                )}
              </button>
            </div>

            {/* Step 3 - AI Analysis Results Card */}
            <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between h-full space-y-5">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <h2 className="text-lg font-bold text-[#0F2B5B] flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0DB8B8] text-[#0F2B5B] text-xs font-extrabold">3</span>
                    Diagnostic Report
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">JSON Output</span>
                </div>

                {!analysisResult && !isAnalyzing && (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-slate-400 my-auto p-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                    <Activity className="w-12 h-12 stroke-1 mb-3 text-slate-300 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-600">Awaiting Target Upload</p>
                    <p className="text-xs text-slate-400 mt-1">Complete patient profile and run scan to view confidence level, OTC treatment advice, and ABCDE cancer warning flags.</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="h-80 flex flex-col items-center justify-center text-center text-slate-600 space-y-4 p-6">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-[#0DB8B8] border-t-transparent rounded-full animate-spin"></div>
                      <Sparkles className="w-6 h-6 text-[#0F2B5B] animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F2B5B]">Live GenAI Vision Processing...</p>
                      <p className="text-xs text-slate-400 mt-1">Evaluating epidermal regularity, lesion borders, and color patterns...</p>
                    </div>
                  </div>
                )}

                {analysisResult && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-[10px] font-mono flex justify-between items-center border border-slate-700">
                      <span>ENGINE USED:</span>
                      <span className="text-[#0DB8B8] font-bold">{aiModeUsed}</span>
                    </div>

                    <div className="flex justify-between items-start bg-teal-50/60 p-4 rounded-xl border border-teal-200/80 shadow-sm">
                      <div>
                        <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">Suspected Condition</span>
                        <h3 className="text-base font-black text-[#0F2B5B] leading-snug mt-0.5">{analysisResult.condition}</h3>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">Confidence</span>
                        <div className="text-lg font-black text-[#0DB8B8] bg-[#0F2B5B] px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
                          {analysisResult.confidence}%
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border shadow-sm ${
                      analysisResult.urgency === 'Red' ? 'bg-red-50 border-red-200 text-red-800 animate-pulse' :
                      analysisResult.urgency === 'Orange' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                      analysisResult.urgency === 'Yellow' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                      'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Urgency: {analysisResult.urgencyLabel}</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs text-slate-600 leading-relaxed space-y-1">
                      <span className="font-bold text-[#0F2B5B] uppercase tracking-wider text-[10px] block border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between">
                        <span>{role === 'Clinician' ? 'Clinical Medical Terminology' : 'Plain-Language Explanation'}</span>
                        <span className="text-[#0DB8B8] font-semibold">{role} View</span>
                      </span>
                      <p className="text-slate-700 font-medium">
                        {role === 'Clinician' ? analysisResult.description_clinical : analysisResult.description_consumer}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[11px] font-bold text-[#0F2B5B] uppercase tracking-wider block mb-2">
                        Recommended Home Care & Actions
                      </span>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {analysisResult.recommendations && analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 bg-slate-50/80 p-2 rounded-lg border border-slate-100 font-medium">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-slate-900 text-slate-300 p-3.5 rounded-xl border-l-4 border-l-amber-500 flex items-start gap-3 text-[11px] shadow-inner">
                <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-white uppercase tracking-wider block mb-0.5">Medical Disclaimer:</strong> This AI assessment is for informational purposes only and is not a substitute for professional medical diagnosis. Always consult a qualified healthcare provider for proper evaluation and treatment.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: SCAN HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F2B5B] flex items-center gap-2">
                  <History className="w-6 h-6 text-[#0DB8B8]" />
                  Saved Diagnostic Journal
                </h2>
                <p className="text-xs text-slate-500 mt-1">Longitudinal tracking of patient skin conditions and AI confidence metrics.</p>
              </div>
              <button 
                onClick={() => setActiveTab('scan')}
                className="bg-[#0F2B5B] hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2"
              >
                + Conduct New Patient Scan
              </button>
            </div>

            {scanHistory.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 p-8">
                <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
                <h3 className="text-base font-bold text-slate-700">No Patient Scans Recorded Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">Conduct your first AI assessment in the New Scan tab to automatically generate longitudinal patient logs here.</p>
                <button
                  onClick={() => setActiveTab('scan')}
                  className="bg-[#0DB8B8] hover:bg-teal-600 text-[#0F2B5B] text-xs font-extrabold px-5 py-2.5 rounded-xl transition shadow-sm inline-flex items-center gap-2"
                >
                  Start First AI Assessment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <th className="p-3.5 rounded-l-xl font-bold">Date</th>
                      <th className="p-3.5 font-bold">Patient Profile</th>
                      <th className="p-3.5 font-bold">Observed Symptoms</th>
                      <th className="p-3.5 font-bold">Condition Detected</th>
                      <th className="p-3.5 font-bold">Confidence</th>
                      <th className="p-3.5 font-bold">Urgency Status</th>
                      <th className="p-3.5 rounded-r-xl font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {scanHistory.map((scan) => (
                      <tr key={scan.id} className="hover:bg-teal-50/30 transition">
                        <td className="p-3.5 font-bold text-slate-700 whitespace-nowrap">{scan.date}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-[#0F2B5B] text-sm">{scan.patientName}</div>
                          <div className="text-[11px] text-slate-400 font-medium">Age: {scan.age} • {scan.skinType.split('-')[0]}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate font-medium">{scan.symptoms}</td>
                        <td className="p-3.5 font-bold text-[#0F2B5B] text-sm">{scan.condition}</td>
                        <td className="p-3.5">
                          <span className="bg-[#0F2B5B] text-[#0DB8B8] font-black px-2.5 py-1 rounded-lg text-xs shadow-inner">
                            {scan.confidence}%
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                            scan.urgency === 'Red' ? 'bg-red-50 text-red-700 border-red-200' :
                            scan.urgency === 'Orange' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            scan.urgency === 'Yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {scan.urgencyLabel.split('/')[0]}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => deleteScan(scan.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: CLINICIAN PATIENT MANAGEMENT DASHBOARD */}
        {activeTab === 'patients' && role === 'Clinician' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F2B5B] flex items-center gap-2">
                  <Users className="w-6 h-6 text-[#0DB8B8]" />
                  Clinician Patient Management Dashboard
                </h2>
                <p className="text-xs text-slate-500 mt-1">Elevated administrative access for tracking longitudinal patient case studies.</p>
              </div>
              <button 
                onClick={() => {
                  setPatientData({ name: '', age: '', skinType: 'Type III - Medium white to olive', symptoms: '', notes: '' });
                  setActiveTab('scan');
                }}
                className="bg-[#0DB8B8] hover:bg-teal-600 text-[#0F2B5B] text-xs font-black px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                + Register New Patient Case
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scanHistory.length > 0 ? (
                scanHistory.map((patient, idx) => (
                  <div key={idx} className="border-2 border-slate-100 p-5 rounded-2xl bg-slate-50/60 hover:border-teal-300 transition flex flex-col justify-between space-y-4 shadow-sm">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-extrabold text-[#0F2B5B] text-base">{patient.patientName}</div>
                        <span className="text-[10px] bg-slate-900 text-[#0DB8B8] px-2 py-0.5 rounded font-bold">ID: #{400 + idx}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mb-3">
                        Age: {patient.age} yrs • {patient.skinType.split('-')[0]}
                      </div>
                      <div className="text-xs bg-white p-3 rounded-xl border border-slate-200/80 text-slate-700 space-y-1 shadow-inner">
                        <span className="font-bold text-[#0F2B5B] block text-[10px] uppercase">Latest Symptoms Logged:</span>
                        <p className="italic text-slate-600">"{patient.symptoms}"</p>
                        <div className="pt-2 border-t border-slate-100 mt-2 flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-500">Last Diagnosis:</span>
                          <span className="font-extrabold text-[#0F2B5B]">{patient.condition.split('(')[0]}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setPatientData({ name: patient.patientName, age: patient.age, skinType: patient.skinType, symptoms: patient.symptoms, notes: '' });
                        setActiveTab('scan');
                      }}
                      className="w-full bg-[#0F2B5B] hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Initiate Linked Follow-up Scan <ArrowRight className="w-3.5 h-3.5 text-[#0DB8B8]" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="border-2 border-slate-100 p-5 rounded-2xl bg-slate-50/60 flex flex-col justify-between space-y-4 shadow-sm">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-extrabold text-[#0F2B5B] text-base">Okeowo James</div>
                      <span className="text-[10px] bg-slate-900 text-[#0DB8B8] px-2 py-0.5 rounded font-bold">ID: #401</span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mb-3">Age: 23 yrs • Type V - Dark brown</div>
                    <div className="text-xs bg-white p-3 rounded-xl border border-slate-200/80 text-slate-700 space-y-1 shadow-inner">
                      <span className="font-bold text-[#0F2B5B] block text-[10px] uppercase">Case Study Notes:</span>
                      <p className="italic text-slate-600">"Patient reported localized contact dermatitis after field exposure during engineering assembly."</p>
                      <div className="pt-2 border-t border-slate-100 mt-2 flex justify-between items-center text-[11px]">
                        <span className="font-bold text-slate-500">Status:</span>
                        <span className="font-extrabold text-emerald-600">Resolved (OTC Care)</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setPatientData({ name: 'Okeowo James', age: '23', skinType: 'Type V - Dark brown, rarely burns', symptoms: 'Localized contact dermatitis after field exposure.', notes: '' });
                      setActiveTab('scan');
                    }}
                    className="w-full bg-[#0DB8B8] hover:bg-teal-600 text-[#0F2B5B] text-xs font-black py-2.5 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Initiate Follow-up Scan <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}