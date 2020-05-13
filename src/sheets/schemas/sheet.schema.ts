import * as mongoose from 'mongoose';

export const BreakSchema = new mongoose.Schema({
  start: {
    required: true,
    type: Date
  },
  end: {
    required: true,
    type: Date,
  }
});

export const SheetSchema = new mongoose.Schema({
  start: {
    required: true,
    type: Date
  },
  end: {
    required: true,
    type: Date
  },
  breaks: [BreakSchema],
  totalHours: {
    required: true,
    type: String
  },
  HoursRemaining: {
    required: true,
    type: String
  },
  HoursExtra: {
    required: true,
    type: String
  },
  day: {
    required: true,
    type: String
  }
});
