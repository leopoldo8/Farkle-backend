import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayDisconnect, OnGatewayConnection } from '@nestjs/websockets';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards, Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { MessageDto, ScoreDto } from './dto/rooms.dto';
import { OptionalJwtAuthGuard } from '@common/optionalJwt.guard';

@WebSocketGateway()
export class RoomsGateway implements OnGatewayInit, OnGatewayDisconnect, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('RoomsGateway');

  constructor(
    private readonly roomService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  async verify(socket: Socket) {
    const { userName, roomId } = socket.handshake.query;
    if (!userName || !roomId) { socket.error('Missing information'); }

    const room = await this.roomService.getById(roomId);
    if (!room) { socket.error('Room not found'); }

    socket.join(room.name);
    return { room, userName };
  }

  afterInit() {
    this.logger.log('Gateway initialized');
  }

  async handleConnection(socket: Socket) {
    const { room, userName } = await this.verify(socket);

    const newRoom = await this.roomService.enter({
      username: userName,
      roomName: room.name,
      roomPassword: room.password
    });

    this.server.to(room.name).emit('joinRoom', newRoom);
  }

  async handleDisconnect(socket: Socket) {
    this.logger.log('Handle disconnect');

    const { room, userName } = await this.verify(socket);

    const newRoom = await this.roomService.leave(room, userName);

    socket.leave(room.name);
    this.server.to(room.name).emit('joinRoom', newRoom);
  }

  @SubscribeMessage('chatServer')
  async onMessage(socket: Socket, messageDto: MessageDto) {
    const { room, userName } = await this.verify(socket);

    const newChat = await this.roomService.chat(messageDto.message, room, userName);

    this.server.to(room.name).emit('chatClient', newChat);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @SubscribeMessage('readyServer')
  async onReady(socket: Socket) {
    const { room, userName } = await this.verify(socket);

    const newRoom = await this.roomService.ready(room, userName);

    if (newRoom.status === 'started') {
      this.server.to(room.name).emit('startClient', newRoom);
    } else {
      this.server.to(room.name).emit('readyClient', newRoom.players);
    }
  }

  @UseGuards(OptionalJwtAuthGuard)
  @SubscribeMessage('unreadyServer')
  async onUnready(socket: Socket) {
    const { room, userName } = await this.verify(socket);

    const newRoom = await this.roomService.unready(room, userName);

    this.server.to(room.name).emit('unreadyClient', newRoom.players);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @SubscribeMessage('rollServer')
  async roll(socket: Socket) {
    const { room, userName } = await this.verify(socket);

    const { hasFarkle, data } = await this.roomService.rollDice(room, userName);
    const event = hasFarkle ? 'skipTurnClient' : 'rollClient';

    this.server.to(room.name).emit(event, data);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @SubscribeMessage('scoreServer')
  async score(socket: Socket, scoreDto: ScoreDto) {
    const { room, userName } = await this.verify(socket);

    const player = await this.roomService.score(scoreDto.dicesSelected, room, userName);

    this.server.to(room.name).emit('scoreClient', player);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @SubscribeMessage('bankServer')
  async bank(socket: Socket) {
    const { room, userName } = await this.verify(socket);

    const { data } = await this.roomService.bank(room, userName);

    this.server.to(room.name).emit('skipTurnClient', data);
  }
}
