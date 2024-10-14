'use client';

import React, { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import StarEntity from '@/entities/StarEntity';
import { Alert, Box, Button } from '@mui/material';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const France: LatLngExpression = [46.603354, 1.888334];

interface MapComponentProps {
    star: StarEntity;
    hasGuessed: boolean,
    setHasGuessed: React.Dispatch<React.SetStateAction<boolean>>; // Type pour setHasGuessed
    setGuess: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>; // Type pour setGuess
}

const MapComponent: React.FC<MapComponentProps> = ({ star, hasGuessed, setHasGuessed, setGuess }) => {

    const [marker, setMarker] = useState<LatLngExpression | undefined>(undefined);
    const [distance, setDistance] = useState(0);

    const MarkerHandler = () => {
        if (!hasGuessed) {
            useMapEvents({
                click(e) {
                    setMarker([e.latlng.lat, e.latlng.lng]);
                },
            });
        }
        return null;
    };

    const handleGuess = () => {
        if (marker) {
            const [lat, lng] = marker as [number, number];
            setGuess({ lat, lng });
            setHasGuessed(true);
            setDistance(getDistanceTo(lat, lng));
        }
    };

    const getDistanceTo = (guessLat: number, guessLng: number) => {
        const guessedLatLng = L.latLng(guessLat, guessLng);
        const starLatLng = L.latLng(star.birthPlace.coordinates.lat, star.birthPlace.coordinates.lng);
        const distance = guessedLatLng.distanceTo(starLatLng) / 1000; // Distance en km
        return distance;
    }

    return (
        <div className="relative w-full h-screen">
            <MapContainer center={France} zoom={6} className="h-[100%] w-full bg-transparent z-0">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MarkerHandler />
                {marker && (
                    <Marker position={marker} />
                )}
                {hasGuessed && (
                    <Marker position={[star.birthPlace.coordinates.lat, star.birthPlace.coordinates.lng]} />
                )}
            </MapContainer>

            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 max-w-96 w-[90%]">
                {hasGuessed && (
                    <Box
                        className="mb-4 p-2 text-center bg-blue-200 text-blue-600 rounded shadow-sm"
                    >
                        {star.name} est né à <b>{star.birthPlace.city}</b>
                        <br />
                        Vous êtes à <b>{distance.toFixed(2)} km</b>
                    </Box>
                )}

                <Button
                    variant="contained"
                    onClick={handleGuess}
                    disabled={!marker || hasGuessed}
                    className='text-white font-bold py-2 px-4 rounded w-[50%] mx-auto block'
                >
                    Guess
                </Button>
            </div>
        </div>
    );


};

export default MapComponent;