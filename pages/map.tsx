import type { NextPage } from 'next';
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Map from '../components/Map';

const MapView: NextPage = () => {
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const MapComponent = Map as any;

  useEffect(() => {
    setMounted(true);

    // Get user's current location using Geolocation API
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error getting user location:', error);

        // Use IP geolocation API as a fallback
        fetch('https://ipapi.co/json/')
          .then((response) => response.json())
          .then((data) => {
            setUserLocation({ lat: data.latitude, lng: data.longitude });
          })
          .catch((error) => {
            console.error('Error getting IP location:', error);
            setUserLocation(null); // Set userLocation to null if both methods fail
          });
      }
    );

    return () => {
      setMounted(false);
    };
  }, []);

  return (
    <Layout title="Map View">
      {mounted && <MapComponent center={userLocation} />}
    </Layout>
  );
};

export default MapView;