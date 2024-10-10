'use client';

import React, { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import { icon, LatLngExpression } from 'leaflet';

// Importation de Leaflet pour corriger les icônes par défaut
import L from 'leaflet';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

const France: LatLngExpression = [46.603354, 1.888334];

const MapComponent: React.FC = () => {

    const [marker, setMarker] = useState<LatLngExpression>();

    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                setMarker([e.latlng.lat, e.latlng.lng]);
            },
        });
        return null;
    };

    return (
        <MapContainer center={France} zoom={6} className='w-full h-full'>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />
            {marker && (
                <Marker position={marker}>
                    <Popup>
                        A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup>
                </Marker>
            )}

        </MapContainer>
    );
};

export default MapComponent;