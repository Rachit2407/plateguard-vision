# PlateGuard Vision — Role Interface Specifications & Integration Contracts

Built for **Banana Hacks 2026** (Theme: *Image AI — Classification, OCR, Synthetic Generation*).

---

## 👥 Team Roles Overview

| Role | Domain | Primary Deliverables | Owner |
|---|---|---|---|
| **A** | **Frontend & UI (Yours)** | PWA setup, camera capture, large-text accessible UI, Web Speech voice input, high contrast mode | **You** |
| **B** | **AI Pipeline** | Multimodal vision & OCR inference returning structured JSON, synthetic image-editing/generation call | Team Member B |
| **C** | **Rules & Data** | Allergen alias table, health thresholds (sodium/sugar), safety verdict decision engine with unit tests | Team Member C |
| **D** | **Voice, Demo & Writing** | TTS audio scripts, test image dataset, ≤3 min demo video, Devpost submission write-up | Team Member D |

---

## 🔌 Role B Contract (AI Pipeline Output)

Role B's endpoint should return JSON matching [`AnalysisResult`](file:///c:/Users/Mayank%20yadav/Downloads/banana/src/types/index.ts):

```json
{
  "dishOrProductName": "Thai Chicken Peanut Noodles",
  "scanType": "plate",
  "verdict": "AVOID",
  "confidenceScore": 94,
  "summaryExplanation": "CRITICAL WARNING: This dish contains crushed roasted peanuts. Do not consume due to your severe peanut allergy.",
  "detectedIngredients": [
    { "name": "Crushed Peanuts", "category": "allergen", "confidence": 96, "flagged": true, "reason": "Severe Anaphylaxis Risk" },
    { "name": "Rice Noodles", "category": "ingredient", "confidence": 92, "flagged": false },
    { "name": "Tamarind & Fish Sauce", "category: "ingredient", "confidence": 88, "flagged": true, "reason": "High Sodium" }
  ],
  "detectedAllergens": ["Peanuts", "Fish"],
  "violatedRules": ["Contains crushed roasted peanuts & peanut oil (Major allergen hazard)"],
  "safetyAdvice": "Avoid this dish. Request an allergy-safe stir fry prepared in clean cookware without nut garnish.",
  "nutritionEstimate": {
    "calories": 680,
    "sodiumMg": 1150,
    "sugarG": 16,
    "carbsG": 68,
    "proteinG": 34,
    "fiberG": 4
  },
  "saferAlternative": {
    "suggestedDishName": "Allergy-Safe Sesame Amino Chicken Zoodle Stir-Fry",
    "modifications": [
      "Substituted peanuts with roasted pumpkin seeds",
      "Swapped fish sauce for low-sodium coconut aminos",
      "Substituted half noodles with zucchini noodles"
    ],
    "recipeTweakSummary": "Sauté chicken in sesame oil and coconut aminos with zucchini ribbons and toasted pumpkin seeds.",
    "generatedImageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
    "generationPrompt": "Studio photograph of allergy-free chicken zucchini noodle bowl, roasted pumpkin seeds..."
  }
}
```

---

## 🧪 Role C Contract (Rules & Data)

Role C maintains the allergen matching table and threshold rules:

- **Allergen Aliases**:
  - `Peanuts`: peanut butter, arachis oil, groundnuts, monkey nuts
  - `Gluten`: wheat, barley, rye, spelt, semolina, durum, malt
  - `Dairy`: casein, whey, milk powder, lactose, curd, ghee, butter
- **Verdict Rules**:
  - `AVOID`: Any detected allergen matches user profile `allergies`
  - `CAUTION`: Sodium > `profile.limits.maxSodiumMg`, Sugar > `profile.limits.maxSugarG`, or condition conflicts
  - `SAFE`: Zero allergen flags and all nutrient metrics within bounds

---

## 🎙️ Role D Deliverables (Presentation & Demo Script)

1. **≤3 Minute Demo Video Outline**:
   - **0:00 - 0:30**: Problem statement — visually impaired individuals & people with severe dietary restrictions struggle to safely read food menus or small nutrition labels.
   - **0:30 - 1:15**: Live Demo of PlateGuard PWA: Point camera or use hands-free voice input to scan food.
   - **1:15 - 1:55**: Instant audible warning ("Warning: Contains Peanuts") and visual high-contrast card display.
   - **1:55 - 2:30**: Synthetic Image AI generation displaying the safe recipe alternative ("Allergy-Safe Zoodle Stir-Fry").
   - **2:30 - 3:00**: Technical stack recap, accessibility features, and future roadmap.
