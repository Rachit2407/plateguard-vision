export type VerdictLevel = 'SAFE' | 'CAUTION' | 'AVOID';

export interface UserHealthProfile {
  name: string;
  allergies: string[]; // e.g. ["Peanuts", "Tree Nuts", "Gluten", "Dairy", "Shellfish", "Soy", "Eggs", "Sesame"]
  conditions: string[]; // e.g. ["Type 2 Diabetes", "Hypertension", "Chronic Kidney Disease", "Celiac Disease", "GERD"]
  dietaryPreferences: string[]; // e.g. ["Vegetarian", "Vegan", "Halal", "Kosher", "Low-Carb"]
  limits: {
    maxSodiumMg: number;
    maxSugarG: number;
    maxCarbsG: number;
  };
  audioSpeechEnabled: boolean;
  highContrastMode: boolean;
  largeFontMode: boolean;
  groqApiKey: string;
}

export interface DetectedItem {
  name: string;
  category: 'dish' | 'ingredient' | 'additive' | 'allergen';
  confidence: number;
  flagged: boolean;
  reason?: string;
}

export interface NutritionEstimate {
  calories?: number;
  sodiumMg?: number;
  sugarG?: number;
  carbsG?: number;
  proteinG?: number;
  fiberG?: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  dishOrProductName: string;
  scanType: 'plate' | 'package_ocr';
  verdict: VerdictLevel;
  confidenceScore: number; // 0 - 100
  summaryExplanation: string;
  detectedIngredients: DetectedItem[];
  detectedAllergens: string[];
  violatedRules: string[];
  safetyAdvice: string;
  nutritionEstimate?: NutritionEstimate;
  saferAlternative?: {
    suggestedDishName: string;
    modifications: string[];
    recipeTweakSummary: string;
    generatedImageUrl?: string;
    generationPrompt?: string;
  };
}

export interface ScanSample {
  id: string;
  title: string;
  category: 'dish' | 'package';
  imageUrl: string;
  description: string;
  testProfileMatch: string;
}
