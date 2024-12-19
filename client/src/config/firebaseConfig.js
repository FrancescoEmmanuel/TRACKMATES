import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAIWlc88jtLpvAPET457tb_JtCJiHhtF-E",
  authDomain: "buddyband-df930.firebaseapp.com",
  databaseURL: "https://buddyband-df930-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "buddyband-df930",
  storageBucket: "buddyband-df930.firebasestorage.app",
  messagingSenderId: "571670956370",
  appId: "1:571670956370:web:e2e9a7624b5279dc48528b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);


