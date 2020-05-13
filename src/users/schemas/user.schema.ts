import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  email: {
    required: true,
    type: String,
  },
  name: {
    required: true,
    type: String,
  },
  exp: {
    required: true,
    type: Number,
  },
  password: {
    required: true,
    type: String,
  }
});
