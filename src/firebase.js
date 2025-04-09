// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBKpN5MkiuSpL2eVdG9_zVtapFPWX-weUk",  
    authDomain: "boardgame-events.firebaseapp.com",  
    projectId: "boardgame-events",  
    storageBucket: "boardgame-events.firebasestorage.app",  
    messagingSenderId: "283842044097",
    appId: "1:283842044097:web:cf75722fca126863d3f440" 
  };
    
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
