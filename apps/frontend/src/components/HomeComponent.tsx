'use client';

import MenuComponent from "./menu/MenuComponent";
import { useEffect, useState } from "react";
import { SignInComponent } from "./auth/SignInComponent";
import { SignUpComponent } from "./auth/SignUpComponent";
import dynamic from "next/dynamic";
import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from "@/contexts/AuthContext";
import * as ApiServiceClient from '@/services/ApiServiceClient';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';
import LoadingIconButton from "./ui/buttons/LoadingIconButton";
import IconButton from "./ui/buttons/IconButton";


const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });

declare global {
    interface Window {
        google: any
    }
}

export default function HomeComponent() {

    const { user, refreshUser } = useAuth();
    const [state, setState] = useState<'menu' | 'sign-in' | 'sign-up'>('menu');
    const [openProfile, setOpenProfile] = useState(false);
    const [sentVerificationEmail, setSentVerificationEmail] = useState(false);

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
            content = <SignUpComponent setSentVerificationEmail={setSentVerificationEmail} />
            break;

        case 'menu':
            content = <MenuComponent setState={setState} setSentVerificationEmail={setSentVerificationEmail} sentVerificationEmail={sentVerificationEmail} />
            break;

        default:
            content = <MenuComponent setState={setState} setSentVerificationEmail={setSentVerificationEmail} sentVerificationEmail={sentVerificationEmail} />
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
                <Box className="relative flex flex-col p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[85%] pointer-events-auto">
                    <div className="absolute self-center top-2 flex flex-col h-[15%] w-[95%]">
                        <div className="flex flex-row items-start justify-between w-full">
                            <IconButton
                                onClick={() => setState('menu')}
                                sx={{
                                    visibility: state === 'menu' ? "hidden" : "visible"
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>

                            <div className="flex flex-row justify-end">
                                <IconButton
                                    onClick={async () => {
                                        setOpenProfile(true);
                                    }}
                                    sx={{
                                        visibility: user ? "visible" : "hidden"
                                    }}
                                >
                                    <AccountCircleIcon />
                                </IconButton>
                                <LoadingIconButton
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
                                </LoadingIconButton>
                            </div>
                        </div>

                    </div>
                    {content}
                </Box>
            </div>

            <Dialog
                open={openProfile}
                onClose={() => setOpenProfile(false)}
            >
                <IconButton
                    aria-label="close"
                    onClick={() => setOpenProfile(false)}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogTitle className="text-center">

                    <p>Profile</p>
                </DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 justify-items-start gap-4 w-full">
                        <div className="flex flex-col justify-items-start gap-0 w-full">
                            <p className="font-bold">Nom d'utilisateur</p>
                            <p>{user?.username}</p>
                        </div>
                        <div className="flex flex-col justify-items-start gap-0 w-full">
                            <p className="font-bold">Email</p>
                            <div>{user?.email}</div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}