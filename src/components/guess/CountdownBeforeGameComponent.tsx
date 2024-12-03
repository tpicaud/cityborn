import { Backdrop, Typography } from "@mui/material";
import { useState, useEffect } from "react";

interface CountdownComponentProps {
    onCountdownEnd: () => void;
    initialCount?: number; // Default value 3
}

const CountdownBeforeGameComponent: React.FC<CountdownComponentProps> = ({ onCountdownEnd, initialCount = 3 }) => {
    const [countdown, setCountdown] = useState(initialCount);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else {
            onCountdownEnd();
        }
    }, [countdown, onCountdownEnd]);

    return (
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Typography variant="h1" component="div">
                {countdown > 0 ? countdown : "GO!"}
            </Typography>
        </Backdrop>
    );
};

export default CountdownBeforeGameComponent;
