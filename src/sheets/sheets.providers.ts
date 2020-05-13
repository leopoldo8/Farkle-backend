import { Connection } from 'mongoose';
import { SheetSchema } from './schemas/sheet.schema';

export const SheetsProviders = [
  {
    provide: 'SHEET_MODEL',
    useFactory: (connection: Connection) => connection.model('Sheet', SheetSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
