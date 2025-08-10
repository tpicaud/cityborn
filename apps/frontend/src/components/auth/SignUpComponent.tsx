import * as React from "react";
import { Box, FormControl, TextField, Button, Typography } from "@mui/material";
import * as apiService from '@/services/apiService';

export const SignUpComponent = () => {
    const [formValues, setFormValues] = React.useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleChange = (e: any) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        if (formValues.password !== formValues.confirmPassword) {
            alert("Les mots de passe ne correspondent pas !");
            return;
        }

        await apiService.signUp(formValues.username, formValues.email, formValues.password)
    };

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxWidth: 300,
                mx: "auto",
                mt: 4
            }}
        >
            <Typography variant="h5" align="center">
                Sign Up
            </Typography>

            <FormControl>
                <TextField
                    label="Username"
                    name="username"
                    value={formValues.username}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <FormControl>
                <TextField
                    type="email"
                    label="Email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <FormControl>
                <TextField
                    type="password"
                    label="Password"
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <FormControl>
                <TextField
                    type="password"
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <Button variant="contained" type="submit">
                Sign Up
            </Button>
        </Box>
    );
};
