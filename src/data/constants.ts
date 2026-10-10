import type { ScanSample, UserHealthProfile } from '../types';

export const DEFAULT_PROFILE: UserHealthProfile = {
  name: "Alex Morgan",
  allergies: ["Peanuts", "Gluten"],
  conditions: ["Hypertension", "Type 2 Diabetes"],
  dietaryPreferences: ["Low Sodium"],
  limits: {
    maxSodiumMg: 600, // per meal
    maxSugarG: 10,
    maxCarbsG: 45,
  },
  audioSpeechEnabled: true,
  highContrastMode: false,
  largeFontMode: false,
  groqApiKey: "",
};

export const COMMON_ALLERGIES = [
  "Peanuts",
  "Tree Nuts",
  "Gluten / Wheat",
  "Dairy / Milk",
  "Shellfish",
  "Fish",
  "Eggs",
  "Soy",
  "Sesame",
  "Mustard",
  "Sulfites"
];

export const COMMON_CONDITIONS = [
  "Hypertension (High Blood Pressure)",
  "Type 2 Diabetes",
  "Celiac Disease",
  "Chronic Kidney Disease (Low Potassium/Phosphorus)",
  "GERD / Acid Reflux",
  "Lactose Intolerance",
  "High Cholesterol",
  "Gout (Purine restriction)"
];

export const DEMO_SAMPLES: ScanSample[] = [
  {
    id: "pad-thai",
    title: "Thai Chicken Peanut Noodles",
    category: "dish",
    imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80",
    description: "Stir-fried rice noodles with chicken, crushed roasted peanuts, egg, bean sprouts, and fish sauce.",
    testProfileMatch: "Violates Peanut Allergy and High Sodium for Hypertension"
  },
  {
    id: "ramen-bowl",
    title: "Spicy Miso Tonkotsu Ramen",
    category: "dish",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    description: "Wheat ramen noodles in rich pork broth with chashu pork, soy-marinated soft egg, and bamboo shoots.",
    testProfileMatch: "Violates Gluten Allergy and Severe Sodium limit (~1,850mg)"
  },
  {
    id: "quinoa-salad",
    title: "Mediterranean Quinoa Garden Bowl",
    category: "dish",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    description: "Fluffy quinoa, cucumber, cherry tomatoes, avocado, olive oil, lemon zest, pumpkin seeds, and mint.",
    testProfileMatch: "SAFE for Alex: Gluten-free, Peanut-free, Low glycemic index, Low sodium."
  },
  {
    id: "granola-package",
    title: "Honey Almond Crunch Granola (Package)",
    category: "package",
    imageUrl: "https://images.unsplash.com/photo-1517093157656-b9ec81640a23?auto=format&fit=crop&w=800&q=80",
    description: "Nutrition label listing rolled oats (wheat cross-contact), almonds, peanut butter syrup, cane sugar (24g).",
    testProfileMatch: "Violates Peanut allergy and Sugar limit (>10g sugar per serving)"
  },
  {
    id: "frozen-pizza",
    title: "Classic Four-Cheese Pepperoni Pizza (Package)",
    category: "package",
    imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80",
    description: "Bleached wheat flour dough, cured pepperoni, high sodium preservative nitrates, mozzarella, cheddar.",
    testProfileMatch: "Violates Gluten allergy and Sodium cap (>1,100mg per slice)"
  }
];
