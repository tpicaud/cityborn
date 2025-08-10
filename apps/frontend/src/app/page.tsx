import MenuComponent from '@/components/MenuComponent';
import { Socket } from 'socket.io-client';
import * as apiService from '@/services/apiService';
import { AuthComponent } from '@/components/auth/AuthComponent';

declare global {
	interface Window {
		socket: Socket;
	}
}

export default async function Home() {

	const user = await apiService.getCurrentUser();
	console.log(user)

	return (
		<main>
			{user ? (
				<MenuComponent />
			) : (
				<AuthComponent />
			)}
		</main>
	);
}
