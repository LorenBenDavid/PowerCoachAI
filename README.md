# PowerCoach AI 🏋️‍♂️

**PowerCoach AI** is an intelligent powerlifting assistant that builds weekly personalized training and nutrition programs using artificial intelligence. Designed for athletes who want to get stronger in the three major lifts — Squat, Bench Press, and Deadlift — the app adapts to your actual performance, listens to your feedback, and evolves with you.

---

## 🔎 What is PowerCoach AI?

PowerCoach AI creates tailored training and diet plans that adapt weekly based on user input. It uses AI to:

* Generate powerlifting-specific workouts
* Adjust plans using your **RPE feedback** (Rate of Perceived Exertion)
* React to **custom food or exercise changes** submitted by you
* Balance **progressive overload** with safety and recovery
* Ensure **minimum protein intake** and proper meal structure

It’s built with real athletes in mind: strength-oriented, goal-driven, and data-informed.

---

## 🔄 How It Works

1. ✍️ **You tell us about yourself** — age, gender, weight, fitness goals, injury history, preferred workout days.
2. 🤖 **AI generates a Week 1 plan** (light start).
3. ⏳ **You train, track RPE per exercise**.
4. ⚖️ **Next week, the plan adapts**:

   * RPE too high? Load drops.
   * RPE optimal? Slight increase.
   * RPE too low? Minimal progression.
5. 🍽️ **Meals are personalized**, protein-targeted (1.8–2.2g/kg BW), and adjustable.
6. 🔊 **Want to change an exercise or food?** Just tell the AI via chatbot.

---

## ✨ Key Features

### 🏋️ AI Workout Generator

* Focused on Squat, Bench, Deadlift (must appear weekly)
* Includes accessory lifts
* Enforces no duplicate exercises per day
* Conservative weekly progression strategy
* Uses real RPE input to tune intensity

### 🍽️ AI Nutrition Coach

* Balanced meals with clear protein & gram data
* Minimum 3 main meals per day
* Option to include snacks
* Supports diet change requests ("replace tuna" etc.)

### 🔊 Chat-Based Modification

* Integrated chatbot allows input like:

  * "Swap overhead press"
  * "No more lentils"
* Adjusts next plan accordingly

### ⚡ Fully Responsive App

* Styled with **Tailwind CSS** and a custom **cyberpunk theme**
* Voice assistant onboarding for hands-free setup

---

## 🚀 Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Frontend         | **Next.js 14 (App Router)**                  |
| Styling          | **Tailwind CSS**, custom theme               |
| Authentication   | **Clerk**                                    |
| Backend & DB     | **Convex** (query & mutation logic + schema) |
| AI Platform      | **Gemini (Google)**                          |
| Voice Assistant  | **Vapi**                                     |
| State Management | React + localStorage                         |

---

## 📖 Developer Notes

* All Convex data is schema-validated
* Strict format enforced for AI responses (no markdown, no extra fields)
* Plan switching, deletion, and regeneration supported
* Fully integrated chatbot widget with animated UI

---

## 📕 Installation & Usage

```bash
git clone https://github.com/LorenBenDavid/PowerCoachAI.git
cd PowerCoachAI
npm install
npm run dev
```

---

📄 License

This project is open source and available under the MIT License.

---

## ✨ Vision

PowerCoach AI is designed to be your **real AI coach** — consistent, adaptive, and built to help you **get stronger every week**. It's the smartest way to powerlift, powered by your input.

---
📸 Screenshots


![Uploading תמונה 6.5.2025 ב-0.37.jpg…]()

![תמונה 6 5 2025 ב-0 38](https://github.com/user-attachments/assets/890f39c4-c593-4cdb-b79e-e85cde7b0830)

![תמונה 6 5 2025 ב-0 38 2](https://github.com/user-attachments/assets/f97cc44d-f796-4c7b-b1d4-8a2071b5654d)

Made with grit and creativity by **Loren Ben David** ❤️
