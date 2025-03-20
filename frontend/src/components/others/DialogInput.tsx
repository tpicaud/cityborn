import { Button, Card, CardContent, TextField, Typography } from "@mui/material"
import { useState } from "react"
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';

export const DialogInput = ({
    message,
    handleClick,
    label
} : {
    message: string,
    handleClick: (input: string) => void,
    label?: string
}) => {
    const [currentInput, setCurrentInput] = useState<string>('');

    return (
        <Card style={{ maxWidth: 400, margin: "auto", padding: 20, textAlign: "center" }}>
                    <CardContent>
                        <Typography
                            variant="h5"
                            component="div"
                        >
                            {message}
                        </Typography>
                        <TextField
                            fullWidth
                            style={{ marginTop: 10 }}
                            label={label}
                            variant="outlined"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            style={{ marginTop: 10 }}
                            disabled={currentInput.trim() === ""}
                            onClick={() => handleClick(currentInput)}
                        >
                            <ArrowCircleRightIcon />
                        </Button>
                    </CardContent>
                </Card>
    )
}