'use client';

import MenuComponent from '@/components/MenuComponent';
import { PublicUser } from '@cityborn/types';
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import * as apiService from '@/services/apiService';
import { AuthComponent } from '@/components/auth/AuthComponent';

declare global {
	interface Window {
		socket: Socket;
	}
}

export default async function Home() {


	let user: PublicUser | null = null;

	try {
		// Appel serveur (exemple : récupérer user avec cookies)
		user = await apiService.getCurrentUser();
	} catch (error) {
		console.error('Erreur lors de la récupération de l’utilisateur:', error);
		user = null;
	}
	if (!user) {
		return (
			<main>
				<AuthComponent />
			</main>
		);
	}

	return (
		<main>
			<MenuComponent />
		</main>
	);
}
