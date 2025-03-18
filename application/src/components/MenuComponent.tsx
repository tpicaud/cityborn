'use client'

import dynamic from 'next/dynamic';
import { Box, Button, FormControl, InputLabel, NativeSelect, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { GameMode } from '@/enums/GameMode';
import { io } from 'socket.io-client';
import { resolve } from 'path';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });


export default function MenuComponent() {

    const router = useRouter();

    // Game Config variables
    const [timer, setTimer] = useState(20);
    const [nbOfObjects, setNbOfObjects] = useState(3)
    const [category, setCategory] = useState('all');
    const [code, setCode] = useState<string>()
    const [joinErrorMessage, setJoinErrorMessage] = useState<string>();


    const handleCategory = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(event.target.value);
    };

    const handlePlay = (gameMode: GameMode) => {
        const queryParams = new URLSearchParams({
            gameMode: gameMode,
            timer: timer.toString(),
            nbOfObjects: nbOfObjects.toString(),
            category,
        }).toString();

        router.push(`/game?${queryParams}`);
    };

    const handleJoin = async () => {

        const gameExists = async (gameID: string): Promise<boolean> => {
            return new Promise((resolve) => {
                const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL);

                socket.emit('fetchGame', gameID, (response: { success: boolean }) => {
                    resolve(response.success); // Retourne true si succès, false sinon
                });

                socket.on("disconnect", () => {
                    socket.close();
                });
            });
        };


        if (code && await gameExists(code)) {
            router.push(`/game/multi/${code}`);
        } else {
            console.log('in')
            setJoinErrorMessage("La partie est introuvable")
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

                    <div className='flex flex-row gap-2 justify-center pointer-events-auto'>
                        <Button
                            variant="contained"
                            color="primary"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                            onClick={() => handlePlay(GameMode.SOLO)}
                        >
                            <b>SOLO</b>
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                            onClick={() => handlePlay(GameMode.MULTI)}
                        >
                            <b>MULTI</b>
                        </Button>
                        <CategorySelector handleCategory={handleCategory} />
                    </div>

                    <div className="flex flex-row gap-2 items-center w-full mt-4">
                        <input
                            type="text"
                            placeholder="Code de la partie"
                            className="border border-gray-300 rounded px-4 py-2 w-full"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
                            onClick={() => handleJoin()}
                            disabled={!code}
                        >
                            Rejoindre
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

const CategorySelector = ({ handleCategory }: { handleCategory: (event: React.ChangeEvent<HTMLSelectElement>) => void }) => {

    return (
        <FormControl fullWidth>
            <InputLabel variant="standard" htmlFor="uncontrolled-native">
                Catégorie
            </InputLabel>
            <NativeSelect
                defaultValue={'all'}
                inputProps={{
                    name: 'Catégorie',
                    id: 'uncontrolled-native',
                }}
                onChange={handleCategory}
            >
                <option value={'all'}>Toutes</option>
                <option value={'Sport'}>Sport</option>
                <option value={'Cinema/Humour'}>Cinema/Humour</option>
                <option value={'Musique'}>Musique</option>
                <option value={'Politique'}>Politique</option>
                <option value={'Autre domaine'}>Autre domaine</option>
            </NativeSelect>
        </FormControl>
    )
}