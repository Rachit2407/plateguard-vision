import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Volume2, 
  VolumeX, 
  History, 
  Info, 
  Camera, 
  FileText
} from 'lucide-react';

import { DEFAULT_PROFILE } from './data/constants';
import type { AnalysisResult, UserHealthProfile } from './types';
import { Scanner } from './components/Scanner';
import { ResultCard } from './components/ResultCard';
import { ProfileModal } from './components/ProfileModal';
import { PlateVisionEngine } from './services/visionEngine';
import { speechService } from './services/speechService';

export default function App() {
  const [profile, setProfile] = useState<UserHealthProfile>(() => {
    const saved = localStorage.getItem('plateguard_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [scanHistory, setScanHistory] = useState<AnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'about'>('scan');

  useEffect(() => {
    localStorage.setItem('plateguard_profile', JSON.stringify(profile));
  }, [profile]);

  const handleScanImage = async (imageDataUrl: string, sampleId?: string) => {
    setIsAnalyzing(true);
    speechService.playAudioCue('scan_start');

    try {
      const result = await PlateVisionEngine.analyzeImage(imageDataUrl, profile, sampleId);
      setCurrentResult(result);
      setScanHistory(prev => [result, ...prev]);

      if (result.verdict === 'SAFE') {
        speechService.playAudioCue('safe');
      } else if (result.verdict === 'CAUTION') {
        speechService.playAudioCue('caution');
      } else {
        speechService.playAudioCue('avoid');
      }

      if (profile.audioSpeechEnabled) {
        readOutVerdict(result);
      }
    } catch (err) {
      console.error("Scan analysis error:", err);
      alert("Analysis failed. Please check network connection or try another image.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const readOutVerdict = (res: AnalysisResult) => {
    const statusText = res.verdict === 'SAFE' 
      ? 'Safe to eat.' 
      : (res.verdict === 'CAUTION' ? 'Caution advised.' : 'Warning: Do not eat.');
    
    const textToSpeak = `${statusText} Identified ${res.dishOrProductName}. ${res.summaryExplanation} ${
      res.saferAlternative ? `Recommended alternative: ${res.saferAlternative.suggestedDishName}.` : ''
    }`;
    speechService.speak(textToSpeak, true);
  };

  const toggleSound = () => {
    const updated = !profile.audioSpeechEnabled;
    setProfile(p => ({ ...p, audioSpeechEnabled: updated }));
    if (!updated) {
      speechService.stop();
    } else {
      speechService.speak("Voice announcements enabled.");
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans ${profile.highContrastMode ? 'high-contrast' : ''} ${profile.largeFontMode ? 'text-lg' : ''}`}>
      {/* Top Application Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">PlateGuard Vision</span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Assistive Food Safety
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Allergen classification & dietary cross-referencing</p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
                profile.audioSpeechEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title={profile.audioSpeechEnabled ? "Disable audio announcements" : "Enable audio announcements"}
              aria-label="Toggle voice readout"
            >
              {profile.audioSpeechEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />}
              <span className="hidden sm:inline">{profile.audioSpeechEnabled ? 'Audio On' : 'Muted'}</span>
            </button>

            {/* Profile Settings */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              <span className="hidden sm:inline">Profile: </span>
              <strong className="text-slate-900 font-medium truncate max-w-[85px] sm:max-w-[120px]">{profile.name}</strong>
            </button>
          </div>
        </div>
      </header>

      {/* Health Profile Status Ribbon */}
      <div className="bg-white border-b border-slate-200 px-3.5 sm:px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="font-semibold text-slate-700 shrink-0 text-[11px] sm:text-xs">Rules:</span>
            {profile.allergies.map((allergy, i) => (
              <span key={i} className="shrink-0 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-[11px] font-medium">
                No {allergy}
              </span>
            ))}
            {profile.conditions.map((cond, i) => (
              <span key={i} className="shrink-0 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] sm:text-[11px] font-medium">
                {cond.split(' ')[0]}
              </span>
            ))}
          </div>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] sm:text-xs shrink-0 ml-1"
          >
            Edit
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Navigation Tabs - Horizontally scrollable on mobile */}
        <nav className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto no-scrollbar" aria-label="Sections">
          <button
            onClick={() => setActiveTab('scan')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'scan'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            Scanner & Assessment
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Evaluation Log ({scanHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border-b-2 transition whitespace-nowrap shrink-0 ${
              activeTab === 'about'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            Team Specifications
          </button>
        </nav>

        {/* Tab 1: Scanner & Results */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            <Scanner onImageSelected={handleScanImage} isAnalyzing={isAnalyzing} />

            {currentResult && (
              <ResultCard
                result={currentResult}
                onSynthesizeVoice={() => readOutVerdict(currentResult)}
              />
            )}
          </div>
        )}

        {/* Tab 2: History Log */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Food Safety Evaluation Log</h3>
                <p className="text-xs text-slate-500">History of meals inspected during this session</p>
              </div>
            </div>

            {scanHistory.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No evaluations logged yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Point your camera or click any reference scenario in the Scanner tab.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Time</th>
                      <th className="py-2.5 px-3 font-semibold">Food Item</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Verdict</th>
                      <th className="py-2.5 px-3 font-semibold">Confidence</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scanHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{item.timestamp}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{item.dishOrProductName}</td>
                        <td className="py-3 px-3 text-slate-600 capitalize">{item.scanType}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            item.verdict === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            item.verdict === 'CAUTION' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.verdict}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{item.confidenceScore}%</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setCurrentResult(item);
                              setActiveTab('scan');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                          >
                            Inspect
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

        {/* Tab 3: Architecture & Team Specifications */}
        {activeTab === 'about' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-bold text-slate-900">
                PlateGuard Vision System Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Role distribution and technical integration contracts for the engineering team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                    Role A: Frontend & Accessibility (Active)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-blue-600 text-white">Implemented</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  PWA configuration, responsive camera viewport, high-contrast mode, large-text scaling, and browser Web Speech input/output.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Role B: AI Inference Pipeline
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vision classification and OCR calls returning structured JSON, plus generative image synthesis for modified alternative recipes.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Role C: Clinical Rules & Data
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Allergen alias matrix (e.g. wheat, casein, peanut derivatives), threshold limits for sodium/sugar, and deterministic verdict unit tests.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Role D: Presentation, Voice & Writing
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Spoken synthesis verification, demonstration image sets, 3-minute video presentation script, and Devpost submission documentation.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
              <h4 className="font-semibold text-slate-900">Judging Criteria Alignment</h4>
              <p className="leading-relaxed">
                PlateGuard satisfies all core pillars: <strong>Computer Vision Classification</strong> for plated meals, <strong>OCR</strong> for nutritional packaging, and <strong>Synthetic Image Generation</strong> for personalized safe alternatives.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PlateGuard Vision • Assistive Food Safety System</span>
          <span>Complies with WCAG accessibility and clinical dietary rules</span>
        </div>
      </footer>

      {/* Health Profile Config Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={setProfile}
      />
    </div>
  );
}
