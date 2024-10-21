'use client';

import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, Polyline, useMapEvent } from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import Coord from '@/types/Coord';

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
    preGuess: Coord | undefined;
    guess: Coord | undefined;
    answer: Coord;
    handlePreGuess: (value: Coord) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
    preGuess,
    guess,
    answer,
    handlePreGuess
}) => {

    /////////////////////////////////////////////////////////////////
    // Functions
    /////////////////////////////////////////////////////////////////
    useMapEvent("click", (event) => {
        handlePreGuess({
            lat: event.latlng.lat,
            lng: event.latlng.lng
        }); // Met à jour la position du marqueur
    });


    // const getDistanceTo = (guessLat: number, guessLng: number) => {
    //     const guessedLatLng = L.latLng(guessLat, guessLng);
    //     const starLatLng = L.latLng(star.birthPlace.coordinates.lat, star.birthPlace.coordinates.lng);
    //     const distance = guessedLatLng.distanceTo(starLatLng) / 1000; // Distance en km
    //     return distance;
    // }



    // Custom component to fit bounds when the user has guessed
    const FitBoundsOnGuess: React.FC<{ positionA: LatLngExpression, positionB: LatLngExpression }> = ({ positionA, positionB }) => {
        const map = useMap(); // Access the map instance
        useEffect(() => {
            if (positionA && positionB) {
                const bounds = new LatLngBounds(positionA, positionB);
                map.fitBounds(bounds); // Adjust the view to show both markers
            }
        }, [positionA, positionB, map]);

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
                />
                <GuessMarker position={preGuess} />
                {guess && (
                    <>
                        <AnswerMarker position={answer} />
                        <GuessLine positionA={guess} positionB={answer} />
                        <FitBoundsOnGuess positionA={guess} positionB={answer} />
                    </>
                )}
            </MapContainer>
        </div>
    );
};

function GuessMarker({position}: {position: Coord | undefined}) {
    return position && (
        <Marker position={toLatLngExpression(position)} icon={blueIcon} />
    )
}

function AnswerMarker({position}: {position: Coord}) {
    return (
        <Marker position={toLatLngExpression(position)} icon={redIcon} />
    )
}

function GuessLine({positionA, positionB}: {positionA: Coord, positionB: Coord}) {
    return (
        <Polyline positions={[toLatLngExpression(positionA), toLatLngExpression(positionB)]} />
    )
}

function toLatLngExpression(coord: Coord): LatLngExpression {
    return [coord.lat, coord.lng];
}

export default MapComponent;