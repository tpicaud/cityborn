'use client'

import { Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';
import { Dispatch, SetStateAction, useState } from 'react';
import { GameMode } from '@cityborn/types';
import * as ApiServiceClient from '@/services/ApiServiceClient';
import { useAuth } from '@/contexts/AuthContext';
import CloseIcon from '@mui/icons-material/Close';

export default function MenuComponent({
    setState,
}: {
    setState: Dispatch<SetStateAction<"menu" | "sign-in" | "sign-up">>;
}) {

    const router = useRouter();

    const { user } = useAuth();

    const [code, setCode] = useState<string>('')
    const [joinErrorMessage, setJoinErrorMessage] = useState<string>();
    const [loadingJoin, setLoadingJoin] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);

    const handleSoloPlay = () => {
        router.push(`/session/solo`);
    };

    const handleMultiPlay = async () => {
        if (!user) {
            setOpenAlert(true);
        } else {
            const session = await ApiServiceClient.createSession(GameMode.MULTI);
            router.push(`/session/multi/${session.id}`);
        }
    }

    const handleJoin = async () => {
        try {
            if (code) {
                const session = await ApiServiceClient.fetchSession(code);
                if (!session) setJoinErrorMessage('La partie est introuvable')

                router.push(`/session/multi/${code}`)
            } else {
                setJoinErrorMessage('La partie est introuvable')
            }
        } catch {
            setJoinErrorMessage('Erreur lors de la connexion à la partie');
        }
    }

    return (
        <div className='flex flex-col items-center gap-5'>
            <div className='flex flex-col gap-1 items-center w-full'>
                <img src="/cityborn_transparent2.png" alt="Logo" className='mb-2 max-24 md:max-h-32' />
                <p className="text-base md:text-lg text-center ">Trouvez le lieu de naissance des personnalités</p>
            </div>

            {user ? (
                <Typography variant="h5">
                    Bienvenue <b>{user.username}</b> !
                </Typography>
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
                    <Button
                        variant="contained"
                        color="primary"
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
                        onClick={async () => {
                            setLoadingJoin(true);
                            await handleJoin();
                            setLoadingJoin(false);
                            console.log(loadingJoin)
                        }}
                        disabled={!code}
                    >
                        <p className='px-3'>Rejoindre</p>
                    </Button>

                </div>

                <div className='flex flex-row gap-2 justify-center'>
                    <Button
                        variant="contained"
                        color="primary"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                        onClick={handleSoloPlay}
                    >
                        <b>SOLO</b>
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                        onClick={handleMultiPlay}
                    >
                        <b>MULTI</b>
                    </Button>
                </div>

                {joinErrorMessage && (
                    <Typography color="error" style={{ marginTop: "8px" }}>
                        {joinErrorMessage}
                    </Typography>
                )}
            </div>

            <Dialog
                open={openAlert}
                onClose={() => setOpenAlert(false)}
            >
                <IconButton
                    aria-label="close"
                    onClick={() => setOpenAlert(false)}
                    sx={{
                        position: 'absolute',
                        right: 0,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
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