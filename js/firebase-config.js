// This file should contain your Firebase configuration.
// In a real application, you'd use environment variables for sensitive keys.
// For this simple example, we'll put it here.

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyyq__j_c73UZGuaef6XE904Oy4P_RYSo",
  authDomain: "matchup-designers-app.firebaseapp.com",
  projectId: "matchup-designers-app",
  storageBucket: "matchup-designers-app.firebasestorage.app",
  messagingSenderId: "1002897368802",
  appId: "1:1002897368802:web:0ba0d3b0ba39ed3730a0bb"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();