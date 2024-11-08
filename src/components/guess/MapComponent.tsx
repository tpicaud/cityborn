'use client';

import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, Polyline, useMapEvent } from 'react-leaflet';
import { LatLngBounds, LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-shadow.png';
import Coord from '@/types/Coord';
import Guess from '@/types/Guess';

const blueIcon = new L.Icon({
    iconUrl: '/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
    iconUrl: '/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconAnchor: [12, 41],
});

const France: LatLngExpression = [46.603354, 1.888334];

interface MapComponentProps {
    preGuess: Guess | undefined;
    guess: Guess | undefined;
    answer: Coord;
    handlePreGuess: (value: Guess) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
    preGuess,
    guess,
    answer,
    handlePreGuess
}) => {

    // Calculates points based on distance
    const calculatePoints = (distance: number) => {
        return Math.max(0, Math.round(1000 * Math.exp(-0.0006 * distance)));
    }

    // Gets the distance to a given latitude and longitude
    const getDistanceTo = (guessLat: number, guessLng: number) => {
        const guessedLatLng = L.latLng(guessLat, guessLng);
        const starLatLng = L.latLng(answer.lat, answer.lng);
        const distance = guessedLatLng.distanceTo(starLatLng) / 1000; // Distance in km
        return distance;
    }

    // Custom component to fit bounds when the user has guessed
    const FitBoundsOnGuess: React.FC<{ positionA: LatLngExpression, positionB: LatLngExpression }> = ({ positionA, positionB }) => {
        const map = useMap();
        useEffect(() => {
            if (positionA && positionB) {
                const bounds = new LatLngBounds(positionA, positionB);
                map.fitBounds(bounds);
            }
        }, [positionA, positionB, map]);

        return null;
    };

    return (
        <div className="relative w-full h-screen">
            <MapContainer center={France} zoom={3} className="h-[100%] w-full bg-transparent z-0">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler handlePreGuess={handlePreGuess} getDistanceTo={getDistanceTo} calculatePoints={calculatePoints} />
                <GuessMarker position={preGuess?.coordinates} />
                {guess && (
                    <>
                        <AnswerMarker position={answer} />
                        <GuessLine positionA={guess.coordinates} positionB={answer} />
                        <FitBoundsOnGuess positionA={guess.coordinates} positionB={answer} />
                    </>
                )}
            </MapContainer>
        </div>
    );
};

// Map click handler to manage click events inside the map
function MapClickHandler({ handlePreGuess, getDistanceTo, calculatePoints }: {
    handlePreGuess: (value: Guess) => void;
    getDistanceTo: (lat: number, lng: number) => number;
    calculatePoints: (distance: number) => number;
}) {
    useMapEvent("click", (event) => {
        const { lat, lng } = event.latlng;
        const distance = getDistanceTo(lat, lng);
        handlePreGuess({ coordinates: { lat, lng }, distance, points: calculatePoints(distance) });
    });

    return null;
}

function GuessMarker({ position }: { position: Coord | undefined }) {
    return position && (
        <Marker position={toLatLngExpression(position)} icon={blueIcon} />
    )
}

function AnswerMarker({ position }: { position: Coord }) {
    return (
        <Marker position={toLatLngExpression(position)} icon={redIcon} />
    )
}

function GuessLine({ positionA, positionB }: { positionA: Coord, positionB: Coord }) {
    return (
        <Polyline positions={[toLatLngExpression(positionA), toLatLngExpression(positionB)]} />
    )
}

function toLatLngExpression(coord: Coord): LatLngExpression {
    return [coord.lat, coord.lng];
}

export default MapComponent;
