export interface Room {
  _id: string;
  name: string;
  password?: string;
  turn: Turn;
  players: Player[];
  chat: Message[];
  status: 'waiting' | 'started' | 'finished';
  __v: number;
}

interface Turn {
  current: number;
  playerId: string;
}

export class Player {
  email?: string;
  name: string;
  exp?: number;
  isReady: boolean;
  score: number;
  dices: number;
  rolls: number[];
  bank: number;
}

export class Message {
  message: string;
  systemMessage: boolean;
  from: string;
}
