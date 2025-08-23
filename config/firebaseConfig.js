/*
This file is for accessing the Database of the Application, 
here includes the attributes of your Firebase Database to be accessed by the Application.
*/

// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

//Input here the Firebase details (check the database you created on firebase):
const firebaseConfig = {
  apiKey: "AIzaSyAN30gLpYISAwj-V-x9_bmK9MsLaQcQaBg",
  authDomain: "shopnestyapp.firebaseapp.com",
  projectId: "shopnestyapp",
  storageBucket: "shopnestyapp.firebasestorage.app",
  messagingSenderId: "688642102325",
  appId: "1:688642102325:web:6568ff7a0a50fe92998d7c",
};

//Initializer
const app = initializeApp(firebaseConfig);

//This is for authorization
export const auth = getAuth(app);
//this is for the Database
export const db = getFirestore(app);
//for google sign in
export const googleProvider = new GoogleAuthProvider();
