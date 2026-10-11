import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { UserHealthProfile } from '../types/index.ts';
import { DEFAULT_PROFILE } from '../data/constants.ts';
import { PlateVisionEngine } from '../services/visionEngine.ts';
import { profileAllergiesToIds } from './allergens.ts';
import { conditionAllergenRefsAreValid, profileConditionsToIds, profilePreferencesToIds } from './conditions.ts';
import { applyRulesToResult, evaluateFood, hasPhrase, normalizeText, type FoodInput } from './rulesEngine.ts';

/** Build a profile with sensible loose limits so each test only exercises what it names. */
function profile(over: Partial<UserHealthProfile> = {}): UserHealthProfile {
  return {
    ...DEFAULT_PROFILE,
    allergies: [],
    conditions: [],
    dietaryPreferences: [],
    limits: { maxSodiumMg: 2300, maxSugarG: 50, maxCarbsG: 150 },
    ...over,
  };
}

const pkg = (names: string[], extra: Partial<FoodInput> = {}): FoodInput => ({
  scanType: 'package_ocr',
  ingredients: names.map((name) => ({ name, confidence: 95 })),
  ...extra,
});

describe('profile parsing', () => {
  it('understands the strings the profile modal stores', () => {
    assert.deepEqual(profileAllergiesToIds(['Peanuts']).sort(), ['peanut']);
    assert.deepEqual(profileAllergiesToIds(['Tree Nuts']).sort(), ['tree_nut']);
    assert.deepEqual(profileAllergiesToIds(['Gluten / Wheat']), ['gluten']);
    assert.deepEqual(profileAllergiesToIds(['Dairy / Milk']), ['dairy']);
    assert.deepEqual(profileAllergiesToIds(['Shellfish', 'Fish']).sort(), ['fish', 'shellfish']);
  });

  it('treats a bare "nuts" as both peanut and tree nut (safer)', () => {
    assert.deepEqual(profileAllergiesToIds(['nuts']).sort(), ['peanut', 'tree_nut']);
  });

  it('maps condition and preference names', () => {
    assert.deepEqual(profileConditionsToIds(['Hypertension (High Blood Pressure)', 'Type 2 Diabetes']).sort(), ['diabetes', 'hypertension']);
    assert.deepEqual(profileConditionsToIds(['Chronic Kidney Disease (Low Potassium/Phosphorus)']), ['ckd']);
    assert.deepEqual(profilePreferencesToIds(['Vegan', 'Low Sodium', 'Low-Carb']).sort(), ['low_carb', 'low_sodium', 'vegan']);
  });

  it('references only known allergens', () => {
    assert.equal(conditionAllergenRefsAreValid(), true);
  });
});

describe('text matching', () => {
  it('matches whole words and simple plurals only', () => {
    assert.equal(hasPhrase(normalizeText('Crushed Peanuts'), 'peanut'), true);
    assert.equal(hasPhrase(normalizeText('Cod fillet'), 'cod'), true);
    assert.equal(hasPhrase(normalizeText('Chocolate'), 'cod'), false);
    assert.equal(hasPhrase(normalizeText('Maltodextrin'), 'malt'), false);
  });
});

describe('allergen aliases', () => {
  const dairy = profile({ allergies: ['Dairy / Milk'] });

  it('finds dairy by its hidden names', () => {
    for (const name of ['Whey protein', 'Sodium caseinate', 'Ghee', 'Paneer', 'Mozzarella']) {
      assert.equal(evaluateFood(pkg([name]), dairy).verdict, 'AVOID', name);
    }
  });

  it('does not call plant milks or nut butters dairy', () => {
    for (const name of ['Almond milk', 'Coconut milk', 'Oat milk', 'Cocoa butter', 'Peanut butter', 'Butternut squash', 'Cream of tartar']) {
      assert.equal(evaluateFood(pkg([name]), dairy).verdict, 'SAFE', name);
    }
  });

  it('finds gluten in wheat-based foods but not gluten-free flours', () => {
    const gluten = profile({ allergies: ['Gluten'] });
    for (const name of ['Semolina', 'Barley malt extract', 'Ramen noodles', 'Bleached wheat flour', 'Couscous']) {
      assert.equal(evaluateFood(pkg([name]), gluten).verdict, 'AVOID', name);
    }
    for (const name of ['Rice flour', 'Almond flour', 'Rice noodles', 'Corn tortilla', 'Cauliflower crust', 'Shirataki noodles', 'Maltodextrin']) {
      assert.equal(evaluateFood(pkg([name]), gluten).verdict, 'SAFE', name);
    }
  });

  it('respects "gluten free" / "dairy free" claims', () => {
    assert.equal(evaluateFood(pkg(['Gluten free bread']), profile({ allergies: ['Gluten'] })).verdict, 'SAFE');
    assert.equal(evaluateFood(pkg(['Dairy-free cheese']), dairy).verdict, 'SAFE');
  });

  it('catches hidden sources as caution, not avoid', () => {
    const r = evaluateFood(pkg(['Soy sauce']), profile({ allergies: ['Gluten'] }));
    assert.equal(r.verdict, 'CAUTION');
    assert.match(r.findings[0].title, /May contain Gluten/);
  });

  it('keeps tree nuts and peanuts separate', () => {
    assert.equal(evaluateFood(pkg(['Peanut oil']), profile({ allergies: ['Tree Nuts'] })).verdict, 'SAFE');
    assert.equal(evaluateFood(pkg(['Almond slivers']), profile({ allergies: ['Peanuts'] })).verdict, 'SAFE');
    assert.equal(evaluateFood(pkg(['Almond slivers']), profile({ allergies: ['Tree Nuts'] })).verdict, 'AVOID');
    assert.equal(evaluateFood(pkg(['Coconut flakes', 'Nutmeg']), profile({ allergies: ['Tree Nuts'] })).verdict, 'SAFE');
  });

  it('flags fish and shellfish sauces', () => {
    assert.equal(evaluateFood(pkg(['Fish sauce']), profile({ allergies: ['Fish'] })).verdict, 'AVOID');
    assert.equal(evaluateFood(pkg(['Oyster sauce']), profile({ allergies: ['Shellfish'] })).verdict, 'AVOID');
    assert.equal(evaluateFood(pkg(['Eggplant']), profile({ allergies: ['Eggs'] })).verdict, 'SAFE');
  });
});

describe('uncertainty and cross-contact', () => {
  it('"may contain" on a label is Caution, never Avoid', () => {
    const r = evaluateFood(pkg(['Rolled oats (may contain wheat)']), profile({ allergies: ['Gluten'] }));
    assert.equal(r.verdict, 'CAUTION');
    assert.match(r.findings[0].spoken, /traces/);
  });

  it('a low-confidence direct match is Caution, a confident one is Avoid', () => {
    const low = evaluateFood({ scanType: 'plate', ingredients: [{ name: 'Peanuts', confidence: 40 }] }, profile({ allergies: ['Peanuts'] }));
    const high = evaluateFood({ scanType: 'plate', ingredients: [{ name: 'Peanuts', confidence: 90 }] }, profile({ allergies: ['Peanuts'] }));
    assert.equal(low.verdict, 'CAUTION');
    assert.equal(high.verdict, 'AVOID');
  });

  it('model-reported allergens only raise a caution unless an ingredient confirms them', () => {
    const r = evaluateFood({ scanType: 'plate', ingredients: [{ name: 'Mystery sauce', confidence: 90 }], reportedAllergens: ['Gluten / Wheat'] }, profile({ allergies: ['Gluten'] }));
    assert.equal(r.verdict, 'CAUTION');
  });

  it('never calls an unreadable scan Safe', () => {
    assert.equal(evaluateFood({ scanType: 'plate', ingredients: [] }, profile()).verdict, 'CAUTION');
    const blurry = evaluateFood({ scanType: 'plate', ingredients: [{ name: 'Rice', confidence: 40 }, { name: 'Chicken', confidence: 35 }] }, profile());
    assert.equal(blurry.verdict, 'CAUTION');
  });

  it('caps Safe confidence for plate scans because photos hide ingredients', () => {
    const r = evaluateFood({ scanType: 'plate', ingredients: [{ name: 'Rice', confidence: 99 }] }, profile());
    assert.equal(r.verdict, 'SAFE');
    assert.equal(r.confidenceScore, 90);
    assert.ok(r.notes.some((n) => /hidden ingredients/.test(n)));
  });
});

describe('conditions', () => {
  it('celiac disease is as strict as a gluten allergy', () => {
    const r = evaluateFood(pkg(['Wheat noodles']), profile({ conditions: ['Celiac Disease'] }));
    assert.equal(r.verdict, 'AVOID');
  });

  it('lactose intolerance only warns', () => {
    const r = evaluateFood(pkg(['Whole milk']), profile({ conditions: ['Lactose Intolerance'] }));
    assert.equal(r.verdict, 'CAUTION');
  });

  it('kidney disease flags high-potassium foods', () => {
    const r = evaluateFood(pkg(['Banana', 'Rice']), profile({ conditions: ['Chronic Kidney Disease (Low Potassium/Phosphorus)'] }));
    assert.equal(r.verdict, 'CAUTION');
    assert.match(r.findings[0].title, /kidney/i);
  });

  it('gout flags purine-rich foods', () => {
    assert.equal(evaluateFood(pkg(['Grilled sardines']), profile({ conditions: ['Gout (Purine restriction)'] })).verdict, 'CAUTION');
  });
});

describe('nutrient thresholds', () => {
  it('stays Safe at or under the limit', () => {
    const r = evaluateFood(pkg(['Soup'], { nutrition: { sodiumMg: 600 } }), profile({ limits: { maxSodiumMg: 600, maxSugarG: 50, maxCarbsG: 150 } }));
    assert.equal(r.verdict, 'SAFE');
  });

  it('is Caution just over the limit', () => {
    const r = evaluateFood(pkg(['Soup'], { nutrition: { sodiumMg: 700 } }), profile({ limits: { maxSodiumMg: 600, maxSugarG: 50, maxCarbsG: 150 } }));
    assert.equal(r.verdict, 'CAUTION');
  });

  it('is Avoid at 2x the limit only when the user has the matching condition', () => {
    const limits = { maxSodiumMg: 600, maxSugarG: 50, maxCarbsG: 150 };
    const without = evaluateFood(pkg(['Soup'], { nutrition: { sodiumMg: 1300 } }), profile({ limits }));
    const withHtn = evaluateFood(pkg(['Soup'], { nutrition: { sodiumMg: 1300 } }), profile({ limits, conditions: ['Hypertension'] }));
    assert.equal(without.verdict, 'CAUTION');
    assert.equal(withHtn.verdict, 'AVOID');
  });

  it('tightens a loose user limit using condition guidance', () => {
    const r = evaluateFood(pkg(['Soup'], { nutrition: { sodiumMg: 900 } }), profile({ conditions: ['Hypertension'] })); // user limit 2300
    assert.equal(r.verdict, 'CAUTION');
    assert.equal(r.effectiveLimits.sodiumMg?.value, 600);
    assert.match(r.effectiveLimits.sodiumMg?.source ?? '', /hypertension/);
  });

  it('applies diabetes sugar and carb caps', () => {
    const r = evaluateFood(pkg(['Cereal'], { nutrition: { sugarG: 20, carbsG: 70 } }), profile({ conditions: ['Type 2 Diabetes'] }));
    assert.equal(r.verdict, 'CAUTION');
    assert.equal(r.findings.filter((f) => f.kind === 'nutrient').length, 2);
  });

  it('ignores missing nutrition rather than guessing', () => {
    assert.equal(evaluateFood(pkg(['Rice']), profile({ conditions: ['Hypertension'] })).verdict, 'SAFE');
  });
});

describe('diet preferences', () => {
  it('vegan rejects animal products but not plant look-alikes', () => {
    const vegan = profile({ dietaryPreferences: ['Vegan'] });
    assert.equal(evaluateFood(pkg(['Honey']), vegan).verdict, 'AVOID');
    assert.equal(evaluateFood(pkg(['Chicken broth']), vegan).verdict, 'AVOID');
    for (const name of ['Peanut butter', 'Coconut milk', 'Eggplant', 'Vegetable broth', 'Cocoa butter']) {
      assert.equal(evaluateFood(pkg([name]), vegan).verdict, 'SAFE', name);
    }
  });

  it('halal rejects pork and alcohol', () => {
    const halal = profile({ dietaryPreferences: ['Halal'] });
    assert.equal(evaluateFood(pkg(['Pork belly']), halal).verdict, 'AVOID');
    assert.equal(evaluateFood(pkg(['Chicken']), halal).verdict, 'SAFE');
  });
});

describe('verdict ordering and determinism', () => {
  it('lists Avoid findings before Caution findings', () => {
    const r = evaluateFood(pkg(['Peanuts', 'Soy sauce'], { nutrition: { sodiumMg: 900 } }), profile({ allergies: ['Peanuts', 'Gluten'], limits: { maxSodiumMg: 600, maxSugarG: 50, maxCarbsG: 150 } }));
    assert.equal(r.verdict, 'AVOID');
    assert.equal(r.findings[0].severity, 'avoid');
    assert.ok(r.findings.some((f) => f.severity === 'caution'));
  });

  it('gives identical output for identical input', () => {
    const input = pkg(['Wheat flour', 'Milk', 'Sugar'], { nutrition: { sugarG: 30 } });
    const p = profile({ allergies: ['Dairy / Milk'], conditions: ['Type 2 Diabetes'] });
    assert.deepEqual(evaluateFood(input, p), evaluateFood(input, p));
  });

  it('reports every allergen present, even ones the user is not allergic to', () => {
    const r = evaluateFood(pkg(['Peanuts', 'Egg', 'Sesame oil']), profile());
    assert.deepEqual(r.detectedAllergens, ['Eggs', 'Peanuts', 'Sesame']);
  });
});

describe('demo samples run through the rules engine (default profile: peanut + gluten, hypertension + T2D)', () => {
  const run = (id: string) => applyRulesToResult(PlateVisionEngine.runLocalCognitiveVisionPipeline('', DEFAULT_PROFILE, id), DEFAULT_PROFILE);

  it('pad thai -> Avoid for peanuts', () => {
    const r = run('pad-thai');
    assert.equal(r.verdict, 'AVOID');
    assert.ok(r.violatedRules.some((x) => /Peanuts/.test(x)));
    assert.ok(r.detectedIngredients.find((i) => i.name === 'Crushed Peanuts')?.flagged);
  });

  it('ramen -> Avoid for gluten', () => {
    const r = run('ramen-bowl');
    assert.equal(r.verdict, 'AVOID');
    assert.ok(r.violatedRules.some((x) => /Gluten/.test(x)));
  });

  it('granola -> Avoid for peanut butter', () => {
    const r = run('granola-package');
    assert.equal(r.verdict, 'AVOID');
    assert.ok(r.violatedRules.some((x) => /Peanuts/.test(x)));
  });

  it('frozen pizza -> Avoid for wheat flour', () => {
    assert.equal(run('frozen-pizza').verdict, 'AVOID');
  });

  it('quinoa bowl -> Safe', () => {
    const r = run('quinoa-salad');
    assert.equal(r.verdict, 'SAFE');
    assert.deepEqual(r.violatedRules, []);
    assert.match(r.summaryExplanation, /safe/i);
  });

  it('the same pad thai becomes Caution (not Avoid) for someone without the peanut allergy', () => {
    const p = { ...DEFAULT_PROFILE, allergies: [] as string[] };
    const r = applyRulesToResult(PlateVisionEngine.runLocalCognitiveVisionPipeline('', p, 'pad-thai'), p);
    assert.notEqual(r.verdict, 'AVOID');
  });
});
