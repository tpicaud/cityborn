'use client';

import { Socket } from 'socket.io-client';
import AuthProvider from '@/contexts/AuthContext';
import HomeComponent from '@/components/HomeComponent';

declare global {
	interface Window {
		socket: Socket;
	}
}

export default function Home() {
	return (
		<main>
			<AuthProvider>
				<HomeComponent />
			</AuthProvider>
		</main>
	);
}
