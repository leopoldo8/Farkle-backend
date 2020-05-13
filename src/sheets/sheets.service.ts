import { Inject, Injectable } from '@nestjs/common';
import { Sheet } from './interfaces/sheet.interface';
import { UsersService } from '../users/users.service';
import { CreateDto } from './dto/sheet.dto';
import { formatMilliseconds, hoursToMilliseconds, formatedToMilliseconds } from '@common/utils';
import { JWTDecryptedDto } from '@common/dto/jwt.dto';
import { Model } from 'mongoose';

@Injectable()
export class SheetsService {
  constructor(
    @Inject('SHEET_MODEL') private readonly sheetModel: Model<Sheet>,
    private readonly usersService: UsersService
  ) {}

  async list(userId: string): Promise<Sheet[]> {
    return this.sheetModel.find({ userId })
  }

  async getHoursToday(userId: string) {
    const user = await this.usersService.findById(userId);
    const sheets = await this.list(userId);
    let totalMilli: number = 0;

    sheets.forEach(({ hoursExtra, hoursRemaining }) => {
      if (hoursRemaining && typeof hoursRemaining == 'string') {
        totalMilli += formatedToMilliseconds(hoursRemaining);
      }

      if (hoursExtra && typeof hoursExtra == 'string') {
        totalMilli -= formatedToMilliseconds(hoursExtra);
      }
    });

    const todayTime = hoursToMilliseconds(user.hoursPerDay) + totalMilli;
    return formatMilliseconds(todayTime);
  }

  async create(createDto: CreateDto, userInfo?: JWTDecryptedDto, hoursPerDay?: number) {
    const { end, start, breaks: breaksCreateDto } = createDto;
    const { userId = null } = userInfo;
    let userHoursPerDay = hoursPerDay;

    if(userInfo) {
      userHoursPerDay = (await this.usersService.findById(userId)).hoursPerDay;
    }

    let breaksDuration: number = 0;
    let breaks = null;

    if (breaksCreateDto) {
      breaks = breaksCreateDto.map(breakItem => {
        const diffDate = breakItem.end.getTime() - breakItem.start.getTime();
        breakItem.duration = formatMilliseconds(diffDate);
        breaksDuration += diffDate;
  
        return breakItem;
      });
    }

    const day = start.getDay();

    const diffDate = end.getTime() - start.getTime();
    const diffHours = diffDate - breaksDuration;
    const totalHours = formatMilliseconds(diffHours);

    const milliRemaining = hoursToMilliseconds(userHoursPerDay) - diffHours;
    const hoursRemaining = milliRemaining > 0 && formatMilliseconds(milliRemaining);

    const milliExtra = diffHours - hoursToMilliseconds(userHoursPerDay);
    const hoursExtra = milliExtra > 0 && formatMilliseconds(milliExtra);

    const createdRoom = new this.sheetModel({
      ...createDto,
      userId,
      breaks,
      totalHours,
      hoursRemaining,
      hoursExtra,
      day,
    });

    return createdRoom.save();
  }
}
