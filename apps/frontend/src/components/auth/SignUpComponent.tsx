'use client';

import * as React from "react";
import { Box, FormControl, TextField, Button, Typography } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as ApiServiceClient from '@/services/ApiServiceClient';
import { useAuth } from "@/contexts/AuthContext";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { LocalizationProvider } from "node_modules/@mui/x-date-pickers/esm/LocalizationProvider/LocalizationProvider";
import { useError } from "@/contexts/ErrorContext";

interface FormValues {
    username: string;
    email: string;
    birthdate: Date | null;  // ✅ corrige le type
    password: string;
    confirmPassword: string;
}

export const SignUpComponent = ({
    setSentVerificationEmail
}: {
    setSentVerificationEmail: Dispatch<SetStateAction<boolean>>
}) => {

    const { refreshUser } = useAuth();
    const { invokeError } = useError();
    const [isSignUpFormSubmitting, setIsSignUpFormSubmitting] = useState(false);

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
                    text: "signin_with"
                }
            );
        }
    }, []);

    const handleCredentialResponse = async (response: any) => {
        try {
            await ApiServiceClient.signInWithGoogle(response.credential);
            await refreshUser();
        } catch (error: any) {
            invokeError(error)
        }
    };
    /////////////////

    const [formValues, setFormValues] = React.useState<FormValues>({
        username: "",
        email: "",
        birthdate: null,
        password: "",
        confirmPassword: ""
    });

    const [touched, setTouched] = React.useState({
        username: false,
        email: false,
        birthdate: false,
        password: false,
        confirmPassword: false,
    });

    const handleChange = (e: any) => {
        setFormValues({
            ...formValues,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: any) => {

        setIsSignUpFormSubmitting(true);

        e.preventDefault();

        if (formValues.password !== formValues.confirmPassword) {
            invokeError("Les mots de passe ne correspondent pas");
            setIsSignUpFormSubmitting(false);
            return;
        }
        if (!formValues.birthdate) {
            alert("La date de naissance n'est pas rempli");
            setIsSignUpFormSubmitting(false);
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
        if (!passwordRegex.test(formValues.password)) {
            invokeError("Le mot de passe doit contenir au moins une majuscule et un chiffre.");
            setIsSignUpFormSubmitting(false);
            return;
        }

        try {
            await ApiServiceClient.signUp(formValues.username, formValues.email, formValues.birthdate, formValues.password);
            setSentVerificationEmail(true);
            await refreshUser();
        } catch (error: any) {
            invokeError(error)
        } finally {
            setIsSignUpFormSubmitting(false);
        }
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
            }}
        >
            <Typography variant="h5" align="center">
                Inscription
            </Typography>

            <FormControl>
                <TextField
                    label="Username"
                    name="username"
                    value={formValues.username}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                    required
                    error={touched.username && !formValues.username}
                />
            </FormControl>

            <FormControl>
                <TextField
                    type="email"
                    label="Email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    required
                    error={touched.email && !formValues.email}
                />
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <FormControl>
                    <DatePicker
                        label="Date de naissance"
                        value={formValues.birthdate}
                        onChange={(newValue) =>
                            setFormValues((prev) => ({ ...prev, birthdate: newValue }))
                        }
                        minDate={new Date('1900-01-01')}
                        maxDate={new Date()}
                        slotProps={{
                            textField: {
                                required: true,
                                fullWidth: true,
                                error: touched.birthdate && !formValues.birthdate,
                                onBlur: () => setTouched(prev => ({ ...prev, birthdate: true }))
                            },
                        }}
                    />
                </FormControl>
            </LocalizationProvider>

            <FormControl>
                <TextField
                    type="password"
                    label="Password"
                    name="password"
                    value={formValues.password}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                    required
                    error={touched.password && !formValues.password}
                />
            </FormControl>

            <FormControl>
                <TextField
                    type="password"
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                    required
                    error={touched.confirmPassword && !formValues.confirmPassword}
                />
            </FormControl>

            <Button variant="contained" type="submit" loading={isSignUpFormSubmitting}>
                S'inscrire
            </Button>

            <div className="flex flex-row gap-3 items-center w-full">
                <div className="flex-1 h-px bg-black rounded-full"></div>
                <Typography>
                    OU
                </Typography>
                <div className="flex-1 h-px bg-black rounded-full"></div>
            </div>

            <div className="flex justify-center items-center h-[44px] w-full">
                <div id="googleSignInDiv"></div>
            </div>
        </Box>
    );
};
