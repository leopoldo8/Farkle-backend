import { Test, TestingModule } from '@nestjs/testing';
import { SheetsService } from './sheets.service';
import { Sheet } from './interfaces/sheet.interface';
import { SheetsController } from './sheets.controller';
import { SheetsProviders } from './sheets.providers';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';

describe('SheetsService', () => {
  let controller: SheetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, UsersModule],
      controllers: [SheetsController],
    }).compile();

    controller = module.get<SheetsController>(SheetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a valid sheet', async () => {
    const sheet: Sheet = await controller.create({
      start: new Date('1 13:00:00'),
      end: new Date('1 19:00:00')
    }, null, 8);

    const anotherSheet: Sheet = await controller.create({
      start: new Date('1 13:00:00'),
      end: new Date('1 19:00:00')
    }, null, 6);

    expect(sheet.hoursRemaining).toBe('02:00:00');
    expect(sheet.hoursExtra).toBe(false);
    expect(anotherSheet.hoursRemaining).toBe(false);
    expect(anotherSheet.hoursExtra).toBe(false);
  });
});
