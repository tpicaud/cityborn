import { Socket } from 'socket.io-client';
import HomeComponent from '@/components/HomeComponent';

declare global {
	interface Window {
		socket: Socket;
	}
}

export default function Home() {
	return (
		<main>
			<HomeComponent />
		</main>
	);
}
