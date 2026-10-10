import React, { useState } from 'react';
import { User, AlertCircle, Sliders, Volume2, Key, Check } from 'lucide-react';
import type { UserHealthProfile } from '../types';
import { COMMON_ALLERGIES, COMMON_CONDITIONS } from '../data/constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserHealthProfile;
  onSaveProfile: (profile: UserHealthProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<UserHealthProfile>(profile);
  const [customAllergy, setCustomAllergy] = useState('');

  if (!isOpen) return null;

  const toggleAllergy = (allergy: string) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !formData.allergies.includes(customAllergy.trim())) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()]
      }));
      setCustomAllergy('');
    }
  };

  const toggleCondition = (condition: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter(c => c !== condition)
        : [...prev.conditions, condition]
    }));
  };

  const handleSave = () => {
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Health & Dietary Profile</h2>
              <p className="text-xs text-slate-500">Configure allergens, health conditions, and meal limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-semibold w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Profile Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Allergies Matrix */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Allergens to Flag (Instant Avoid)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map(allergy => {
                const selected = formData.allergies.includes(allergy);
                return (
                  <button
                    type="button"
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition border ${
                      selected
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 inline-block mr-1 text-rose-700" />}
                    {allergy}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add custom allergen (e.g. Avocado)..."
                value={customAllergy}
                onChange={e => setCustomAllergy(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomAllergy()}
                className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={addCustomAllergy}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md text-xs font-medium text-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chronic Health Conditions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_CONDITIONS.map(cond => {
                const selected = formData.conditions.includes(cond);
                return (
                  <button
                    type="button"
                    key={cond}
                    onClick={() => toggleCondition(cond)}
                    className={`text-left p-2.5 rounded-lg text-xs font-medium border transition ${
                      selected
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                        {selected && <Check className="w-2.5 h-2.5" />}
                      </span>
                      <span>{cond}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Threshold limits */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Nutritional Limits per Meal
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Max Sodium (mg)</span>
                <input
                  type="number"
                  value={formData.limits.maxSodiumMg}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      limits: { ...formData.limits, maxSodiumMg: Number(e.target.value) }
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Max Sugar (g)</span>
                <input
                  type="number"
                  value={formData.limits.maxSugarG}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      limits: { ...formData.limits, maxSugarG: Number(e.target.value) }
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Max Carbs (g)</span>
                <input
                  type="number"
                  value={formData.limits.maxCarbsG}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      limits: { ...formData.limits, maxCarbsG: Number(e.target.value) }
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800">Accessibility Preferences</h4>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Spoken audio announcements</span>
              </div>
              <input
                type="checkbox"
                checked={formData.audioSpeechEnabled}
                onChange={e => setFormData({ ...formData, audioSpeechEnabled: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <span>High contrast mode</span>
              <input
                type="checkbox"
                checked={formData.highContrastMode}
                onChange={e => setFormData({ ...formData, highContrastMode: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <span>Large font display</span>
              <input
                type="checkbox"
                checked={formData.largeFontMode}
                onChange={e => setFormData({ ...formData, largeFontMode: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded"
              />
            </div>
          </div>

          {/* Optional Groq API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-500" />
              Groq Vision API Key (Optional)
            </label>
            <input
              type="password"
              placeholder="gsk_..."
              value={formData.groqApiKey}
              onChange={e => setFormData({ ...formData, groqApiKey: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              If omitted, the local clinical decision model processes all images offline.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};
