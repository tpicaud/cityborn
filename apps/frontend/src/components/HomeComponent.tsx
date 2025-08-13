'use client';

import MenuComponent from "./MenuComponent";
import { useEffect, useState } from "react";
import { SignInComponent } from "./auth/SignInComponent";
import { SignUpComponent } from "./auth/SignUpComponent";
import dynamic from "next/dynamic";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from "@/contexts/AuthContext";
import * as ApiServiceClient from '@/services/ApiServiceClient';


const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

export default function HomeComponent() {

    const { user, refreshUser } = useAuth();
    const [state, setState] = useState<'menu' | 'sign-in' | 'sign-up'>('menu');

    useEffect(() => {
        if (user) {
            setState('menu');
        }
    }, [user])

    let content;

    switch (state) {
        case 'sign-in':
            content = <SignInComponent />;
            break;

        case 'sign-up':
            content = <SignUpComponent />
            break;

        case 'menu':
            content = <MenuComponent setState={setState} />
            break;

        default:
            content = <MenuComponent setState={setState} />
    }

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
                <Box className="relative flex flex-col items-center p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[85%] pointer-events-auto">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col h-[95%] w-[95%]">
                        <div className="flex flex-row items-start justify-between w-full">
                            <IconButton
                                onClick={() => setState('menu')}
                                sx={{
                                    visibility: state === 'menu' ? "hidden" : "visible"
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>

                            <IconButton
                                onClick={async () => {
                                    await ApiServiceClient.signOut();
                                    await refreshUser();
                                    setState('menu');
                                }}
                                sx={{
                                    visibility: user ? "visible" : "hidden"
                                }}
                            >
                                <LogoutIcon />
                            </IconButton>
                        </div>

                    </div>
                    {content}
                </Box>
            </div>
        </div>
    )
}