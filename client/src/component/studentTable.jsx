import React, { useState } from "react";
import client from "../config/mqtt"; // Ensure this is correctly configured
import { ref, update } from "firebase/database"; // Import for RTDB
import { db } from "../config/firebaseConfig"; // Ensure your Firebase config is imported

export default function StudentDatabaseTab({ students }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter((student) =>
    student.Name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  

  const handleBuzzerToggle = (deviceId, isOn) => {
    const message = isOn ? "ON" : "OFF";
    client.publish(`buddyband/${deviceId}/buzzer`, message, (error) => {
      if (error) {
        console.error("Error publishing MQTT message:", error);
      } else {
        console.log(`Published: ${message} to buddyband/${deviceId}/buzzer`);
      }
    });
  };

  const handleSosToggle = (deviceId, studentId, isOn) => {
    const message = isOn ? "ON" : "OFF";
    client.publish(`buddyband/${deviceId}/led`, message, (error) => {
      if (error) {
        console.error("Error publishing MQTT message:", error);
      } else {
        console.log(`Published: ${message} to buddyband/${deviceId}/led`);

        if (!isOn) {
          // If turning SOS off, update RTDB
          const studentRef = ref(db, `students/${studentId}`);
          update(studentRef, { SosON: false })
            .then(() => console.log("RTDB updated successfully"))
            .catch((error) => console.error("Error updating RTDB:", error));
        }
      }
    });
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">Student Database</h2>
        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a student..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SOS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buzzer
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
             
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{student.Name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.Class}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() =>
                        handleSosToggle(student.deviceId, student.id, student.SosON)
                      }
                      className={`text-sm ${
                        student.SosON ? "text-red-600" : "text-gray-400"
                      } hover:underline`}
                    >
                      {student.SosON ? "Turn Off" : "OFF"}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <ToggleButton
                      id={`buzzer-${student.id}`}
                      checked={student.BuzzerON}
                      onChange={() => handleBuzzerToggle(student.deviceId, !student.BuzzerON)}
                      label={student.BuzzerON ? "On" : "Off"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ToggleButton = ({ id, checked, onChange, label }) => (
  <div className="flex items-center space-x-2">
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? "bg-blue-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
    <label htmlFor={id} className="text-sm font-medium text-gray-900">
      {label}
    </label>
  </div>
);
