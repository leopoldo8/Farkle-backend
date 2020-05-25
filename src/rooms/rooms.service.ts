import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Room } from './interfaces/room.interface';
import { CreateDto, ScoreDto } from './dto/rooms.dto';
import { UsersService } from '../users/users.service';
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

  async ready(id: string, user: JWTDecryptedDto) {
    const room = await this.getById(id);
    const Player = await this.usersService.get(user);

    const { players } = room;
    const actualPlayerIndex = players.findIndex((player) => player.email === Player.email);
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

  async unready(id: string, user: JWTDecryptedDto) {
    const room = await this.getById(id);
    const Player = await this.usersService.get(user);

    const { players } = room;
    const actualPlayerIndex = players.findIndex((player) => player.email === Player.email);
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

  async getIndexAndVerify(id: string, user: JWTDecryptedDto) {
    const room = await this.getById(id);
    const User = await this.usersService.get(user);

    const indexPlayer = room.players.findIndex((player) => player.email === User.email);

    if (room.status !== 'started') {
      throw new BadRequestException('This room did not started or already have finished the game');
    }

    if (indexPlayer === -1) {
      throw new BadRequestException('You are not in this room');
    }

    if (User.email !== room.turn.playerId) {
      throw new BadRequestException('It is not your turn');
    }

    const Player = room.players[indexPlayer];

    return { indexPlayer, room, User, Player };
  }

  async rollDice(id: string, user: JWTDecryptedDto) {
    const { room, indexPlayer, Player } = await this.getIndexAndVerify(id, user);

    const { dices } = Player;

    const rolls = new Array(dices).map(() => randomIntFromInterval(1, 6));

    const maxScore = this.getScore(rolls);

    if (maxScore === 0) {
      await this.skipTurn(room, true);
      return 'Farkle';
    }

    const { players } = room;
    players[indexPlayer].rolls = rolls;
    await this.findOneAndUpdate(room.name, { players }, {
      useFindAndModify: false,
    });

    return rolls;
  }

  async skipTurn(room: Room, hasFarkle?: boolean) {
    const current = room.turn.current + 1;
    const playerId = room.players.find((player) => player.email !== room.turn.playerId).email;

    const { players } = room;
    const indexPlayer = players.findIndex((player) => player.email === room.turn.playerId);
    players[indexPlayer].dices = 6;
    players[indexPlayer].rolls = [];
    if (!hasFarkle) { players[indexPlayer].bank += players[indexPlayer].score; }
    players[indexPlayer].score = 0;

    return this.findOneAndUpdate(room.name, {
      turn: {
        current,
        playerId,
      },
      players,
    }, {
      useFindAndModify: false,
      new: true,
    });
  }

  async score(dicesSelected: number[], id: string, user: JWTDecryptedDto) {
    const { room, indexPlayer } = await this.getIndexAndVerify(id, user);

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
