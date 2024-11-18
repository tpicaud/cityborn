'use client'

import dynamic from 'next/dynamic';
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });


export default function MenuComponent() {

    const router = useRouter();

    return (
        <div className="relative h-screen">
            <div className="absolute inset-0">
                <MapContainer center={[0, 0]} zoom={3} zoomControl={false} className="h-full w-full z-0">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                </MapContainer>
                <div className="absolute inset-0 bg-black opacity-60 z-10 pointer-events-none"></div>

            </div>
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 bg-transparent pointer-events-none">
                <Box className="flex flex-col items-center gap-4 p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[85%]">
                    <img src="/cityborn_transparent2.png" alt="Logo" className='mb-2 max-h-32 md:max-h-48' />
                    <p className="text-base md:text-lg text-center ">Guess where the celebrities were born on the map</p>
                    <Button
                        variant="contained"
                        color="primary"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded pointer-events-auto"
                        onClick={() => { router.push('/game/solo') }}
                    >
                        <b>Start Game</b>
                    </Button>
                </Box>
            </div>
        </div>
    );
    
}