export interface Room {
  _id: string;
  name: string;
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
  email: string;
  name: string;
  exp: number;
  isReady: boolean;
}

export class Message {
  message: string;
  systemMessage: boolean;
  from: string;
}
