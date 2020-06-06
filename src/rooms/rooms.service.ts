import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Room } from './interfaces/room.interface';
import { CreateDto } from './dto/rooms.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/interfaces/user.interface';
import { JWTDecryptedDto } from '../common/dto/jwt.dto';
import { Model } from 'mongoose';
import { randomIntFromInterval } from '../common/utils';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('ROOM_MODEL') private readonly RoomModel: Model<Room>,
    private readonly usersService: UsersService,
  ) {}

  async findById(id: string): Promise<Room | undefined> {
    return this.RoomModel.findById(id);
  }

  async findOne(name: string): Promise<Room | undefined> {
    return this.RoomModel.findOne({ name });
  }

  async findOneAndUpdate(name: string, update: object, options?: object): Promise<Room | undefined> {
    return this.RoomModel.findOneAndUpdate({ name }, update, options);
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
      isReady: false,
      score: 0,
      dices: 6,
      rolls: [],
      bank: 0,
    };

    const createdRoom = new this.RoomModel({
      ...createDto,
      turn: {
        current: 0,
        playerId: '',
      },
      players: [player],
      chat: [{
        message: `${player.name} entrou na sala`,
        systemMessage: true,
        from: '',
      }],
      status: 'waiting',
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

    if (room.players.find((roomPlayer) => roomPlayer.email === Player.email)) {
      throw new BadRequestException('You already entered this room');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('This room already started or finished');
    }

    if (room.players.length > 1) {
      throw new BadRequestException('This room is full');
    }

    const player = {
      ...Player,
      isReady: false,
      score: 0,
      dices: 6,
      rolls: [],
      bank: 0,
    };
    const { players, chat } = room;
    players.push(player);
    chat.push({
      message: `${player.name} entrou na sala`,
      systemMessage: true,
      from: '',
    });

    const newRoom = await this.findOneAndUpdate(roomName, { players, chat }, {
      useFindAndModify: false,
      new: true,
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

  async leave(room: Room, user: User) {
    const { players } = room;

    const newPlayers = players.filter((player) => player.email !== user.email);

    if (players.length === newPlayers.length) {
      throw new BadRequestException('You are not in this room');
    }

    const newRoom = await this.findOneAndUpdate(room.name, { players: newPlayers }, {
      useFindAndModify: false,
      new: true,
    });

    return newRoom;
  }

  async ready(room: Room, user: User) {
    const { players } = room;
    const actualPlayerIndex = players.findIndex((player) => player.email === user.email);
    if (actualPlayerIndex === -1) {
      throw new BadRequestException('You are not in this room');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('This room already started or finished');
    }

    players[actualPlayerIndex].isReady = true;

    const newRoom = await this.findOneAndUpdate(room.name, { players }, {
      useFindAndModify: false,
      new: true,
    });

    if (newRoom.players.every((player) => player.isReady)) {
      return this.startGame(newRoom);
    }

    return newRoom;
  }

  async unready(room: Room, user: User) {
    const { players } = room;
    const actualPlayerIndex = players.findIndex((player) => player.email === user.email);
    if (actualPlayerIndex === -1) {
      throw new BadRequestException('You are not in this room');
    }

    if (room.status !== 'waiting') {
      throw new BadRequestException('This room already started or finished');
    }

    players[actualPlayerIndex].isReady = false;

    const newRoom = await this.findOneAndUpdate(room.name, { players }, {
      useFindAndModify: false,
      new: true,
    });

    return newRoom;
  }

  async startGame(room: Room) {
    const { name, players } = room;
    const playerId = players[randomIntFromInterval(0, 1)].email;

    return this.findOneAndUpdate(name, {
      status: 'started',
      turn: {
        current: 1,
        playerId,
      },
    }, {
      useFindAndModify: false,
      new: true,
    });
  }

  async getIndexAndVerify(room: Room, user: User) {
    const indexPlayer = room.players.findIndex((player) => player.email === user.email);

    if (room.status !== 'started') {
      throw new BadRequestException('This room did not started or already have finished the game');
    }

    if (indexPlayer === -1) {
      throw new BadRequestException('You are not in this room');
    }

    if (user.email !== room.turn.playerId) {
      throw new BadRequestException('It is not your turn');
    }

    const Player = room.players[indexPlayer];

    return { indexPlayer, Player };
  }

  async rollDice(room: Room, user: User) {
    const { indexPlayer, Player } = await this.getIndexAndVerify(room, user);

    const { dices } = Player;

    const rolls = new Array(dices).map(() => randomIntFromInterval(1, 6));

    const maxScore = this.getScore(rolls);

    if (maxScore === 0) {
      return this.skipTurn(room, true);
    }

    const { players } = room;
    players[indexPlayer].rolls = rolls;
    await this.findOneAndUpdate(room.name, { players }, {
      useFindAndModify: false,
    });

    return { hasFarkle: false, data: rolls };
  }

  async bank(room: Room, user: User) {
    await this.getIndexAndVerify(room, user);
    return this.skipTurn(room);
  }

  async chat(message: string, room: Room, user: User) {
    const indexPlayer = room.players.findIndex((player) => player.email === user.email);

    if (indexPlayer === -1) {
      throw new BadRequestException('You are not in this room');
    }

    const { chat } = room;
    chat.push({
      message,
      systemMessage: true,
      from: user.name,
    });

    const { chat: newChat } = await this.findOneAndUpdate(room.name, { chat }, {
      useFindAndModify: false,
      new: true,
    });

    return newChat;
  }

  async skipTurn(room: Room, hasFarkle?: boolean) {
    const current = room.turn.current + 1;
    const playerId = room.players.find((player) => player.email !== room.turn.playerId).email;

    const { players } = room;
    const indexPlayer = players.findIndex((player) => player.email === room.turn.playerId);
    players[indexPlayer].dices = 6;
    players[indexPlayer].rolls = [];
    if (!hasFarkle) {
      players[indexPlayer].bank += players[indexPlayer].score;
    }
    players[indexPlayer].score = 0;

    const newRoom = await this.findOneAndUpdate(room.name, {
      turn: {
        current,
        playerId,
      },
      players,
    }, {
      useFindAndModify: false,
      new: true,
    });

    return { hasFarkle, data: newRoom };
  }

  async score(dicesSelected: number[], room: Room, user: User) {
    const { indexPlayer } = await this.getIndexAndVerify(room, user);

    const { dices, rolls } = room.players[indexPlayer];

    if (rolls.length) {
      throw new BadRequestException('You did not roll the dices');
    }

    if (dicesSelected.every((dice) => rolls.includes(dice))) {
      throw new BadRequestException('You did not roll one of these dices');
    }

    let hasNoScoringDice = true;

    dicesSelected.forEach((dice) => {
      if (dicesSelected.filter((eachDice) => eachDice === dice).length > 2 || dice === 1 || dice === 5) {
        hasNoScoringDice = false;
      }
    });

    if (hasNoScoringDice) {
      throw new BadRequestException('One of these dices has no scoring possibilities');
    }

    const score = this.getScore(dicesSelected);

    const { players } = room;
    const newDices = dices - dicesSelected.length;
    players[indexPlayer].dices = newDices > 0 ? newDices : 6;
    players[indexPlayer].score += score;

    this.findOneAndUpdate(room.name, { players }, {
      useFindAndModify: false,
      new: true,
    });

    return players[indexPlayer];
  }

  getScore(dices: number[]) {
    let score = 0;
    const threeOfKind = {
      1: 1000,
      2: 200,
      3: 300,
      4: 400,
      5: 500,
      6: 600,
    };

    if (dices.every((n, i) => n === (dices[i - 1] || 0) + 1)) { // 1-6
      return 1500;
    }

    const dicesSet = dices.reduce((acc, item) => Object.keys(acc).includes(item.toString()) ? (acc[item] += 1) && acc : (acc[item] = 1) && acc, {});
    for (let i = 1; i <= 6; i++) {
      if (dicesSet[i] === 6) { // Six of a kind
        return threeOfKind[i] * 4;
      }

      if (dicesSet[i] > 2) {
        if (dicesSet[i] === 5) { // Five of a kind
          score += threeOfKind[i] * 3;
        } else if (dicesSet[i] === 4) { // Four of a kind
          score += threeOfKind[i] * 2;
        } else if (dicesSet[i] === 3) { // Three of a kind
          score += threeOfKind[i];
        }

        dices = dices.filter((dice) => dice !== i);
      }
    }

    score += dices.filter((dice) => dice === 5).length * 50; // single 5
    score += dices.filter((dice) => dice === 1).length * 100; // single 1

    return score;
  }
}
