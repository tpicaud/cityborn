'use client';

import React from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

type GoogleMapProps = {
  apiKey: string;
  center: { lat: number; lng: number };
  zoom: number;
};

const Map: React.FC<GoogleMapProps> = ({ apiKey, center, zoom }) => {
  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100vh" }}
        center={center}
        zoom={zoom}
      >
        {/* Tu peux ajouter des marqueurs ou autres composants ici */}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
