import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "./config/firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      console.log("EMAIL:", email)
      console.log("PASS:", password)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const user = userCredential.user;
  
      // console.log("Logged in as:", user.email);
  
      // const teachersRef = ref(db, "teachers");
      // const snapshot = await get(teachersRef);
  
      // if (snapshot.exists()) {
      //   const teachers = snapshot.val();
      //   console.log("Fetched teachers:", teachers);
  
      //   let teacherId = null;
  
      //   Object.keys(teachers).forEach((key) => {
      //     if (teachers[key].email === user.email) {
      //       teacherId = key;
      //     }
      //   });
  
      //   if (teacherId) {
      //     console.log("Matched Teacher ID:", teacherId);
      //     const teacherData = { id: teacherId, ...teachers[teacherId] };
      //     localStorage.setItem("teacherData", JSON.stringify(teacherData));
  
      //     alert(`Welcome, ${teacherData.name}!`);
      //     navigate("/dashboard");
      //   } else {
      //     throw new Error("Access denied. Teacher not found.");
      //   }
      // } else {
      //   throw new Error("No teacher records found.");
      // }
    } catch (error) {
      console.error("Auth error:", error.code, error.message);
      setError(error.message);
      
    }
  };  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 w-full border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 w-full border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
