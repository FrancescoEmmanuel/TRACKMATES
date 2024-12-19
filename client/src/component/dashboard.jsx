import React, { useState, useEffect } from "react";
import { db } from "../config/firebaseConfig";
import { get, ref, onValue, update } from "firebase/database";
import LeafletMap from "./LeafletMap";
import client from "../config/mqtt";
import AlertsTab from "./alerts";
import StudentsTab from "./students";
import StudentDatabaseTab from "./studentTable";

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    client.publish("buddyband/status", "User is online");
    console.log("Published: User is online");

    // Fetching students data from Firebase
    const studentsRef = ref(db, 'students');
    onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filteredStudents = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setStudents(filteredStudents);
      }
    });

    // Fetching alerts data from Firebase
    const alertsRef = ref(db, "alerts");
    onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allAlerts = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
        setAlerts(allAlerts);
      }
    });
  }, []);

  // Toggle buzzer for a student
  const handleBuzzerToggle = (studentId, currentStatus) => {
    const studentRef = ref(db, `students/${studentId}`);
    update(studentRef, { BuzzerON: !currentStatus });
  };

  // Filter students who are out of range or have SOS activated
  const studentsOutOfRangeOrSOS = students.filter(
    (student) => student.SosON || student.outOfRange
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            BuddyBand Dashboard
          </h1>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === "dashboard"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("students")}
                className={`ml-8 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === "students"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Students
              </button>
              {/* <button
                onClick={() => setActiveTab("alerts")}
                className={`ml-8 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  activeTab === "alerts"
                    ? "border-indigo-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Alerts
              </button> */}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === "dashboard" && (
          <StudentsTab
            students={students}
            handleBuzzerToggle={handleBuzzerToggle}
            studentsOutOfRangeOrSOS={studentsOutOfRangeOrSOS}
          />
        )}
        {activeTab === "students" && (
          <StudentDatabaseTab
            students={students}
            handleBuzzerToggle={handleBuzzerToggle}
          />
        )}
        {activeTab === "alerts" && <AlertsTab alerts={alerts} />}
      </main>
    </div>
  );
}
