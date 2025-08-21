'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as ApiServiceClient from '@/services/ApiServiceClient'
import { Button } from '@mui/material';

export default function VerifyEmail() {
    const searchParams = useSearchParams();
    const verification_token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const router = useRouter()

    useEffect(() => {
        const verifyEmail = async () => {
            if (verification_token) {
                try {
                    await ApiServiceClient.verifyEmail(verification_token);
                    setStatus('success');
                } catch (err) {
                    setStatus('error');
                }
            }
        };

        verifyEmail();
    }, [verification_token]);

    let content;
    if (status === 'loading') content = <h2>Vérification en cours...</h2>;
    if (status === 'success') content = <h2>Ton email a été vérifié avec succès 🎉</h2>;
    if (status === 'error') content = <h2>Lien invalide ou expiré ❌</h2>;

    return (
        <div className='flex flex-col justify-center items-center h-screen gap-2'>
            {content}
            <Button
                variant="contained"
                color="primary"
                className="bg-green-500 hover:bg-green-600 text-white px-6 w-[10%] rounded "
                onClick={() => router.push('/')}
            >
                <p className='px-3'>Menu</p>
            </Button>
        </div>
    )
}
