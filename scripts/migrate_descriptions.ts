import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env
dotenv.config({ path: resolve(__dirname, "../.env") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Starting migration...");
  console.log("Project ID:", firebaseConfig.projectId);
  
  const usersCollection = collection(db, "users");
  const userSnapshot = await getDocs(usersCollection);

  const sampleDescriptions = [
    "I'm a passionate developer looking to share my knowledge of React and learn more about UX design.",
    "Baking is my hobby, and I can teach you how to make the perfect sourdough. I'm looking for help with beginner Spanish.",
    "I can offer help with mathematics and physics. I'm very interested in learning how to play the guitar.",
    "Digital marketing expert here! Happy to swap marketing tips for some basic Python coding lessons.",
    "I'm a graphic designer who loves typography. I want to learn more about project management tools."
  ];

  let count = 0;
  for (const userDoc of userSnapshot.docs) {
    const data = userDoc.data();
    if (!data.profileDescription) {
      const randomDesc = sampleDescriptions[Math.floor(Math.random() * sampleDescriptions.length)];
      await updateDoc(doc(db, "users", userDoc.id), {
        profileDescription: randomDesc
      });
      console.log(`Updated user ${userDoc.id} (${data.username || "unknown"}) with sample description.`);
      count++;
    } else {
      console.log(`User ${userDoc.id} already has a profile description. Skipping.`);
    }
  }

  console.log(`Migration complete. Updated ${count} users.`);
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
}).then(() => {
    process.exit(0);
});
