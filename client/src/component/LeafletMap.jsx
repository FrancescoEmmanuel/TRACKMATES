import React, { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useGeolocation from "../config/userLocation";
import { useDeviceLocations } from '../config/deviceLocation';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from '../config/firebaseConfig';
import client from "../config/mqtt";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

const defaultCenter = [-6.2097, 106.81146];

const ToggleButton = ({ id, checked, onChange, label }) => (
  <div className="flex items-center space-x-2">
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
    <label htmlFor={id} className="text-sm font-medium text-gray-900">
      {label}
    </label>
  </div>
);

ToggleButton.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

function CenterToUserButton({ userLocation }) {
  const map = useMap();

  const handleClick = useCallback(() => {
    if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 13);
    }
  }, [map, userLocation]);

  return (
    <button
      onClick={handleClick}
      className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded-md shadow-md"
    >
      Center to User
    </button>
  );
}

const LeafletMap = ({ students }) => {
  const { userLocation, error } = useGeolocation();
  const { deviceLocations, deviceStudentMap } = useDeviceLocations();
  const [mapCenter, setMapCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const mapRef = useRef(null);
  const [initialLocations, setInitialLocations] = useState({});
  const [markers, setMarkers] = useState([]);
  const [maxDistance, setMaxDistance] = useState(null);
  const [tempMaxDistance, setTempMaxDistance] = useState('');
  const [prevTooFarStatus, setPrevTooFarStatus] = useState({}); // Added state variable

  useEffect(() => {
    const locationsRef = ref(db, 'students');
    onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const locations = {};
        Object.entries(data).forEach(([studentId, studentData]) => {
          if (studentData.location) {
            locations[studentId] = studentData.location;
          }
        });
        setInitialLocations(locations);
      }
    });

    const maxDistRef = ref(db, 'maxDistance');
    onValue(maxDistRef, (snapshot) => {
      const value = snapshot.val();
      if (value) {
        setMaxDistance(value);
        setTempMaxDistance(value.toString());
      }
    });
  }, []);

  useEffect(() => {
    const newMarkers = Object.entries(deviceStudentMap).map(([deviceId, studentId]) => {
      const student = students.find(s => s.id === studentId);
      if (!student) return null;

      let position;
      if (deviceLocations[deviceId]) {
        position = [deviceLocations[deviceId].latitude, deviceLocations[deviceId].longitude];
      } else if (initialLocations[studentId]) {
        position = [initialLocations[studentId].latitude, initialLocations[studentId].longitude];
      } else {
        return null;
      }

      return {
        id: deviceId,
        position: position,
        student: student
      };
    }).filter(Boolean);
    setMarkers(newMarkers);
  }, [deviceLocations, deviceStudentMap, students, initialLocations]);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation]);

  useEffect(() => {
    // Subscribe to SOS messages for all devices
    Object.keys(deviceStudentMap).forEach((deviceId) => {
      client.subscribe(`tracker/${deviceId}/sos`, (err) => {
        if (err) console.error('Error subscribing to SOS:', err);
      });
    });

    // Handle incoming MQTT messages
    const messageHandler = (topic, message) => {
      const deviceId = topic.split('/')[1];
      if (topic.endsWith('/sos')) {
        const sosStatus = message.toString();
        if (sosStatus === 'ON') {
          // Update Firebase when SOS is ON
          const studentId = deviceStudentMap[deviceId];
          if (studentId) {
            const studentRef = ref(db, `students/${studentId}`);
            update(studentRef, { SosON: true })
              .then(() => console.log('SOS status updated in Firebase'))
              .catch((error) => console.error('Error updating SOS status:', error));
          }
        }
      }
    };

    client.on('message', messageHandler);

    // Cleanup function
    return () => {
      Object.keys(deviceStudentMap).forEach((deviceId) => {
        client.unsubscribe(`tracker/${deviceId}/sos`);
      });
      client.off('message', messageHandler);
    };
  }, [deviceStudentMap]);

  const handleSearch = (e) => {
    e.preventDefault();
    const foundStudent = students.find(student => 
      student.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (foundStudent) {
      const deviceId = Object.keys(deviceStudentMap).find(key => deviceStudentMap[key] === foundStudent.id);
      let newCenter;
      if (deviceId && deviceLocations[deviceId]) {
        newCenter = [deviceLocations[deviceId].latitude, deviceLocations[deviceId].longitude];
      } else if (initialLocations[foundStudent.id]) {
        newCenter = [initialLocations[foundStudent.id].latitude, initialLocations[foundStudent.id].longitude];
      }
      
      if (newCenter) {
        setSelectedStudent(foundStudent);
        setMapCenter(newCenter);
        if (mapRef.current) {
          mapRef.current.setView(newCenter, 15);
        }
      }
    }
  };

  const handleBuzzerToggle = (deviceId, isOn) => {
    const message = isOn ? 'ON' : 'OFF';
    client.publish(`buddyband/${deviceId}/buzzer`, message, (error) => {
      if (error) {
        console.error('Error publishing MQTT message:', error);
      } else {
        console.log(`Published: ${message} to buddyband/${deviceId}/buzzer`);
        // Update the local state to reflect the change
        setMarkers(prevMarkers => 
          prevMarkers.map(m => 
            m.id === deviceId 
              ? { ...m, student: { ...m.student, BuzzerON: isOn } } 
              : m
          )
        );
      }
    });
  };

  const handleTurnOffSOS = (deviceId, studentId) => {
    client.publish(`buddyband/${deviceId}/led`, "OFF", (error) => {
      if (error) {
        console.error('Error publishing MQTT message:', error);
      } else {
        console.log(`Published: OFF to tracker/${deviceId}/sos`);
        // Update the local state to reflect the change
        setMarkers(prevMarkers => 
          prevMarkers.map(m => 
            m.id === deviceId 
              ? { ...m, student: { ...m.student, SosON: false } } 
              : m
          )
        );
        // Update the RTDB
        const studentRef = ref(db, `students/${studentId}`);
        update(studentRef, { SosON: false })
          .then(() => console.log('RTDB updated successfully'))
          .catch((error) => console.error('Error updating RTDB:', error));
      }
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const handleMaxDistanceSubmit = (e) => {
    e.preventDefault();
    const newMaxDistance = Number(tempMaxDistance);
    if (!isNaN(newMaxDistance) && newMaxDistance > 0) {
      setMaxDistance(newMaxDistance);
      setTempMaxDistance(newMaxDistance.toString());
      const maxDistRef = ref(db, 'maxDistance');
      set(maxDistRef, newMaxDistance)
        .then(() => {
          console.log('Max distance updated in RTDB');
          setPrevTooFarStatus({}); // Reset prevTooFarStatus to force recalculation
        })
        .catch((error) => console.error('Error updating max distance:', error));
    } else {
      console.error('Invalid max distance value');
      setTempMaxDistance(maxDistance.toString());
    }
  };

  useEffect(() => {
    if (userLocation && maxDistance !== null) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
  
      Object.entries(deviceLocations).forEach(([deviceId, location]) => {
        const studentId = deviceStudentMap[deviceId];
        if (studentId) {
          const distance = calculateDistance(
            userLocation.latitude, userLocation.longitude,
            location.latitude, location.longitude
          );
          const tooFar = distance > maxDistance;
          const studentRef = ref(db, `students/${studentId}`);
  
          // Only update and send MQTT message if the status has changed
          if (tooFar !== prevTooFarStatus[deviceId]) {
            // Update Firebase when status changes
            update(studentRef, { tooFar })
              .then(() => {
                // Update local state to reflect the change
                setMarkers(prevMarkers =>
                  prevMarkers.map(m =>
                    m.id === deviceId
                      ? { ...m, student: { ...m.student, tooFar } }
                      : m
                  )
                );
                console.log(`Updated tooFar status for student ${studentId}: ${tooFar}`);
              
                // Update the previous status
                setPrevTooFarStatus(prev => ({ ...prev, [deviceId]: tooFar }));
  
                // Publish "tooFar" message if the status has changed
                // client.publish(`buddyband/${deviceId}/tooFar`, tooFar ? "true" : "false", (error) => {
                //   if (error) {
                //     console.error('Error publishing tooFar message:', error);
                //   } else {
                //     console.log(`Published tooFar status for device ${deviceId}: ${tooFar}`);
                //   }
                // });
              })
              .catch((error) => console.error('Error updating tooFar status:', error));
          }
        }
      });
    }
  }, [userLocation, deviceLocations, deviceStudentMap, maxDistance, prevTooFarStatus, calculateDistance]);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex-grow mr-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a student..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="hidden">Search</button>
        </form>
        <form onSubmit={handleMaxDistanceSubmit} className="flex items-center space-x-2">
          <label htmlFor="maxDistance" className="text-sm font-medium text-gray-700">
            Max Distance (m):
          </label>
          <input
            type="number"
            id="maxDistance"
            value={tempMaxDistance}
            onChange={(e) => setTempMaxDistance(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Set
          </button>
        </form>
      </div>
      <div className="h-[300px] sm:h-[400px] w-full relative">
        {mapCenter && (
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {markers.map((marker) => (
              <Marker key={marker.id} position={marker.position}>
                <Popup>
                  <div className="relative">
                    <h3 className="font-bold">{marker.student.Name}</h3>
                    <p>Class: {marker.student.Class}</p>
                    <p>Sos status: {marker.student.SosON ? 'Active' : 'Inactive'}</p>
                    <p>Too Far: {marker.student.tooFar ? 'Yes' : 'No'}</p>
                    <h4 className='font-bold'>Emergency Contact</h4>
                    <p>{marker.student.EmergencyContact.Name} {marker.student.EmergencyContact.Number}</p>
              
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        {marker.student.SosON && (
                          <button
                            onClick={() => handleTurnOffSOS(marker.id, marker.student.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          >
                            Turn off SOS
                          </button>
                        )}
                      </div>
                      <div className="ml-4">
                        <ToggleButton
                          id={`buzzer-${marker.id}`}
                          checked={marker.student.BuzzerON}
                          onChange={(checked) => handleBuzzerToggle(marker.id, checked)}
                          label="Play Sound"
                        />
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
            {userLocation && (
              <Marker position={[userLocation.latitude, userLocation.longitude]}>
                <Popup>Your Location</Popup>
              </Marker>
            )}
            <CenterToUserButton userLocation={userLocation} />
          </MapContainer>
        )}
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

LeafletMap.propTypes = {
  students: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    Name: PropTypes.string.isRequired,
    Class: PropTypes.string.isRequired,
    SosON: PropTypes.bool.isRequired,
    BuzzerON: PropTypes.bool.isRequired,
    tooFar: PropTypes.bool,
    EmergencyContact: PropTypes.shape({
      Name: PropTypes.string.isRequired,
      Number: PropTypes.string.isRequired,
    }).isRequired,
  })).isRequired,
};

export default LeafletMap;

