'use client';

import GuessComponent from "@/components/guess/GuessComponent";
import GuessObject from "@/types/GuessObject";
import useGame from "@/hooks/useGame";
import { getLocalObjectList } from "@/services/LocalGameService";
import { useGameResults } from "@/contexts/GameResultsContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingComponent from "../LoadingComponent";
import Snackbar from "@mui/material/Snackbar";
import { Alert } from "@mui/material";

const SoloGameComponent = () => {
    const router = useRouter();
    const [guessObjects, setGuessObjects] = useState<GuessObject[]>([]);
    const { setPlayerResults } = useGameResults();
    const [snackBarOpen, setSnackBarOpen] = useState(false);

    const {
        currentGuessObject,
        playerResults,
        isFinished,
        recordResult,
        nextGuessObject,
    } = useGame(guessObjects);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const objects = await getLocalObjectList();
                setGuessObjects(objects);
            } catch (error) {
                console.error('Erreur lors de la récupération des objets:', error);
                handleSnackBar();
                fetchData();
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (isFinished) {
            setPlayerResults(playerResults);
            router.push('solo/results');
        }
    }, [isFinished, playerResults, setPlayerResults, router]);

    const handleSnackBar = () => {
        setSnackBarOpen(true);
    };

    if (!currentGuessObject) {
        return <>
            <LoadingComponent />
            <Snackbar open={snackBarOpen} autoHideDuration={5000} onClose={() => setSnackBarOpen(false)} >
                <Alert severity="error" onClose={() => setSnackBarOpen(false)}>
                    Error while getting object. Trying again..."
                </Alert>
            </Snackbar>
        </>;
    }

    return (
        <div>
            <GuessComponent
                guessObject={currentGuessObject}
                nextGuessObject={nextGuessObject}
                recordResult={recordResult}
            />
        </div>
    );
};

export default SoloGameComponent;
