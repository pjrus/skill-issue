# SkillSwap Code Architecture

This document explains the app’s hierarchical structure and how Firebase is integrated across auth, data, and UI flows.

## 1) Top-Level Project Hierarchy

```text
skillswap-unihack-2026/
├── src/
│   ├── app/                    # Next.js App Router pages + route handlers
│   │   ├── (app)/              # Authenticated application routes
│   │   ├── (marketing)/        # Public marketing shell routes
│   │   ├── api/                # Server route handlers
│   │   ├── login/              # Auth page
│   │   ├── globals.css
│   │   └── layout.tsx          # Root providers (Firebase + Theme)
│   ├── ai/                     # Genkit setup + AI flows
│   ├── components/             # Reusable UI + utility components
│   ├── firebase/               # Firebase config, providers, hooks, error handling
│   │   ├── auth/
│   │   └── firestore/
│   ├── hooks/                  # App-level UI hooks
│   ├── lib/                    # Utilities + mock/placeholder data
│   ├── services/               # Business logic using Firebase/AI
│   └── types/                  # Shared TypeScript types
├── docs/                       # Product/backend/schema/architecture docs
├── firestore.rules             # Firestore authorization rules
├── firebase.json               # Firebase project configuration
└── apphosting.yaml             # Firebase App Hosting config
```

## 2) Runtime Hierarchy (How App Layers Interact)

```text
UI Pages (src/app/*)
  -> call domain services (src/services/*)
      -> use Firebase client SDK (src/firebase/config.ts)
          -> Firestore/Auth/Storage

UI components/hooks that need live Firebase state
  -> use context/hooks from src/firebase/provider.tsx
      -> initialized once via src/firebase/index.ts
```

## 3) Firebase Integration in This App

### 3.1 Initialization and singleton services

- File: `src/firebase/config.ts`
- Uses Firebase Web SDK to initialize exactly one app instance:
  - `initializeApp(firebaseConfig)` when no app exists
  - `getApp()` when already initialized
- Exposes service singletons:
  - `db` (Firestore)
  - `auth` (Firebase Auth)
  - `storage` (Firebase Storage)

Environment variables consumed:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3.2 Provider wiring into Next.js

- Root layout (`src/app/layout.tsx`) wraps the app with `FirebaseClientProvider`.
- `FirebaseClientProvider` (`src/firebase/client-provider.tsx`) forces client-side provider rendering to avoid server/context issues.
- `FirebaseProvider` (`src/firebase/provider.tsx`):
  - Calls `initializeFirebase()` once (memoized)
  - Stores `{ firebaseApp, auth, firestore }` in React context
  - Wraps children with `UserProvider`
  - Mounts `FirebaseErrorListener` for dev-time permission diagnostics

### 3.3 Authentication flow

- Login page (`src/app/login/page.tsx`) uses Firebase Auth SDK methods:
  - `signInWithPopup` + `GoogleAuthProvider`
  - `signInWithEmailAndPassword`
  - `createUserWithEmailAndPassword`
- `UserProvider` (`src/firebase/auth/use-user.tsx`) subscribes to `onAuthStateChanged`:
  1. Sets loading state
  2. On login, ensures a Firestore profile exists (`authService.getUserById` / `createUserProfile`)
  3. Keeps app-level user context synchronized
  4. Handles route guard redirects (`/login` vs app routes)

### 3.4 Firestore data access patterns

The app uses **two access styles**:

1. **Service-based async CRUD** (`src/services/databaseService.ts`, `src/services/authService.ts`)
   - For explicit actions like profile update or appointment creation
   - Uses `getDoc`, `getDocs`, `setDoc`, `updateDoc`, `addDoc`, `writeBatch`

2. **Realtime hooks** (`src/firebase/firestore/use-doc.tsx`, `src/firebase/firestore/use-collection.tsx`)
   - For live UI subscriptions via `onSnapshot`
   - Returns `{ data, isLoading }` for component rendering

Collections currently documented in code/docs:

- `users`
- `appointments`

### 3.5 Error handling around Firebase rules

- When Firestore operations fail due to permission issues, services/hooks emit a custom `FirestorePermissionError` through `errorEmitter`.
- In development, `FirebaseErrorListener` throws a detailed error with operation/path/payload context to make security-rule debugging easier.

### 3.6 Security model alignment

- Firestore security intent is defined in `firestore.rules` and described in `docs/schema.md`.
- Service and hook layers are written with ownership/privacy assumptions:
  - User profile ownership
  - Appointment visibility restricted to participants

## 4) Backend/API and Firebase Relationship

- Route handlers in `src/app/api/*` are used mainly for AI-related server-side operations.
- Core app data (users, appointments) is read/written directly from the client through Firebase SDK + Firestore rules.
- This architecture keeps the app simple:
  - Firebase handles auth + authorization + data
  - Next.js API routes handle AI orchestration and provider-specific logic

## 5) Developer Notes

- If Firebase config values are missing, initialization/auth/data features fail at runtime.
- Keep `firestore.rules` synchronized with schema/service behavior to avoid permission regressions.
- Prefer using existing service/hook layers rather than scattered direct Firestore calls in UI pages.
