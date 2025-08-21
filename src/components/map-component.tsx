import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    mapboxgl: any;
    MapboxDirections: any;
  }
}

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);

  useEffect(() => {
    // Only initialize map once
    if (map.current) return;

    // Set Mapbox access token
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = "pk.eyJ1Ijoic3ViaGFtcHJlZXQiLCJhIjoiY2toY2IwejF1MDdodzJxbWRuZHAweDV6aiJ9.Ys8MP5kVTk5P9V2TDvnuDg";

      // Get user's current location
      navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
        enableHighAccuracy: true
      });
    }

    function successLocation(position: GeolocationPosition) {
      setupMap([position.coords.longitude, position.coords.latitude]);
    }

    function errorLocation() {
      // Default to Manchester, UK coordinates if location access fails
      setupMap([23.42, 53.84]);
    }

    function setupMap(center: [number, number]) {
      if (!mapContainer.current || !window.mapboxgl) return;

      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: 15
      });

      // Add navigation controls
      const nav = new window.mapboxgl.NavigationControl();
      map.current.addControl(nav);

      // Add directions control if available
      if (window.MapboxDirections) {
        const directions = new window.MapboxDirections({
          accessToken: window.mapboxgl.accessToken
        });
        map.current.addControl(directions, "top-left");
      }
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div 
        ref={mapContainer} 
        className="flex-1 w-full rounded-lg"
      />
    </div>
  );
};

export default MapComponent;
