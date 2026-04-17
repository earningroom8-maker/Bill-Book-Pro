// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDzJoKZ2UbAzCjYl-XxACoL6vwCxRYKIiI",
  authDomain: "bill-book-pro-31b81.firebaseapp.com",
  databaseURL: "https://bill-book-pro-31b81-default-rtdb.firebaseio.com",
  projectId: "bill-book-pro-31b81",
  storageBucket: "bill-book-pro-31b81.firebasestorage.app",
  messagingSenderId: "1073291650519",
  appId: "1:1073291650519:web:d7f79afdee47aa2d5cd792",
  measurementId: "G-6V298H20CL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
