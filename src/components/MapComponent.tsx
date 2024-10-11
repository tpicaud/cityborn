'use client';

import React, { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import StarEntity from '@/entities/StarEntity';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const France: LatLngExpression = [46.603354, 1.888334];

function MapComponent({ star }: { star: StarEntity }) {

    const [marker, setMarker] = useState<LatLngExpression>();
    const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
    const [showBirthplace, setShowBirthplace] = useState(false);

    const MarkerHandler = () => {
        useMapEvents({
            click(e) {
                setMarker([e.latlng.lat, e.latlng.lng]);
            },
        });
        return null;
    };

    const handleGuess = () => {
        if (marker) {
            const [lat, lng] = marker as [number, number];
            setGuess({ lat, lng });
            setShowBirthplace(true);

            const guessedLatLng = L.latLng(lat, lng);
            const starLatLng = L.latLng(star.birthPlace.lat, star.birthPlace.lng);
            const distance = guessedLatLng.distanceTo(starLatLng) / 1000; // Distance en km

            alert(`Vous avez deviné à ${distance.toFixed(2)} km de la bonne réponse.`);
        } else {
            alert("Veuillez d'abord cliquer sur la carte pour placer un marqueur.");
        }
    };

    return (
        <div className="w-full h-screen">
            <div className="flex items-center justify-center h-[5%]">
                <h2 className="bg-black text-white text-center w-full flex items-center justify-center">
                    Devinez le lieu de naissance de {star.name}
                </h2>
            </div>

            <MapContainer center={France} zoom={6} className="h-[85%] w-full">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MarkerHandler />
                {marker && (
                    <Marker position={marker} />
                )}
                {showBirthplace && (
                    <Marker position={[star.birthPlace.lat, star.birthPlace.lng]}>
                        <Popup>
                            Ici
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            <button
                onClick={handleGuess}
                className="bg-blue-500 text-white rounded-md h-[10%] w-full"
            >
                Guess
            </button>
        </div>
    );

};

export default MapComponent;