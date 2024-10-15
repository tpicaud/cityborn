'use client'

import dynamic from 'next/dynamic';
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });


export default function MenuComponent() {

    const router = useRouter();

    return (
        <div className="relative min-h-[100vh]">
            <div className="absolute inset-0 ">
                <MapContainer center={[0, 0]} zoom={3} zoomControl={false} className="h-full w-full z-0">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </MapContainer>
                <div className="absolute inset-0 bg-black opacity-60 z-10 pointer-events-none"></div>

            </div>
            
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] py-4 px-2 bg-transparent text-gray-200 pointer-events-none">
                <h1 className="text-3xl font-bold mb-4">CityStarGuessr</h1>
                <p className="text-lg text-center mb-8">Guess where the stars were born on the map</p>
                <Button
                    variant="contained"
                    color="primary"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded pointer-events-auto"
                    onClick={() => { router.push('/game') }}
                >
                    <b>Start Game</b>
                </Button>
            </div>
        </div>
    );
    
}