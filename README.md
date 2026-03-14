# SkillSwap - UniHack 2026 Submission

SkillSwap is a peer-to-peer skill exchange platform designed for university students. It connects students who want to learn new skills with those willing to teach, fostering a collaborative learning community.

## 🚀 Features

- **User Authentication**: Secure login/signup using Firebase Authentication.
- **Profile Management**: Users can create profiles, upload profile pictures, and list skills they can teach and skills they want to learn.
- **Skill Matching**: Browse and search for skills you want to learn and connect with potential mentors.
- **Real-time Chat**: Built-in chat functionality to communicate with other users and arrange skill-sharing sessions.
- **Responsive Design**: Built with Tailwind CSS for a seamless experience across desktop and mobile devices.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- A Firebase Project (created in the Firebase Console)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd skillswap-unihack-2026
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
   - Add a Web app to your Firebase project.
   - Copy the Firebase configuration object from your Firebase Console.
   - Create a `.env.local` file in the root directory (or update `src/lib/firebase.ts` directly if not using env vars, though env vars are recommended for API keys):

     ```bash
     # Example .env.local content
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

### Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 📂 Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Authentication pages (login, signup)
│   ├── (dashboard)/  # Authenticated user pages
│   │   ├── page.tsx  # Dashboard
│   │   ├── skills/   # Skill browsing and details
│   │   ├── chat/     # Real-time chat
│   │   └── profile/  # User profile
│   ├── api/          # API routes
│   └── layout.tsx    # Root layout
├── components/       # Reusable React components
├── lib/              # Utility functions and Firebase config
└── styles/           # Global styles
```

## 🤝 Contributing

Contributions are welcome! This was built during UniHack 2026. Feel free to fork the repository, create a feature branch, and submit a pull request.
