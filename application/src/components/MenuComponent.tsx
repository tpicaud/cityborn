'use client'

import dynamic from 'next/dynamic';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Checkbox, Chip, FormControl, InputLabel, ListItemIcon, ListItemText, MenuItem, NativeSelect, OutlinedInput, TextField, Typography } from "@mui/material";
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from "next/navigation";
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { GameMode } from '@/enums/GameMode';
import { io } from 'socket.io-client';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Categories } from '@/enums/Categories';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });


export default function MenuComponent() {

    const router = useRouter();

    // Game Config variables
    const [timer, setTimer] = useState(20);
    const [nbOfObjects, setNbOfObjects] = useState(3)
    const [categories, setCategories] = useState<string[]>([Categories.TOUTES]);
    const [code, setCode] = useState<string>()
    const [joinErrorMessage, setJoinErrorMessage] = useState<string>();


    const handleCategories = (event: SelectChangeEvent<string[]>) => {
        const { target: { value } } = event;

        const selectedCategories = typeof value === 'string' ? value.split(',') : value;

        setCategories(
            selectedCategories
        );
    };

    const handlePlay = (gameMode: GameMode) => {
        const queryParams = new URLSearchParams({
            gameMode: gameMode,
            timer: timer.toString(),
            nbOfObjects: nbOfObjects.toString(),
            categories: categories.toString()
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
                            onClick={() => handleJoin()}
                            disabled={!code}
                        >
                            Rejoindre
                        </Button>

                    </div>

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
                    </div>

                    <div className='max-w-full'>
                        <Accordion
                            sx={{
                                borderTop: '1px solid #ccc',  // Bordure grise
                                backgroundColor: 'transparent',  // Fond transparent
                                boxShadow: 'none',  // Pas d'ombre
                                '&:before': {
                                    display: 'none',  // Enlève la ligne avant l'accordion
                                },
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                                sx={{
                                    backgroundColor: 'transparent',  // Fond transparent pour l'en-tête
                                    border: 'none',
                                    paddingBottom: 0,
                                    marginBottom: 0
                                }}
                            >
                                <Typography component="span">Configuration de la partie</Typography>
                            </AccordionSummary>
                            <AccordionDetails
                                sx={{
                                    backgroundColor: 'transparent',
                                    paddingTop: 0,
                                    marginTop: 0
                                }}
                            >
                                <div className='w-full flex flex-col gap-3'>
                                    {/* <FormControl sx={{ width: '100%' }}>
                                        <InputLabel id="categories">Categories</InputLabel>
                                        <Select
                                            id="category-selector"
                                            multiple
                                            value={categories}
                                            onChange={handleCategories}
                                            input={<OutlinedInput id="select-multiple-chip" label="Categories" />}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => (
                                                        <Chip key={value} label={value} />
                                                    ))}
                                                </Box>
                                            )}
                                        >
                                            {Object.values(Categories).map((category) => (
                                                <MenuItem key={category} value={category}>
                                                    {category}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl> */}

                                    <FormControl sx={{ width: '100%' }}>
                                        <InputLabel id="categories-input">Categories</InputLabel>
                                        <Select
                                            labelId="categories-input"
                                            id="categories-input"
                                            multiple
                                            value={categories}
                                            onChange={handleCategories}
                                            input={<OutlinedInput label="Categories" />}
                                            renderValue={(selected) => selected.join(', ')}
                                        >
                                            {Object.values(Categories).map((category) => (
                                                <MenuItem key={category} value={category}>
                                                    <Checkbox checked={categories.includes(category)} />
                                                    <ListItemText primary={category} />
                                                </MenuItem>
                                            ))}

                                        </Select>
                                    </FormControl>

                                    <div className='w-full flex flex-row gap-x-2'>
                                        <TextField
                                            type="number"
                                            label="Personnalités"
                                            variant="outlined"
                                            fullWidth
                                            value={nbOfObjects}
                                            onChange={(e) => setNbOfObjects(e.target.value ? Number(e.target.value) : 6)}
                                        />

                                        <TextField
                                            type="number"
                                            label="Timer"
                                            variant="outlined"
                                            fullWidth
                                            value={timer}
                                            onChange={(e) => setTimer(e.target.value ? Number(e.target.value) : 20)}
                                        />
                                    </div>
                                </div>
                            </AccordionDetails>
                        </Accordion>
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