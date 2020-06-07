import * as mongoose from 'mongoose';
import { Player, Message } from '../interfaces/room.interface';

export const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  status: {
    type: String,
    enum: ['waiting', 'started', 'finished'],
    default: 'waiting'
  },
  turn: {
    current: {
      type: Number,
      default: 0
    },
    playerId: {
      type: String
    }
  },
  players: {
    type: Array,
    of: Player
  },
  chat: {
    type: Array,
    of: Message
  }
});
