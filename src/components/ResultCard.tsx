import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Volume2, ArrowRight } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface ResultCardProps {
  result: AnalysisResult;
  onSynthesizeVoice: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, onSynthesizeVoice }) => {
  const isSafe = result.verdict === 'SAFE';
  const isCaution = result.verdict === 'CAUTION';

  const verdictConfig = isSafe
    ? {
        bannerBg: 'bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        titleColor: 'text-emerald-950',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        label: 'Safe for Consumption'
      }
    : isCaution
    ? {
        bannerBg: 'bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        titleColor: 'text-amber-950',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        label: 'Caution Advised'
      }
    : {
        bannerBg: 'bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        titleColor: 'text-rose-950',
        icon: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
        label: 'Do Not Consume (Allergen Hazard)'
      };

  return (
    <div className="space-y-6">
      {/* Verdict Header Banner */}
      <div className={`p-5 rounded-xl border ${verdictConfig.bannerBg} shadow-xs`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{verdictConfig.icon}</div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${verdictConfig.badgeBg}`}>
                  {verdictConfig.label}
                </span>
                <span className="text-xs text-slate-500">
                  Confidence: {result.confidenceScore}% • Scanned {result.timestamp}
                </span>
              </div>
              <h2 className={`text-xl font-bold ${verdictConfig.titleColor}`}>
                {result.dishOrProductName}
              </h2>
            </div>
          </div>

          <button
            onClick={onSynthesizeVoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition shrink-0"
            aria-label="Read verdict aloud"
          >
            <Volume2 className="w-4 h-4 text-slate-600" />
            <span>Read Summary Aloud</span>
          </button>
        </div>

        {/* Spoken summary explanation */}
        <p className="mt-3 text-sm text-slate-800 leading-relaxed font-normal bg-white/80 p-3.5 rounded-lg border border-slate-200/60">
          {result.summaryExplanation}
        </p>

        {/* Violated safety rules */}
        {result.violatedRules && result.violatedRules.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1.5">
              Identified Rule Conflicts:
            </h4>
            <ul className="space-y-1">
              {result.violatedRules.map((rule, idx) => (
                <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                  <span className="text-rose-600 font-bold leading-none mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Two-Column Structured Data Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Ingredient Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Visual Ingredient Detection
            </h3>
            <span className="text-xs text-slate-400">CV Confidence</span>
          </div>

          <div className="divide-y divide-slate-100">
            {result.detectedIngredients.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-1.5">
                    <span>{item.name}</span>
                    {item.flagged && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                        FLAGGED
                      </span>
                    )}
                  </div>
                  {item.reason && (
                    <span className="text-[11px] text-rose-600 block mt-0.5">{item.reason}</span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {item.confidence}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Nutritional Information & Clinical Advice */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
              Estimated Nutritional Values
            </h3>

            {result.nutritionEstimate ? (
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 block">Calories</span>
                  <span className="text-base font-semibold text-slate-900">{result.nutritionEstimate.calories}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 block">Sodium</span>
                  <span className="text-base font-semibold text-slate-900">{result.nutritionEstimate.sodiumMg} mg</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 block">Sugar</span>
                  <span className="text-base font-semibold text-slate-900">{result.nutritionEstimate.sugarG} g</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 block">Total Carbs</span>
                  <span className="text-base font-semibold text-slate-900">{result.nutritionEstimate.carbsG} g</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 block">Protein</span>
                  <span className="text-base font-semibold text-slate-900">{result.nutritionEstimate.proteinG} g</span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[11px] text-slate-500 block">Dietary Fiber</span>
                  <span className="text-base font-semibold text-slate-900">{result.nutritionEstimate.fiberG || 3} g</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mb-4">Nutritional values are not available for this item.</p>
            )}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
            <span className="font-semibold block mb-0.5">Clinical & Dietary Advice:</span>
            <p className="leading-relaxed">{result.safetyAdvice}</p>
          </div>
        </div>
      </div>

      {/* Recommended Safer Alternative */}
      {result.saferAlternative && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                Dietary Substitution Proposal
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Recommended Modification: {result.saferAlternative.suggestedDishName}
              </h3>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline-block">Personalized Safe Version</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-4 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={result.saferAlternative.generatedImageUrl}
                alt={result.saferAlternative.suggestedDishName}
                className="w-full h-44 object-cover"
              />
              <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 border-t border-slate-200">
                Synthesized Plate Reference
              </div>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-1.5">
                  Ingredient Substitutions:
                </h4>
                <ul className="space-y-1 text-xs text-slate-700">
                  {result.saferAlternative.modifications.map((mod, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <span>{mod}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-900 block mb-0.5">Kitchen Recipe Instruction:</span>
                <p>{result.saferAlternative.recipeTweakSummary}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
