/**
 * Health-condition and dietary-preference rules (Role C).
 *
 * A condition can do three things:
 *  1. tighten a nutrient cap (hypertension -> sodium per meal)
 *  2. flag ingredients (gout -> anchovies, organ meat)
 *  3. imply an allergen-style strict rule (celiac -> gluten is treated like a severe allergen)
 *
 * All numbers are PER MEAL / PER SERVING and are conservative defaults drawn from common
 * public guidance (AHA sodium < 1,500-2,300 mg/day, ADA ~45-60 g carbs/meal). They are
 * decision-support only and must always be shown with a "not medical advice" disclaimer.
 */

import { ALLERGEN_IDS, type AllergenId } from './allergens.ts';

export type ConditionId =
  | 'hypertension'
  | 'diabetes'
  | 'celiac'
  | 'ckd'
  | 'gerd'
  | 'lactose_intolerance'
  | 'high_cholesterol'
  | 'gout';

export type PreferenceId = 'vegetarian' | 'vegan' | 'halal' | 'kosher' | 'low_sodium' | 'low_carb';

export type Nutrient = 'sodiumMg' | 'sugarG' | 'carbsG';

export interface ConditionDef {
  id: ConditionId;
  label: string;
  /** Per-meal ceiling that overrides a looser user-entered limit. */
  caps: Partial<Record<Nutrient, number>>;
  /** Ingredient phrases that matter for this condition, with the reason to speak aloud. */
  triggers: { words: string[]; reason: string }[];
  /** Allergen ids that are treated as strictly as an allergy for this condition. */
  strictAllergens: AllergenId[];
  /** Allergen ids that only warrant a caution (intolerance, not allergy). */
  softAllergens: AllergenId[];
}

export const CONDITIONS: Record<ConditionId, ConditionDef> = {
  hypertension: {
    id: 'hypertension',
    label: 'Hypertension',
    caps: { sodiumMg: 600 },
    triggers: [
      {
        words: ['soy sauce', 'fish sauce', 'oyster sauce', 'bouillon', 'stock cube', 'cured', 'pickled', 'brined', 'salted', 'bacon', 'ham', 'salami', 'pepperoni', 'sausage', 'instant noodle', 'monosodium glutamate', 'msg', 'miso'],
        reason: 'are typically high in sodium, which can raise blood pressure',
      },
    ],
    strictAllergens: [],
    softAllergens: [],
  },
  diabetes: {
    id: 'diabetes',
    label: 'Diabetes',
    caps: { sugarG: 15, carbsG: 60 },
    triggers: [
      {
        words: ['sugar', 'cane sugar', 'brown sugar', 'honey', 'syrup', 'corn syrup', 'high fructose', 'glucose', 'dextrose', 'maltose', 'molasses', 'agave', 'jaggery', 'gur', 'candy', 'soda', 'cola', 'sweetened', 'juice concentrate'],
        reason: 'are sugar sources that can spike blood glucose',
      },
    ],
    strictAllergens: [],
    softAllergens: [],
  },
  celiac: {
    id: 'celiac',
    label: 'Celiac disease',
    caps: {},
    triggers: [],
    strictAllergens: ['gluten'],
    softAllergens: [],
  },
  ckd: {
    id: 'ckd',
    label: 'Chronic kidney disease',
    caps: { sodiumMg: 600 },
    triggers: [
      {
        words: ['banana', 'potato', 'tomato', 'spinach', 'avocado', 'orange juice', 'dried fruit', 'beans', 'lentil', 'bran', 'cola', 'chocolate', 'salt substitute', 'potassium chloride'],
        reason: 'are high in potassium, which kidneys may struggle to clear',
      },
      {
        words: ['phosphate', 'phosphoric acid', 'processed cheese', 'cola', 'organ meat'],
        reason: 'are high in phosphorus or phosphate additives, which are limited in kidney disease',
      },
    ],
    strictAllergens: [],
    softAllergens: [],
  },
  gerd: {
    id: 'gerd',
    label: 'Acid reflux (GERD)',
    caps: {},
    triggers: [
      {
        words: ['chili', 'chilli', 'cayenne', 'hot sauce', 'spicy', 'tomato', 'citrus', 'lemon', 'lime', 'orange', 'garlic', 'onion', 'mint', 'peppermint', 'chocolate', 'coffee', 'fried', 'deep fried', 'vinegar', 'alcohol', 'soda', 'cola'],
        reason: 'are common reflux triggers',
      },
    ],
    strictAllergens: [],
    softAllergens: [],
  },
  lactose_intolerance: {
    id: 'lactose_intolerance',
    label: 'Lactose intolerance',
    caps: {},
    triggers: [],
    strictAllergens: [],
    softAllergens: ['dairy'],
  },
  high_cholesterol: {
    id: 'high_cholesterol',
    label: 'High cholesterol',
    caps: {},
    triggers: [
      {
        words: ['bacon', 'lard', 'butter', 'ghee', 'cream', 'pork belly', 'chashu', 'sausage', 'salami', 'pepperoni', 'organ meat', 'liver', 'shortening', 'palm oil', 'coconut oil', 'deep fried', 'fried'],
        reason: 'are high in saturated fat, which can raise cholesterol',
      },
    ],
    strictAllergens: [],
    softAllergens: [],
  },
  gout: {
    id: 'gout',
    label: 'Gout',
    caps: {},
    triggers: [
      {
        words: ['anchovy', 'anchovies', 'sardine', 'mackerel', 'herring', 'scallop', 'mussel', 'organ meat', 'liver', 'sweetbread', 'beer', 'yeast extract', 'red meat', 'beef', 'lamb', 'pork', 'bacon', 'gravy', 'shellfish'],
        reason: 'are high in purines, which can trigger gout flares',
      },
    ],
    strictAllergens: [],
    softAllergens: [],
  },
};

export interface PreferenceDef {
  id: PreferenceId;
  label: string;
  /** Ingredient phrases that violate the preference. */
  forbidden: string[];
  caps: Partial<Record<Nutrient, number>>;
}

const MEAT = [
  'chicken', 'beef', 'pork', 'lamb', 'mutton', 'turkey', 'duck', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
  'chashu', 'pork belly', 'meatball', 'steak', 'brisket', 'veal', 'venison', 'goat', 'liver', 'lard', 'gelatin', 'gelatine',
  'bone broth', 'chicken broth', 'beef broth', 'pork broth', 'tallow', 'suet', 'prosciutto', 'chorizo', 'hot dog', 'tonkotsu',
];
const SEAFOOD = [
  'fish', 'salmon', 'tuna', 'cod', 'shrimp', 'prawn', 'crab', 'lobster', 'squid', 'oyster', 'anchovy', 'anchovies',
  'sardine', 'mackerel', 'fish sauce', 'oyster sauce', 'dashi', 'bonito', 'worcestershire', 'shellfish',
];
const ANIMAL_OTHER = ['egg', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'honey', 'whey', 'casein', 'ghee', 'paneer', 'mayonnaise', 'lactose', 'gelatin'];

export const PREFERENCES: Record<PreferenceId, PreferenceDef> = {
  vegetarian: { id: 'vegetarian', label: 'Vegetarian', forbidden: [...MEAT, ...SEAFOOD], caps: {} },
  vegan: { id: 'vegan', label: 'Vegan', forbidden: [...MEAT, ...SEAFOOD, ...ANIMAL_OTHER], caps: {} },
  halal: { id: 'halal', label: 'Halal', forbidden: ['pork', 'bacon', 'ham', 'lard', 'gelatin', 'gelatine', 'wine', 'beer', 'rum', 'alcohol', 'sake', 'mirin', 'chashu', 'pork belly', 'pepperoni', 'salami', 'prosciutto', 'tonkotsu'], caps: {} },
  kosher: { id: 'kosher', label: 'Kosher', forbidden: ['pork', 'bacon', 'ham', 'lard', 'shrimp', 'prawn', 'crab', 'lobster', 'oyster', 'clam', 'mussel', 'scallop', 'squid', 'octopus', 'shellfish', 'pepperoni', 'chashu', 'pork belly', 'tonkotsu'], caps: {} },
  low_sodium: { id: 'low_sodium', label: 'Low sodium', forbidden: [], caps: { sodiumMg: 600 } },
  low_carb: { id: 'low_carb', label: 'Low carb', forbidden: [], caps: { carbsG: 30 } },
};

/**
 * Plant-based phrases that contain animal-sounding words (peanut butter, coconut milk, eggplant...).
 * They are removed from ingredient text before vegan / vegetarian matching.
 */
export const PLANT_BASED_PHRASES = [
  'peanut butter', 'almond butter', 'nut butter', 'cocoa butter', 'shea butter', 'sunflower butter', 'butter bean', 'butternut',
  'coconut milk', 'coconut cream', 'almond milk', 'oat milk', 'soy milk', 'rice milk', 'cashew milk', 'hemp milk',
  'eggplant', 'cream of tartar', 'vegan cheese', 'cashew cheese', 'vegan butter', 'vegetable broth', 'vegetable stock',
  'veggie broth', 'mushroom broth', 'cream soda', 'ham bean',
];

/** Understand the free-text strings the profile modal stores. Unknown strings are ignored. */
export function profileConditionsToIds(conditions: string[]): ConditionId[] {
  const out = new Set<ConditionId>();
  for (const raw of conditions) {
    const s = raw.toLowerCase();
    if (/hypertens|blood pressure/.test(s)) out.add('hypertension');
    if (/diabet|blood sugar|glycemi/.test(s)) out.add('diabetes');
    if (/celiac|coeliac/.test(s)) out.add('celiac');
    if (/kidney|ckd|renal/.test(s)) out.add('ckd');
    if (/gerd|reflux|heartburn/.test(s)) out.add('gerd');
    if (/lactose/.test(s)) out.add('lactose_intolerance');
    if (/cholesterol|lipid/.test(s)) out.add('high_cholesterol');
    if (/gout|purine|uric/.test(s)) out.add('gout');
  }
  return [...out];
}

export function profilePreferencesToIds(prefs: string[]): PreferenceId[] {
  const out = new Set<PreferenceId>();
  for (const raw of prefs) {
    const s = raw.toLowerCase();
    if (/\bvegan/.test(s)) out.add('vegan');
    else if (/vegetarian/.test(s)) out.add('vegetarian');
    if (/halal/.test(s)) out.add('halal');
    if (/kosher/.test(s)) out.add('kosher');
    if (/low[\s-]*sodium|low[\s-]*salt/.test(s)) out.add('low_sodium');
    if (/low[\s-]*carb|keto/.test(s)) out.add('low_carb');
  }
  return [...out];
}

/** Sanity guard used in tests: every allergen id referenced by a condition must exist. */
export function conditionAllergenRefsAreValid(): boolean {
  const known = new Set<string>(ALLERGEN_IDS);
  return Object.values(CONDITIONS).every((c) => [...c.strictAllergens, ...c.softAllergens].every((a) => known.has(a)));
}
