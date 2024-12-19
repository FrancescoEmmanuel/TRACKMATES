import client  from "../config/mqtt"; // Adjust the import path as needed
import { ref, update } from "firebase/database";
import { db } from "../config/firebaseConfig";

export const handleBuzzerToggle = (deviceId, isOn, setMarkers) => {
  const message = isOn ? "ON" : "OFF";
  client.publish(`buddyband/${deviceId}/buzzer`, message, (error) => {
    if (error) {
      console.error("Error publishing MQTT message:", error);
    } else {
      console.log(`Published: ${message} to buddyband/${deviceId}/buzzer`);
      if (setMarkers) {
        setMarkers((prevMarkers) =>
          prevMarkers.map((m) =>
            m.id === deviceId
              ? { ...m, student: { ...m.student, BuzzerON: isOn } }
              : m
          )
        );
      }
    }
  });
};



export const handleTurnOffSOS = (deviceId, studentId, setMarkers) => {
  client.publish(`buddyband/${deviceId}/led`, "OFF", (error) => {
    if (error) {
      console.error("Error publishing MQTT message:", error);
    } else {
      console.log(`Published: OFF to tracker/${deviceId}/led`);
      if (setMarkers) {
        setMarkers((prevMarkers) =>
          prevMarkers.map((m) =>
            m.id === deviceId
              ? { ...m, student: { ...m.student, SosON: false } }
              : m
          )
        );
      }
      const studentRef = ref(db, `students/${studentId}`);
      update(studentRef, { SosON: false })
        .then(() => console.log("RTDB updated successfully"))
        .catch((error) => console.error("Error updating RTDB:", error));
    }
  });
};
