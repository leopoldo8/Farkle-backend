import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Room } from './interfaces/room.interface';
import { CreateDto } from './dto/rooms.dto';
import { UsersService } from '../users/users.service';
import { JWTDecryptedDto } from '../common/dto/jwt.dto';
import { Model } from 'mongoose';
import { randomIntFromInterval } from '../common/utils';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('ROOM_MODEL') private readonly RoomModel: Model<Room>,
    private readonly usersService: UsersService
  ) {}

  async findById(id: string): Promise<Room | undefined> {
    return this.RoomModel.findById(id);
  }

  async findOne(name: string): Promise<Room | undefined> {
    return this.RoomModel.findOne({ name });
  }

  async findOneAndUpdate(name: string, update: object, options?: object): Promise<Room | undefined> {
    return this.RoomModel.findOneAndUpdate({ name }, update, options)
  }

  async create(createDto: CreateDto, user: JWTDecryptedDto) {
    const Player = await this.usersService.get(user);

    if (!createDto.name.match(/^[a-zA-Z ]+$/)) {
      throw new BadRequestException('Make sure the room name only contains alphabetic characters and spaces');
    }
    
    if (await this.findOne(createDto.name)) {
      throw new BadRequestException('This room name already exists');
    }
    
    const player = {
      ...Player,
      isReady: false
    };

    const createdRoom = new this.RoomModel({
      ...createDto,
      turn: {
        current: 0,
        playerId: ''
      },
      players: [player],
      chat: [{
        message: `${player.name} entrou na sala`,
        systemMessage: true,
        from: ''
      }],
      status: 'waiting'
    });

    await createdRoom.save();

    return createdRoom;
  }

  async enter(roomName: string, user: JWTDecryptedDto) {
    const Player = await this.usersService.get(user);

    if (!roomName.match(/^[a-zA-Z ]+$/)) {
      throw new BadRequestException('Make sure the room name only contains alphabetic characters and spaces');
    }

    const room = await this.findOne(roomName);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.players.find(player => player.email === Player.email)) {
      throw new BadRequestException('You already entered this room');
    }

    const player = {
      ...Player,
      isReady: false
    };
    const { players, chat } = room;
    players.push(player);
    chat.push({
      message: `${player.name} entrou na sala`,
      systemMessage: true,
      from: ''
    })

    const newRoom = await this.findOneAndUpdate(roomName, { players, chat }, {
      useFindAndModify: false,
      new: true
    });

    return newRoom;
  }

  async getById(id: string) {
    const room = await this.findById(id);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    return room;
  }

  async ready(id: string, user: JWTDecryptedDto) {
    const Room = await this.getById(id);

    const Player = await this.usersService.get(user);

    const { players } = Room;
    const actualPlayerIndex = players.findIndex(player => player.email === Player.email);
    players[actualPlayerIndex].isReady = true;

    const newRoom = await this.findOneAndUpdate(Room.name, { players }, {
      useFindAndModify: false,
      new: true
    });

    if (newRoom.players.every(player => player.isReady)) {
      return this.startGame(newRoom);
    }

    return newRoom;
  }

  async startGame(room: Room) {
    const { name, players } = room;
    console.log(randomIntFromInterval(0, 1));
    const playerId = players[randomIntFromInterval(0, 1)].email;

    return this.findOneAndUpdate(name, {
      status: 'started',
      turn: {
        current: 0,
        playerId
      }
    }, {
      useFindAndModify: false,
      new: true
    });
  }
}
