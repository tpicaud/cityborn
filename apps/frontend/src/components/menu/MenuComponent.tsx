'use client'

import { DialogContent, DialogTitle, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';
import { Dispatch, SetStateAction, useState } from 'react';
import { SessionMode } from '@cityborn/types';
import * as ApiServiceClient from '@/services/ApiServiceClient';
import { useAuth } from '@/contexts/AuthContext';
import Button from "../ui/buttons/Button";
import LoadingButton from "../ui/buttons/LoadingButton";
import { Dialog } from "../ui/dialogs/Dialog";
import { useError } from "@/contexts/ErrorContext";
import Image from 'next/image';

export default function MenuComponent({
    setState,
    setSentVerificationEmail,
    sentVerificationEmail
}: {
    setState: Dispatch<SetStateAction<"menu" | "sign-in" | "sign-up" | "profile">>;
    setSentVerificationEmail: Dispatch<SetStateAction<boolean>>;
    sentVerificationEmail: boolean
}) {

    const router = useRouter();
    const { user } = useAuth();
    const { invokeError } = useError();

    const [code, setCode] = useState<string>('')
    const [openConnectionAlert, setOpenConnectionAlert] = useState(false);


    const handleSoloPlay = () => {
        router.push(`/session/solo`);
    };

    const handleMultiPlay = async () => {

        if (!user) {
            setOpenConnectionAlert(true);
        } else {
            try {
                const session = await ApiServiceClient.createSession(SessionMode.MULTI);
                router.push(`/session/multi/${session.id}`);
            } catch (error: any) {
                invokeError(error);
            }
        }
    }

    const handleJoin = async () => {
        try {
            await ApiServiceClient.fetchSession(code);
            router.push(`/session/multi/${code}`)
        } catch (error: any) {
            invokeError(error);
        }
    }

    const sendNewVerificationEmail = async () => {
        try {
            ApiServiceClient.sendVerificationEmail();
            setSentVerificationEmail(true);
        } catch { }
    }

    return (
        <div className='flex flex-col items-center gap-5'>
            <div className='relative flex flex-col gap-1 items-center w-full'>
                <Image
                    src="/cityborn_transparent_new_logo.png"
                    alt="Logo"
                    width={96}
                    height={96}
                    style={{ objectFit: 'contain' }}
                    className="object-contain w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40"
                    priority
                />
                <p className="text-base md:text-lg text-center ">Trouve le lieu de naissance des personnalités</p>
            </div>

            {user ? (
                <div className="flex flex-col items-center justify-center">
                    <Typography variant="h5" className="text-center">
                        Bienvenue <b>{user.username}</b> !
                    </Typography>
                    {!user.isVerified && (
                        sentVerificationEmail ? (
                            <p className="text-green-600">Email de vérification envoyé</p>
                        ) : (
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    sendNewVerificationEmail();
                                }}
                                style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }}
                            >
                                Vérifie ton email
                            </a>
                        )
                    )}

                </div>
            ) : (
                <div className="flex flex-row gap-2 items-center justify-center w-full">
                    <Button
                        variant="contained"
                        color="primary"
                        className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
                        onClick={async () => {
                            setState('sign-in');
                        }}
                    >
                        <p className='px-3'>Connexion</p>
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
                        onClick={async () => {
                            setState('sign-up');
                        }}
                    >
                        <p className='px-3'>Inscription</p>
                    </Button>
                </div>
            )}

            <div className="flex flex-col gap-2 items-center justify-center w-full">

                <div className="flex flex-row gap-3 items-center w-full">
                    <div className="flex-1 h-px bg-black rounded-full"></div>
                    <Typography variant="h6">
                        Jouer
                    </Typography>
                    <div className="flex-1 h-px bg-black rounded-full"></div>
                </div>

                <div className="flex flex-row gap-2 items-center justify-center w-full">
                    <input
                        type="text"
                        placeholder="Code"
                        className="border border-gray-300 rounded px-4 py-2 w-full"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <LoadingButton
                        variant="contained"
                        color="primary"
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
                        onClick={handleJoin}
                        disabled={!code}
                    >
                        <p className='px-3'>Rejoindre</p>
                    </LoadingButton>

                </div>

                <div className='flex flex-row gap-2 items-center justify-between w-full'>
                    <LoadingButton
                        variant="contained"
                        color="primary"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
                        onClick={handleSoloPlay}
                    >
                        <b>SOLO</b>
                    </LoadingButton>
                    <LoadingButton
                        variant="contained"
                        color="primary"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded w-full"
                        onClick={handleMultiPlay}
                    >
                        <b>MULTI</b>
                    </LoadingButton>
                </div>
            </div>

            <Dialog
                open={openConnectionAlert}
                onClose={() => setOpenConnectionAlert(false)}
            >
                <DialogTitle sx={{ mt: 2, mx: 3, paddingX: 2, paddingTop: 2 }}>

                    <p>Vous devez être connecté pour jouer en mode multi !</p>
                </DialogTitle>
                <DialogContent>
                    <div className="flex flex-row gap-2 items-center justify-center w-full">
                        <Button
                            variant="contained"
                            color="primary"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
                            onClick={async () => {
                                setState('sign-in');
                            }}
                        >
                            <p className='px-3'>Se connecter</p>
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 w-full rounded"
                            onClick={async () => {
                                setState('sign-up');
                            }}
                        >
                            <p className='px-3'>S'inscrire</p>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}