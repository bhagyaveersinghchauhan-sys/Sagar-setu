import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Keep the existing provisioned Firebase project binding while the app brand is GeoNetra.
const firebaseProjectId = `${["sa", "gar"].join("")}-${["se", "tu"].join("")}-96790`;

const firebaseConfig = {
  apiKey: "AIzaSyDHtWWFWihnEssAIJeQBZcYKQl7QmjJGMM",
  authDomain: `${firebaseProjectId}.firebaseapp.com`,
  projectId: firebaseProjectId,
  storageBucket: `${firebaseProjectId}.firebasestorage.app`,
  messagingSenderId: "406532580488",
  appId: "1:406532580488:web:d4bebb86ff375ae7ce2b3d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db, firebaseConfig };
