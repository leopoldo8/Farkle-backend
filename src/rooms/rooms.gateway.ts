import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayDisconnect, OnGatewayConnection } from '@nestjs/websockets';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { MessageDto, ScoreDto } from './dto/rooms.dto';

@WebSocketGateway({ namespace: 'rooms' })
export class RoomsGateway implements OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  async verify(socket: Socket) {
    const { userId, roomId } = socket.handshake.query;
    if (!userId || !roomId) { socket.error('Missing information'); }

    const user = await this.usersService.findById(userId);
    if (!user) { socket.error('User not found'); }

    const room = await this.roomService.getById(roomId);
    if (!room) { socket.error('Room not found'); }

    return { user, room };
  }

  async handleConnection(socket: Socket) {
    const { room } = await this.verify(socket);

    socket.join(room.name);
    socket.to(room.name).emit('joinRoom', room.players);
  }

  async handleDisconnect(socket: Socket) {
    const { room, user } = await this.verify(socket);

    const newRoom = await this.roomService.leave(room, user);

    socket.leave(room.name);
    socket.to(room.name).emit('leftRoom', newRoom.players);
  }

  @UseGuards(AuthGuard('jwt'))
  @SubscribeMessage('chatServer')
  async onMessage(socket: Socket, messageDto: MessageDto) {
    const { room, user } = await this.verify(socket);

    const newChat = await this.roomService.chat(messageDto.message, room, user);

    this.server.to(room.name).emit('chatClient', newChat[newChat.length - 1]);
  }

  @UseGuards(AuthGuard('jwt'))
  @SubscribeMessage('readyServer')
  async onReady(socket: Socket) {
    const { room, user } = await this.verify(socket);

    const newRoom = await this.roomService.ready(room, user);

    if (newRoom.status === 'started') {
      this.server.to(room.name).emit('startClient', newRoom);
    } else {
      this.server.to(room.name).emit('readyClient', newRoom.players);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @SubscribeMessage('unreadyServer')
  async onUnready(socket: Socket) {
    const { room, user } = await this.verify(socket);

    const newRoom = await this.roomService.unready(room, user);

    this.server.to(room.name).emit('unreadyClient', newRoom.players);
  }

  @UseGuards(AuthGuard('jwt'))
  @SubscribeMessage('rollServer')
  async roll(socket: Socket) {
    const { room, user } = await this.verify(socket);

    const { hasFarkle, data } = await this.roomService.rollDice(room, user);
    const event = hasFarkle ? 'skipTurnClient' : 'rollClient';

    this.server.to(room.name).emit(event, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @SubscribeMessage('scoreServer')
  async score(socket: Socket, scoreDto: ScoreDto) {
    const { room, user } = await this.verify(socket);

    const player = await this.roomService.score(scoreDto.dicesSelected, room, user);

    this.server.to(room.name).emit('scoreClient', player);
  }

  @UseGuards(AuthGuard('jwt'))
  @SubscribeMessage('bankServer')
  async bank(socket: Socket) {
    const { room, user } = await this.verify(socket);

    const { data } = await this.roomService.bank(room, user);

    this.server.to(room.name).emit('skipTurnClient', data);
  }
}
