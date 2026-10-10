# PlateGuard Vision

PlateGuard Vision is an accessible, web-based food-safety evaluation tool designed for people with dietary restrictions, chronic health conditions, and visual impairments.

Point your device camera at a meal or packaged food item to receive immediate voice and high-contrast visual feedback on allergen conflicts, nutritional thresholds, and safe dietary alternatives.

---

## Features

- **Food & Packaging Inspection**: Point and capture meals or packaged ingredient panels directly in the browser using HTML5 `getUserMedia`.
- **Hands-Free Voice Interaction**: Voice search and query input powered by the Web Speech Recognition API.
- **Audible Guidance & Feedback**: Voice synthesis readouts and acoustic cues for visually impaired or low-vision users.
- **Clinical Rule & Threshold Engine**: Flags severe allergens (nuts, gluten, dairy, shellfish) and monitors sodium, sugar, and carb allowances for conditions like Hypertension and Type 2 Diabetes.
- **Dietary Alternative Proposals**: Suggests recipe tweaks and visual representations for safer alternative meals when an item is flagged.
- **Progressive Web App (PWA)**: Installable directly on mobile devices with offline-capable service workers.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **PWA**: `vite-plugin-pwa` with Workbox service workers
- **Audio & Accessibility**: Web Speech API (`SpeechSynthesis` & `webkitSpeechRecognition`), Web Audio API
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rachit2407/plateguard-vision.git
   cd plateguard-vision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## Project Structure

```
src/
├── components/          # UI components (Scanner, ResultCard, ProfileModal)
├── data/                # Reference test samples and default health rules
├── services/            # Vision evaluation, voice input & speech synthesis
├── types/               # TypeScript data models and evaluation schemas
├── App.tsx              # Application layout and navigation
└── index.css            # Global styling and accessibility definitions
```

---

## License

MIT
