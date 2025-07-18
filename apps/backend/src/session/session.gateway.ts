import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { SessionService } from './session.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class SessionGateway {

  constructor(private readonly sessionService: SessionService) { }

  @SubscribeMessage('session:join')
  handleMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody('sessionID') sessionID: string,
    @MessageBody('playerID') playerID: string
  ): string {
    console.log(socket.id)
    console.log(sessionID);
    console.log(playerID)
    return 'Hello world!';
  }
}
