import * as mongoose from 'mongoose';
import { mongodbURL } from '@common/secret';

export const databaseProviders = [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: async (): Promise<typeof mongoose> =>
      await mongoose.connect(mongodbURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        dbName: 'app'
      }),
  },
];
