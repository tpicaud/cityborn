'use client';

import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, useMapEvents, Marker, useMap, Polyline } from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import StarEntity from '@/entities/StarEntity';
import { Box, Button, IconButton } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

const blueIcon = new L.Icon(({
    iconUrl: '/img/marker-icon-blue.png', // Utilise une URL pour une icône bleue
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconAnchor: [12, 41],
}));

const redIcon = new L.Icon(({
    iconUrl: '/img/marker-icon-red.png', // Utilise une URL pour une icône rouge
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconAnchor: [12, 41],
}));

const France: LatLngExpression = [46.603354, 1.888334];

interface MapComponentProps {
    star: StarEntity;
    hasGuessed: boolean,
    marker: { lat: number; lng: number } | null;
    distance: number;
    setMarker: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>; // Type for setMarker
    setHasGuessed: React.Dispatch<React.SetStateAction<boolean>>; // Type for setHasGuessed
    setGuess: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>; // Type for setGuess
    handleNextStar: () => void;
    setDistance: React.Dispatch<React.SetStateAction<number>>; // Type for setDistance
}

const MapComponent: React.FC<MapComponentProps> = ({
    star,
    hasGuessed,
    marker,
    distance,
    setMarker,
    setHasGuessed,
    setGuess,
    handleNextStar,
    setDistance
}) => {

    /////////////////////////////////////////////////////////////////
    // Functions
    /////////////////////////////////////////////////////////////////
    const MarkerHandler = () => {
        if (!hasGuessed) {
            useMapEvents({
                click(e) {
                    const lat = e.latlng.lat
                    const lng = e.latlng.lng
                    setMarker({ lat, lng });
                },
            });
        }
        return null;
    };

    const handleGuess = () => {
        if (marker) {
            const { lat, lng } = marker;
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



    // Custom component to fit bounds when the user has guessed
    const FitBoundsOnGuess: React.FC<{ guessedMarker: LatLngExpression, starMarker: LatLngExpression }> = ({ guessedMarker, starMarker }) => {
        const map = useMap(); // Access the map instance
        useEffect(() => {
            if (guessedMarker && starMarker) {
                const bounds = new LatLngBounds(guessedMarker, starMarker);
                map.fitBounds(bounds); // Adjust the view to show both markers
            }
        }, [guessedMarker, starMarker, map]);

        return null;
    };

    /////////////////////////////////////////////////////////////////
    // Render
    /////////////////////////////////////////////////////////////////
    return (
        <div className="relative w-full h-screen">
            <MapContainer center={France} zoom={3} className="h-[100%] w-full bg-transparent z-0">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MarkerHandler />
                {marker && (
                    <Marker position={marker} icon={blueIcon} />
                )}
                {hasGuessed && marker && (
                    <>
                        <Marker
                            position={[star.birthPlace.coordinates.lat, star.birthPlace.coordinates.lng]}
                            icon={redIcon}
                        />
                        <FitBoundsOnGuess
                            guessedMarker={marker as LatLngExpression}
                            starMarker={[star.birthPlace.coordinates.lat, star.birthPlace.coordinates.lng]}
                        />
                        <Polyline
                            positions={[marker, [star.birthPlace.coordinates.lat, star.birthPlace.coordinates.lng]]}
                            color="blue"
                        />
                    </>
                )}
            </MapContainer>

            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 min-w-20 w-[80%]">
                {hasGuessed && (
                    <Box
                        className="mb-4 p-2 text-center bg-blue-200 text-blue-600 rounded shadow-sm mx-auto"
                    >
                        {star.name} est né à <b>{star.birthPlace.city}</b>
                        <br />
                        Vous êtes à <b>{distance.toFixed(2)} km</b>
                    </Box>
                )}

                <div className="relative w-full flex justify-center">
                    <Button
                        variant="contained"
                        onClick={handleGuess}
                        disabled={!marker || hasGuessed}
                        className='text-white font-bold rounded py-2 px-4 w-[50%] block text-center'
                    >
                        Guess
                    </Button>

                    {hasGuessed && (
                        <Button
                        variant='contained'
                            color='error'
                            onClick={() => handleNextStar()}
                            className='text-white font-bold rounded-3xl py-2 px-4 absolute right-0'
                        >
                            <ArrowForward />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );


};

export default MapComponent;