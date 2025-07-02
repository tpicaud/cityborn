import MenuComponent from '@/components/MenuComponent';
import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    socket: Socket;
  }
}

export default function Home() {
  return (
    <main>
      <MenuComponent />
    </main>
  );
}
