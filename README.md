<div align="center">

<img src="src/skilliton.png" alt="Skilliton" width="120" />

# Skill-Issue

**Have a skill issue? Skilliton's got you covered.**

*A peer-to-peer skill exchange platform for university students, powered by an AI skeleton who knows way too much about what you should be learning.*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-orange?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Genkit](https://img.shields.io/badge/Google%20Genkit-AI-green?logo=google)](https://firebase.google.com/docs/genkit)

</div>

---

## Meet Skilliton

Skilliton is the AI-powered skeleton mascot at the heart of Skill-Issue. Chat with Skilliton to find the perfect skill swap partner, get personalised recommendations, and — most importantly — hear him shout **SKIIIIIIILZZZZZZZZZZ** at the end of every message.

Skilliton runs on Google Gemini via Firebase Genkit, with full support for user-provided API key overrides.

---

## Features

### Home — Have a Skill Issue?
- Enter what you want to **learn** and what you want to **teach** to instantly refresh your AI-generated matches
- Browse **Recommended Users** or flip to **All Users** to see everyone on the platform
- One-click access to **Chat with Skilliton to fix your Skill Issue**

### Skilliton Chat
- Real-time AI chat interface with Skilliton, your personal skeleton tutor
- Skilliton knows your profile, your skills, and everyone else on the platform
- Chat history persists across the conversation
- Every response ends with his iconic catchphrase: **SKIIIIIIILZZZZZZZZZZ**
- Supports custom Gemini API key overrides (stored locally, never in the cloud)

### Bookings
- View all your upcoming skill-swap sessions
- Auto-generates a real Google Meet link per booking (via the Meet REST API)
- **Download to Calendar file (.ics)** — includes the other user's email address and meet link for a complete calendar event
- Legacy placeholder links are automatically upgraded to real Meet spaces

### Confirmation Page
- Booking confirmed view with participant avatars
- "Generating Meeting Space..." state while the Meet link is created
- Download .ics and **Done** button that returns to Bookings

### Skills Page
- Manage your offered and wanted skills
- AI-assisted skill discovery via Skilliton

### Settings
- Update full name, bio, learning style, and availability
- Upload a profile picture (Firebase Storage)
- Choose your preferred Gemini model from a live list of available models
- **Gemini API Key Override** — provide your own key, stored in `localStorage` only

### Authentication
- Email/password sign-up and sign-in
- **Sign in with Google** (one-tap OAuth via Firebase)
- Automatic profile creation for new Google sign-ins (name and avatar synced from Google)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Cloud Firestore |
| File Storage | Firebase Storage |
| AI / LLM | [Google Genkit](https://firebase.google.com/docs/genkit) + Gemini |
| Calendar | RFC 5545 iCal (client-side generation) |
| Video | Google Meet REST API |

---

## Getting Started

### Prerequisites

- Node.js v18+
- A [Firebase project](https://console.firebase.google.com/) with:
  - Firestore enabled
  - Authentication enabled (Email/Password + Google)
  - Storage enabled
- A Google Gemini API key

### 1. Install dependencies

```bash
cd <project-root>
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google AI (Gemini via Genkit)
GOOGLE_GENAI_API_KEY=

# Google Meet API (optional — falls back to placeholder link)
GOOGLE_MEET_API_KEY=
```

### 3. Deploy Firebase security rules (Firestore + Storage)

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:9003](http://localhost:9003) in your browser.

---

## Project Structure

```
project-root/
├── src/
│   ├── ai/
│   │   └── flows/
│   │       └── ai-skills-chat.ts   # Genkit AI flow (Skilliton's brain)
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── page.tsx            # Home — matching + search
│   │   │   ├── ai-chat/            # Skilliton Chat
│   │   │   ├── booking/[matchId]/  # Book a session
│   │   │   ├── bookings/           # My Bookings (.ics downloads)
│   │   │   ├── confirmation/       # Post-booking confirmation
│   │   │   ├── settings/           # Profile + API key settings
│   │   │   └── skills/             # Skills management
│   │   ├── api/
│   │   │   ├── meet/create/        # Google Meet link generation
│   │   │   ├── models/             # Available Gemini models list
│   │   │   └── skills/chat/        # AI chat API route
│   │   └── login/                  # Auth page
│   ├── components/                 # Shared UI components
│   ├── firebase/                   # Firebase config, hooks, provider
│   ├── services/                   # Database + auth service layer
│   └── types/                      # TypeScript types
├── firestore.rules
├── storage.rules
└── README.md
```

---

## Gemini API Key Override

Users can optionally supply their own Gemini API key in **Settings**. The key is stored only in `localStorage` — it is **never** sent to Firestore or any server except as a request header to Gemini. This allows users to bypass shared rate limits or use their own quota.

---

## Built at UniHack 2026

Skill-Issue was built during [UniHack 2026](https://unihack.net/).

---

<div align="center">
  <sub>Powered by Skilliton — <em>SKIIIIIIILZZZZZZZZZZ</em></sub>
</div>
