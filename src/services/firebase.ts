// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCuqDzr5tlvrjju9AnoI627YxU6yme-NDc",
    authDomain: "propostas-pdf-web.firebaseapp.com",
    projectId: "propostas-pdf-web",
    storageBucket: "propostas-pdf-web.appspot.com",
    messagingSenderId: "994033472645",
    appId: "1:994033472645:web:a0480905d0f5a75f2545ec"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);