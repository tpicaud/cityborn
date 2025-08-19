'use client';

import { Backdrop, Typography } from "@mui/material";
import { useState, useEffect } from "react";

interface TimerComponentProps {
    onCountdownEnd: () => void;
    initialCount?: number; // Default value 3
}

const TimerComponent: React.FC<TimerComponentProps> = ({ onCountdownEnd, initialCount = 3 }) => {
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
    }, [countdown]);

    return (
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Typography
                variant="h1"
                component="div"
                fontFamily={'"Roboto", "Helvetica", "Arial", sans-serif'}
                >
                {countdown}
            </Typography>
        </Backdrop>
    );
};

export default TimerComponent;
