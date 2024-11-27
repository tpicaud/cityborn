import React from "react";
import dynamic from "next/dynamic";

// Chargement dynamique pour éviter les problèmes SSR (Server-Side Rendering)
const DynamicGoogleMap = dynamic(() => import("@/components/guess/maps/GoogleMap"), {
  ssr: false, // Désactive le rendu côté serveur pour ce composant
});

const MapPage: React.FC = () => {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!; // Remplace par ta clé API
  const center = { lat: 48.8566, lng: 2.3522 }; // Exemple : coordonnées de Paris

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <DynamicGoogleMap apiKey={googleMapsApiKey} center={center} zoom={12} />
    </div>
  );
};

export default MapPage;
