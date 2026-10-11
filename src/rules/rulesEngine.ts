/**
 * PlateGuard rules engine (Role C).
 *
 * The AI models (vision / OCR) are ONLY allowed to say what they see: ingredients, confidences and
 * nutrition numbers. Whether that is Safe, Caution or Avoid is decided here, by plain deterministic
 * code, so the same input always gives the same answer and every answer can be explained and tested.
 *
 * Verdict ladder:
 *   AVOID   - a confirmed allergen / celiac gluten / diet-rule conflict, or a nutrient far over a limit
 *             for someone with the matching condition.
 *   CAUTION - "may contain" allergens, cross-contact, condition triggers, nutrients over a limit,
 *             or we simply could not read enough to be sure.
 *   SAFE    - nothing found AND we read the food with decent confidence.
 */

import type { AnalysisResult, DetectedItem, NutritionEstimate, UserHealthProfile, VerdictLevel } from '../types/index.ts';
import { ALLERGENS, profileAllergiesToIds, type AllergenId } from './allergens.ts';
import {
  CONDITIONS,
  PLANT_BASED_PHRASES,
  PREFERENCES,
  profileConditionsToIds,
  profilePreferencesToIds,
  type ConditionId,
  type Nutrient,
  type PreferenceId,
} from './conditions.ts';

/* ----------------------------- public types ----------------------------- */

export interface FoodIngredient {
  name: string;
  /** 0-100, how sure the vision/OCR step is that this ingredient is really there. Default 80. */
  confidence?: number;
  /** True when the label says "may contain" / "traces of" for this item. */
  mayContain?: boolean;
}

export interface FoodInput {
  scanType: 'plate' | 'package_ocr';
  ingredients: FoodIngredient[];
  /** Allergen words reported by the model or an allergen statement. Treated as "may contain" evidence. */
  reportedAllergens?: string[];
  nutrition?: NutritionEstimate;
}

export interface RuleFinding {
  id: string;
  kind: 'allergen' | 'condition' | 'nutrient' | 'preference' | 'data-quality';
  severity: 'avoid' | 'caution';
  /** Short text for the on-screen "violated rules" list. */
  title: string;
  /** Plain-language sentence for text-to-speech. */
  spoken: string;
  /** Original ingredient names involved. */
  ingredients: string[];
  /** 0-100 */
  confidence: number;
}

export interface RulesVerdict {
  verdict: VerdictLevel;
  confidenceScore: number;
  findings: RuleFinding[];
  /** Labels of every allergen present in the food, whether or not the user is allergic. */
  detectedAllergens: string[];
  notes: string[];
  /** Limits actually applied after combining the profile with condition guidance. */
  effectiveLimits: Partial<Record<Nutrient, { value: number; source: string }>>;
}

export const DISCLAIMER = 'PlateGuard supports, but does not replace, advice from your doctor or dietitian.';
export const PLATE_NOTE = 'A photo cannot show hidden ingredients such as oils, sauces or what is inside a cooked dish.';

/** Below this ingredient confidence a "direct" allergen match is reported as "may contain", not confirmed. */
export const CONFIRM_CONFIDENCE = 60;
/** Average ingredient confidence below this can never be called Safe. */
export const MIN_SAFE_CONFIDENCE = 70;
/** Nutrient at or above this multiple of the limit is Avoid (only for users with the matching condition). */
export const HARD_LIMIT_RATIO = 2;

/* ------------------------------ text helpers ----------------------------- */

export function normalizeText(s: string): string {
  return ` ${s.toLowerCase().replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')} `;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const reCache = new Map<string, RegExp>();

function phraseRe(phrase: string): RegExp {
  let re = reCache.get(phrase);
  if (!re) {
    const p = normalizeText(phrase).trim();
    re = new RegExp(`(?<= )${escapeRe(p)}(?:s|es)?(?= )`);
    reCache.set(phrase, re);
  }
  return re;
}

/** True when `phrase` appears as whole word(s) in already-normalised text. */
export function hasPhrase(normalized: string, phrase: string): boolean {
  return phraseRe(phrase).test(normalized);
}

function firstMatch(normalized: string, phrases: string[]): string | null {
  for (const p of phrases) if (hasPhrase(normalized, p)) return p;
  return null;
}

function stripPhrases(normalized: string, phrases: string[]): string {
  let out = normalized;
  for (const p of phrases) {
    const re = new RegExp(phraseRe(p).source, 'g');
    out = out.replace(re, ' ');
  }
  return out.replace(/\s+/g, ' ');
}

const CROSS_CONTACT = /\b(may contain|might contain|traces? of|trace amounts?|produced in|processed in|manufactured in|made in a facility|shared (?:equipment|facility|line))\b/;

/** "gluten free", "free from dairy", "without nuts" -> that allergen is explicitly absent. */
const FREE_FROM_WORDS: Record<AllergenId, string> = {
  peanut: 'peanut|groundnut',
  tree_nut: 'nut|tree nut',
  gluten: 'gluten|wheat',
  dairy: 'dairy|lactose|milk',
  shellfish: 'shellfish',
  fish: 'fish',
  egg: 'egg',
  soy: 'soy|soya',
  sesame: 'sesame',
  mustard: 'mustard',
  sulfites: 'sulfite|sulphite',
};
function declaredFree(text: string, id: AllergenId): boolean {
  const w = FREE_FROM_WORDS[id];
  return new RegExp(`\\b(?:${w})s? ?-? ?free\\b|\\bfree from (?:${w})|\\bwithout (?:${w})|\\bno (?:${w})`).test(text.toLowerCase());
}

/* ---------------------------- allergen detection ------------------------- */

type Strength = 'direct' | 'hidden' | 'trace';

interface AllergenHit {
  id: AllergenId;
  strength: Strength;
  ingredient: string;
  confidence: number;
}

function detectAllergens(ing: FoodIngredient): AllergenHit[] {
  const confidence = clamp(ing.confidence ?? 80);
  const rawLower = ing.name.toLowerCase();
  const crossContact = ing.mayContain === true || CROSS_CONTACT.test(rawLower);
  const text = normalizeText(ing.name);
  const hits: AllergenHit[] = [];

  for (const def of Object.values(ALLERGENS)) {
    if (declaredFree(ing.name, def.id)) continue;
    const cleaned = stripPhrases(text, def.excludes);
    const direct = firstMatch(cleaned, def.direct);
    const hidden = direct ? null : firstMatch(cleaned, def.hidden);
    if (!direct && !hidden) continue;
    const strength: Strength = crossContact ? 'trace' : direct ? 'direct' : 'hidden';
    hits.push({ id: def.id, strength, ingredient: ing.name, confidence });
  }
  return hits;
}

/* ------------------------------ main evaluate ---------------------------- */

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const labelOf = (id: AllergenId) => ALLERGENS[id].label;
const lower = (s: string) => s.toLowerCase();

export function evaluateFood(food: FoodInput, profile: UserHealthProfile): RulesVerdict {
  const allergyIds = new Set(profileAllergiesToIds(profile.allergies));
  const conditionIds = new Set<ConditionId>(profileConditionsToIds(profile.conditions));
  const prefIds = new Set<PreferenceId>(profilePreferencesToIds(profile.dietaryPreferences));

  // Celiac disease is handled exactly like a severe gluten allergy; lactose intolerance only warns.
  const strictIds = new Set<AllergenId>(allergyIds);
  const softIds = new Set<AllergenId>();
  for (const c of conditionIds) {
    CONDITIONS[c].strictAllergens.forEach((a) => strictIds.add(a));
    CONDITIONS[c].softAllergens.forEach((a) => { if (!strictIds.has(a)) softIds.add(a); });
  }

  // Treat model-reported allergens as extra "may contain" evidence.
  const items: FoodIngredient[] = [...food.ingredients];
  for (const word of food.reportedAllergens ?? []) {
    if (word.trim()) items.push({ name: `${word} reported by scan`, confidence: 75, mayContain: true });
  }

  const hits = items.flatMap(detectAllergens);
  const present = new Set<AllergenId>(hits.filter((h) => h.strength !== 'trace').map((h) => h.id));
  const findings = new Map<string, RuleFinding>();

  const add = (f: RuleFinding) => {
    const existing = findings.get(f.id);
    if (existing) {
      existing.ingredients = [...new Set([...existing.ingredients, ...f.ingredients])];
      existing.confidence = Math.max(existing.confidence, f.confidence);
    } else {
      findings.set(f.id, f);
    }
  };

  /* 1. allergens */
  for (const h of hits) {
    const label = labelOf(h.id);
    const isStrict = strictIds.has(h.id);
    const isSoft = softIds.has(h.id);
    if (!isStrict && !isSoft) continue;

    if (isSoft) {
      add({
        id: `allergen:${h.id}:caution`, kind: 'allergen', severity: 'caution', confidence: h.confidence, ingredients: [h.ingredient],
        title: `Contains ${label}, which can upset lactose intolerance`,
        spoken: `It contains ${lower(label)}, which may upset your lactose intolerance.`,
      });
      continue;
    }

    if (h.strength === 'direct' && h.confidence >= CONFIRM_CONFIDENCE) {
      add({
        id: `allergen:${h.id}:avoid`, kind: 'allergen', severity: 'avoid', confidence: h.confidence, ingredients: [h.ingredient],
        title: `Contains ${label} (allergy)`,
        spoken: `It contains ${lower(label)}, which you must avoid.`,
      });
    } else if (h.strength === 'direct') {
      add({
        id: `allergen:${h.id}:caution`, kind: 'allergen', severity: 'caution', confidence: h.confidence, ingredients: [h.ingredient],
        title: `May contain ${label} (low-confidence reading)`,
        spoken: `It may contain ${lower(label)}, but the scan is not certain.`,
      });
    } else if (h.strength === 'hidden') {
      add({
        id: `allergen:${h.id}:caution`, kind: 'allergen', severity: 'caution', confidence: Math.min(h.confidence, 75), ingredients: [h.ingredient],
        title: `May contain ${label}: ${h.ingredient} often includes it`,
        spoken: `It may contain ${lower(label)}, because ${lower(h.ingredient)} often includes it.`,
      });
    } else {
      add({
        id: `allergen:${h.id}:caution`, kind: 'allergen', severity: 'caution', confidence: h.confidence, ingredients: [h.ingredient],
        title: `May contain traces of ${label} (cross-contact)`,
        spoken: `It may contain traces of ${lower(label)} from shared equipment.`,
      });
    }
  }
  // A confirmed (avoid) finding makes the weaker "may contain" for the same allergen redundant.
  for (const id of [...strictIds]) {
    if (findings.has(`allergen:${id}:avoid`)) findings.delete(`allergen:${id}:caution`);
  }

  /* 2. diet preferences */
  for (const pid of prefIds) {
    const pref = PREFERENCES[pid];
    if (pref.forbidden.length === 0) continue;
    for (const ing of items) {
      if (ing.mayContain) continue;
      const text = stripPhrases(normalizeText(ing.name), PLANT_BASED_PHRASES);
      const hit = firstMatch(text, pref.forbidden);
      if (!hit) continue;
      const conf = clamp(ing.confidence ?? 80);
      const sure = conf >= CONFIRM_CONFIDENCE;
      add({
        id: `preference:${pid}:${sure ? 'avoid' : 'caution'}`, kind: 'preference', severity: sure ? 'avoid' : 'caution',
        confidence: conf, ingredients: [ing.name],
        title: `${sure ? 'Conflicts with' : 'May conflict with'} your ${pref.label} diet`,
        spoken: `${sure ? 'It conflicts with' : 'It may conflict with'} your ${lower(pref.label)} diet because of ${lower(ing.name)}.`,
      });
    }
  }

  /* 3. condition ingredient triggers */
  for (const cid of conditionIds) {
    const cond = CONDITIONS[cid];
    cond.triggers.forEach((trig, idx) => {
      for (const ing of items) {
        if (ing.mayContain) continue;
        if (!firstMatch(normalizeText(ing.name), trig.words)) continue;
        add({
          id: `condition:${cid}:${idx}`, kind: 'condition', severity: 'caution', confidence: clamp(ing.confidence ?? 80), ingredients: [ing.name],
          title: `${cond.label}: some ingredients ${trig.reason}`,
          spoken: `For your ${lower(cond.label)}, it includes foods that ${trig.reason}.`,
        });
      }
    });
  }

  /* 4. nutrient limits (profile limit tightened by condition / preference guidance) */
  const effectiveLimits: RulesVerdict['effectiveLimits'] = {};
  const nutrients: { key: Nutrient; unit: string; word: string; profileValue: number; related: ConditionId[] }[] = [
    { key: 'sodiumMg', unit: 'mg', word: 'Sodium', profileValue: profile.limits.maxSodiumMg, related: ['hypertension', 'ckd'] },
    { key: 'sugarG', unit: 'g', word: 'Sugar', profileValue: profile.limits.maxSugarG, related: ['diabetes'] },
    { key: 'carbsG', unit: 'g', word: 'Carbohydrates', profileValue: profile.limits.maxCarbsG, related: ['diabetes'] },
  ];
  for (const n of nutrients) {
    let limit = Number.isFinite(n.profileValue) && n.profileValue > 0 ? n.profileValue : Infinity;
    let source = 'your profile limit';
    for (const cid of conditionIds) {
      const cap = CONDITIONS[cid].caps[n.key];
      if (cap !== undefined && cap < limit) { limit = cap; source = `${lower(CONDITIONS[cid].label)} guidance`; }
    }
    for (const pid of prefIds) {
      const cap = PREFERENCES[pid].caps[n.key];
      if (cap !== undefined && cap < limit) { limit = cap; source = `your ${lower(PREFERENCES[pid].label)} diet`; }
    }
    if (!Number.isFinite(limit)) continue;
    effectiveLimits[n.key] = { value: limit, source };

    const value = food.nutrition?.[n.key];
    if (value === undefined || value === null || !(value > limit)) continue;
    const ratio = value / limit;
    const hasCondition = n.related.some((c) => conditionIds.has(c));
    const hard = ratio >= HARD_LIMIT_RATIO && hasCondition;
    const basis = food.scanType === 'package_ocr' ? 90 : 65;
    add({
      id: `nutrient:${n.key}:${hard ? 'avoid' : 'caution'}`, kind: 'nutrient', severity: hard ? 'avoid' : 'caution', confidence: basis, ingredients: [],
      title: `${n.word} about ${Math.round(value)} ${n.unit} exceeds ${Math.round(limit)} ${n.unit} (${source})`,
      spoken: `${n.word} is about ${Math.round(value)} ${n.unit === 'mg' ? 'milligrams' : 'grams'}, above your limit of ${Math.round(limit)}.`,
    });
  }

  /* 5. data quality: never call something Safe when we barely read it */
  const confs = food.ingredients.map((i) => clamp(i.confidence ?? 80));
  const avgConf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
  const hasNutrition = food.nutrition !== undefined && Object.values(food.nutrition).some((v) => typeof v === 'number');

  const notes: string[] = [];
  if (food.scanType === 'plate') notes.push(PLATE_NOTE);

  const list = [...findings.values()];
  const hasAvoid = list.some((f) => f.severity === 'avoid');
  const hasCaution = list.some((f) => f.severity === 'caution');

  if (!hasAvoid && !hasCaution) {
    if (food.ingredients.length === 0 && !hasNutrition) {
      list.push({
        id: 'data:none', kind: 'data-quality', severity: 'caution', confidence: 20, ingredients: [],
        title: 'No ingredients could be identified',
        spoken: 'I could not identify any ingredients. Please try again with better light, or move closer.',
      });
    } else if (avgConf < MIN_SAFE_CONFIDENCE && food.ingredients.length > 0) {
      list.push({
        id: 'data:low', kind: 'data-quality', severity: 'caution', confidence: Math.round(avgConf), ingredients: [],
        title: `Low confidence reading (${Math.round(avgConf)}%)`,
        spoken: 'I am not confident about what I can see, so I cannot say it is safe. Please rescan or check the label.',
      });
    }
  }

  /* 6. verdict + confidence */
  const rank = (f: RuleFinding) => (f.severity === 'avoid' ? 0 : 1);
  list.sort((a, b) => rank(a) - rank(b) || b.confidence - a.confidence);

  let verdict: VerdictLevel = 'SAFE';
  if (list.some((f) => f.severity === 'avoid')) verdict = 'AVOID';
  else if (list.length > 0) verdict = 'CAUTION';

  let confidenceScore: number;
  if (verdict === 'SAFE') {
    const cap = food.scanType === 'plate' ? 90 : 98; // a photo cannot prove a dish is free of hidden ingredients
    confidenceScore = Math.round(Math.min(cap, avgConf));
  } else {
    const top = list.filter((f) => f.severity === (verdict === 'AVOID' ? 'avoid' : 'caution'));
    confidenceScore = Math.round(Math.max(...top.map((f) => f.confidence)));
  }

  return {
    verdict,
    confidenceScore: clamp(confidenceScore, 1, 99),
    findings: list,
    detectedAllergens: [...present].map(labelOf).sort(),
    notes,
    effectiveLimits,
  };
}

/* ------------------------- plain-language explanation -------------------- */

export function buildSummary(r: RulesVerdict, food: Pick<FoodInput, 'scanType' | 'ingredients'>): string {
  const reasons = r.findings.map((f) => f.spoken);
  const top = reasons.slice(0, 2).join(' ');
  const more = reasons.length > 2 ? ` There ${reasons.length - 2 === 1 ? 'is 1 more issue' : `are ${reasons.length - 2} more issues`}.` : '';
  if (r.verdict === 'AVOID') return `Avoid this. ${top}${more}`;
  if (r.verdict === 'CAUTION') return `Be careful. ${top}${more}`;
  const n = food.ingredients.length;
  return `This looks safe for your profile. I checked ${n} ingredient${n === 1 ? '' : 's'} against your allergies, conditions and limits.${food.scanType === 'plate' ? ' A photo cannot see hidden ingredients, so ask if unsure.' : ''}`;
}

export function buildAdvice(r: RulesVerdict): string {
  const parts: string[] = [];
  if (r.verdict === 'AVOID') parts.push('Do not eat this. If you are unsure, ask the cook or check the packaging.');
  else if (r.verdict === 'CAUTION') parts.push('Check the packaging or ask how it was made before eating. A smaller portion or a swap may help.');
  else parts.push('No problems found for your profile.');
  parts.push(...r.notes);
  parts.push(DISCLAIMER);
  return parts.join(' ');
}

/* -------------------- adapter for the existing AnalysisResult ------------- */

/**
 * Re-decide an AnalysisResult produced by the vision step. The model's ingredient list, confidences and
 * nutrition numbers are kept; its verdict, allergen flags and explanation are replaced by the rules engine.
 */
export function applyRulesToResult(result: AnalysisResult, profile: UserHealthProfile): AnalysisResult {
  const food: FoodInput = {
    scanType: result.scanType,
    ingredients: result.detectedIngredients.map((i) => ({ name: i.name, confidence: i.confidence })),
    reportedAllergens: result.detectedAllergens,
    nutrition: result.nutritionEstimate,
  };
  const verdict = evaluateFood(food, profile);

  const detectedIngredients: DetectedItem[] = result.detectedIngredients.map((item) => {
    const related = verdict.findings.filter((f) => f.ingredients.includes(item.name));
    const worst = related.find((f) => f.severity === 'avoid') ?? related[0];
    return { ...item, flagged: related.length > 0, reason: worst ? worst.title : undefined };
  });

  return {
    ...result,
    verdict: verdict.verdict,
    confidenceScore: verdict.confidenceScore,
    summaryExplanation: buildSummary(verdict, food),
    detectedIngredients,
    detectedAllergens: verdict.detectedAllergens,
    violatedRules: verdict.findings.map((f) => f.title),
    safetyAdvice: buildAdvice(verdict),
  };
}
