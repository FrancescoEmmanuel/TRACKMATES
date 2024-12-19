import React from "react";
import PropTypes from 'prop-types';
import LeafletMap from "./LeafletMap";

export default function StudentsTab({ students, handleBuzzerToggle }) {
  const studentsOutOfRangeOrSOS = students.filter(student => student.SosON || student.tooFar);

  return (
    <div className="space-y-6">
      {/* Leaflet Map */}
      <div className="w-full h-[400px]">
        <LeafletMap students={students} />
      </div>

      {/* Out-of-Range/SOS Students Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Students Out of Range / SOS</h2>
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
                    Too Far
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsOutOfRangeOrSOS.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{student.Name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.Class}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.SosON ? "Active" : "No"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.tooFar ? "Yes" : "No"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleBuzzerToggle(student.id, student.BuzzerON)}
                        className="text-blue-600 hover:underline"
                      >
                        Toggle Buzzer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

StudentsTab.propTypes = {
  students: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    Name: PropTypes.string.isRequired,
    Class: PropTypes.string.isRequired,
    SosON: PropTypes.bool.isRequired,
    BuzzerON: PropTypes.bool.isRequired,
    tooFar: PropTypes.bool,
  })).isRequired,
  handleBuzzerToggle: PropTypes.func.isRequired,
};

