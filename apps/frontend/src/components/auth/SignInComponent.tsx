'use client';

import * as React from "react";
import { Box, FormControl, TextField, Button, Typography } from "@mui/material";
import * as ApiServiceClient from '@/services/ApiServiceClient';
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export const SignInComponent = () => {

    const { refreshUser } = useAuth();

    /////////////////
    // Google Auth //
    /////////////////
    useEffect(() => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleSignInDiv"),
                {
                    theme: "outline",
                    size: "large",
                    text: "signin_with",
                }
            );
        }
    }, [window.google]);

    const handleCredentialResponse = async (response: any) => {
        await ApiServiceClient.signInWithGoogle(response.credential);
        await refreshUser();
    };
    /////////////////

    const [formValues, setFormValues] = React.useState({
        username: "",
        password: ""
    });

    const handleChange = (e: any) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        await ApiServiceClient.signIn(formValues.username, formValues.password);
        await refreshUser();
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
            }}
        >
            <Typography variant="h5" align="center">
                Sign In
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
                    type="password"
                    label="Password"
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    required
                />
            </FormControl>

            <Button variant="contained" type="submit">
                Sign In
            </Button>

            <div className="flex flex-row gap-3 items-center w-full">
                <div className="flex-1 h-px bg-black rounded-full"></div>
                <Typography>
                    OU
                </Typography>
                <div className="flex-1 h-px bg-black rounded-full"></div>
            </div>

            <div className="flex justify-center items-center h-[44px] w-[244px]">
                <div id="googleSignInDiv"></div>
            </div>
        </Box>
    );
};
