import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../config/firebaseConfig';
import client from '../config/mqtt';

export function useDeviceLocations() {
  const [deviceLocations, setDeviceLocations] = useState({});
  const [deviceStudentMap, setDeviceStudentMap] = useState({});

  useEffect(() => {
    const devicesRef = ref(db, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      const devices = snapshot.val();
      if (!devices) return;

      const deviceToStudent = {};
      Object.entries(devices).forEach(([deviceId, device]) => {
        if (device.type === 'studentDevice' && device.user) {
          deviceToStudent[deviceId] = device.user;
        }
      });
      setDeviceStudentMap(deviceToStudent);

      Object.keys(deviceToStudent).forEach((deviceId) => {
        client.subscribe(`buddyband/${deviceId}/gps`, (err) => {
          if (err) console.error('Error subscribing to GPS:', err);
        });
      });
    });

    const messageHandler = (topic, message) => {
      const deviceId = topic.split('/')[1];
      if (topic.endsWith('/gps')) {
        try {
          const gpsDataString = message.toString();
          const [latitude, longitude] = gpsDataString.split(',');
      
          // Update device locations state
          setDeviceLocations(prev => ({
            ...prev,
            [deviceId]: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            }
          }));

          // Update RTDB
          const studentId = deviceStudentMap[deviceId];
          if (studentId) {
            const locationRef = ref(db, `students/${studentId}/location`);
            update(locationRef, {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            });
          }
        } catch (error) {
          console.error('Error parsing GPS data:', error);
        }
      }
    };

    client.on('message', messageHandler);

    return () => {
      unsubscribe();
      Object.keys(deviceStudentMap).forEach((deviceId) => {
        client.unsubscribe(`buddyband/${deviceId}/gps`);
      });
      client.off('message', messageHandler);
    };
  }, []);

  return { deviceLocations, deviceStudentMap };
}

