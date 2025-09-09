import { useError } from "@/contexts/ErrorContext";
import { GameRecord, User } from "@cityborn/types";
import { Accordion, AccordionDetails, AccordionSummary, Box, CircularProgress, List, ListItem, ListItemText, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import * as ApiServiceClient from '@/services/ApiServiceClient';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { calculateTotalPoints } from "@/utils/calculateScore";

export const ProfileComponent = ({ user }: { user: User }) => {

    const { invokeError } = useError();
    const [games, setGames] = useState<GameRecord[]>();
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const getGameRecords = async () => {
            try {
                const games = await ApiServiceClient.getGameRecords();
                setGames(games);
            } catch (error: any) {
                invokeError(error);
            } finally {
                setLoading(false);
            }
        }
        getGameRecords();
    }, [])

    return (
        <Box
            component="form"
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxWidth: 300,
                padding: 1
            }}
        >
            <Typography variant="h5" align="center">
                Profile
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Typography>
                    <strong>Username:</strong> {user.username}
                </Typography>
                <Typography>
                    <strong>Email:</strong> {user.email}
                </Typography>
                {user.birthdate && (
                    <Typography>
                        <strong>Date de naissance:</strong> {user.birthdate}
                    </Typography>
                )}
                <Typography>
                    <strong>Email vérifié:</strong>{" "}
                    {user.isVerified ? "✅ Oui" : "❌ Non"}
                </Typography>
            </Box>

            <Accordion disabled={loading}>
                <AccordionSummary
                    expandIcon={!loading ? <ExpandMoreIcon /> : null}
                    sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: '100%' }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center w-full h-full ">
                            <CircularProgress size={20} />
                        </div>
                    ) : (
                        <>
                            <Typography>Games ({games?.length ?? 0})</Typography>
                        </>
                    )}
                </AccordionSummary>
                <AccordionDetails>
                    {loading ? (
                        <List dense>
                            {[1, 2, 3].map((i) => (
                                <ListItem key={i} divider>
                                    <ListItemText
                                        primary={<CircularProgress size={15} />}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : !games || games.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Aucune partie jouée
                        </Typography>
                    ) : (
                        <List dense>
                            {games.map((game) => (
                                <ListItem key={game.id} divider>
                                    <ListItemText
                                        primary={`${game.id} — Score: ${calculateTotalPoints(
                                            game.results[user.username]
                                        )}`}
                                        secondary={`Date: ${game.createdAt}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};