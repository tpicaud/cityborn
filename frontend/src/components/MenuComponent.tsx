'use client'

import dynamic from 'next/dynamic';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, TextField, Typography } from "@mui/material";
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { GameMode } from '@/enums/GameMode';
import { io } from 'socket.io-client';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Categories } from '@/enums/Categories';
import { createSession } from '@/utils/SessionService';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });


export default function MenuComponent() {

    const router = useRouter();

    const [code, setCode] = useState<string>('')
    const [joinErrorMessage, setJoinErrorMessage] = useState<string>();
    const [loadingJoin, setLoadingJoin] = useState(false);

    const handleSoloPlay = () => {
        router.push(`/session/solo`);
    };

    const handleMultiPlay = async () => {
        const session = await createSession(GameMode.MULTI);
        router.push(`/session/multi/${session.id}`)
    }

    const handleJoin = async () => {
        const gameExists = async (gameID: string): Promise<boolean> => {
            return new Promise((resolve) => {
                const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL, {
                    transports: ['websocket']
                });

                socket.emit('game:fetch', gameID, (response: { success: boolean }) => {
                    resolve(response.success);
                    socket.disconnect()
                });

                socket.on('connect_error', () => {
                    resolve(false);
                    socket.disconnect();
                });

                setTimeout(() => {
                    resolve(false);
                    socket.disconnect();
                }, 5000);
            });
        };

        try {
            if (code) {
                const gameExist = await gameExists(code)
                if (gameExist) {
                    router.push(`/game/multi/${code}`)
                } else {
                    setJoinErrorMessage('La partie est introuvable')
                }
            } else {
                setJoinErrorMessage('Veuillez entrer un code');
            }
        } catch {
            setJoinErrorMessage("Partie introuvable");
        }

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
                <Box className="flex flex-col items-center gap-4 p-6 bg-slate-100 shadow-xl rounded-2xl max-w-[85%] pointer-events-auto">
                    <img src="/cityborn_transparent2.png" alt="Logo" className='mb-2 max-h-32 md:max-h-48' />
                    <p className="text-base md:text-lg text-center ">Trouvez le lieu de naissance des personnalités</p>

                    <div className="flex flex-row gap-2 items-center w-full mt-4">
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

                    <div className='flex flex-row gap-2 justify-center pointer-events-auto'>
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
                </Box>
            </div>
        </div>
    );
}