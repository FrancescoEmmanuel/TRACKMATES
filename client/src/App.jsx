import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./component/dashboard";
// import Login from "./Login";
// import { auth } from "./firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

export default function App() {
  // const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Login />} /> */}
        <Route
          path="/"
          // element={user ? <Dashboard /> : <Navigate to="/" />}
          element={<Dashboard />}
        />
      </Routes>
    </Router>
  );
}
