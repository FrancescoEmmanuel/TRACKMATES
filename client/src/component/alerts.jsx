import React from "react";

export default function AlertsTab({ alerts }) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">Alerts</h2>
      </div>
      <ul className="divide-y divide-gray-200">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
          >
            <div>
              <p>Type: {alert.type}</p>
              <p>Student ID: {alert.studentID}</p>
              <p>Time: {alert.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

