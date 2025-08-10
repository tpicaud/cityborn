'use client';

import { Typography } from "@mui/material"
import { SignInComponent } from "./SignInComponent"
import { SignUpComponent } from "./SignUpComponent"

export const AuthComponent = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <Typography variant="h4" align="center">Authentication</Typography>
            <div>
                <SignInComponent />
            </div>
            <div>
                <SignUpComponent />
            </div>
        </div>
    )
}