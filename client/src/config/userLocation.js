import { useState, useEffect } from 'react';

function useGeolocation() {
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setError(null);  // Clear any previous errors
        },
        (error) => {
          setError('Error getting user location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  useEffect(() => {
    // Get the user location immediately when the component mounts
    getUserLocation();

    // Set up an interval to update the location every 30 seconds
    const intervalId = setInterval(() => {
      getUserLocation();
    }, 30000); // 30 seconds

    // Clean up the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return { userLocation, error };
}

export default useGeolocation;

