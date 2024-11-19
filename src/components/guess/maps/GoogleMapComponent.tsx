'use client';

import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, Polyline, useLoadScript, useGoogleMap } from '@react-google-maps/api';
import { LatLng, LatLngLiteral } from 'google.maps';
import { calculatePoints } from '@/utils/calculateScore';
import Coord from '@/types/Coord';
import Guess from '@/types/Guess';

const googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';  // Remplacez par votre clé API Google Maps

const France: LatLngLiteral = { lat: 46.603354, lng: 1.888334 };

interface MapComponentProps {
    preGuess: Guess | undefined;
    guess: Guess | undefined;
    answer: Coord;
    handlePreGuess: (value: Guess) => void;
}

const GoogleMapComponent: React.FC<MapComponentProps> = ({
    preGuess,
    guess,
    answer,
    handlePreGuess,
}) => {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey,
    });

    // Calcul des points en fonction de la distance
    const getPoints = (distance: number) => {
        return calculatePoints(distance);
    };

    // Calcule la distance entre la devinette et la réponse
    const getDistanceTo = (guessLat: number, guessLng: number) => {
        const guessedLatLng = new LatLng(guessLat, guessLng);
        const starLatLng = new LatLng(answer.lat, answer.lng);
        const distance = guessedLatLng.distanceTo(starLatLng) / 1000; // Distance en km
        return distance;
    };

    const [map, setMap] = useState<any>(null);

    const onMapLoad = (mapInstance: any) => {
        setMap(mapInstance);
    };

    useEffect(() => {
        if (map && preGuess) {
            // Ajuste les limites de la carte en fonction des positions
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(new LatLng(preGuess.coordinates.lat, preGuess.coordinates.lng));
            bounds.extend(new LatLng(answer.lat, answer.lng));
            map.fitBounds(bounds);
        }
    }, [map, preGuess, answer]);

    const onClick = (event: any) => {
        const { latLng } = event;
        const lat = latLng.lat();
        const lng = latLng.lng();
        const distance = getDistanceTo(lat, lng);
        handlePreGuess({
            coordinates: { lat, lng },
            distance,
            points: getPoints(distance),
        });
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div className="fixed w-full h-screen z-0">
            <GoogleMap
                center={France}
                zoom={3}
                mapContainerClassName="h-[100%] w-full bg-transparent"
                onLoad={onMapLoad}
                onClick={onClick}
            >
                {preGuess?.coordinates && (
                    <Marker
                        position={preGuess.coordinates}
                        icon={{
                            url: '/img/marker-icon-blue.png',
                            scaledSize: new window.google.maps.Size(24, 24),
                        }}
                    />
                )}
                {guess && (
                    <>
                        <Marker
                            position={answer}
                            icon={{
                                url: '/img/marker-icon-red.png',
                                scaledSize: new window.google.maps.Size(24, 24),
                            }}
                        />
                        {guess.distance !== -1 && (
                            <Polyline
                                path={[guess.coordinates, answer]}
                                options={{
                                    strokeColor: '#ff0000',
                                    strokeOpacity: 1,
                                    strokeWeight: 2,
                                }}
                            />
                        )}
                    </>
                )}
            </GoogleMap>
        </div>
    );
};

export default GoogleMapComponent;
