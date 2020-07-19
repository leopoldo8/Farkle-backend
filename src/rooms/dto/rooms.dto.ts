import { IsNotEmpty, MaxLength, IsMongoId, IsArray, ArrayMinSize, ArrayMaxSize, IsInt, IsString, IsOptional } from 'class-validator';

export class CreateDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  roomName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  username: string;

  @IsString()
  @MaxLength(16)
  roomPassword: string;
}

export class EnterDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  roomName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(25)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  roomPassword: string;
}

export class ReadyDto {
  @IsNotEmpty()
  @IsMongoId()
  id: string;
}

export class ScoreDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  dicesSelected: number[];
}

export class MessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(350)
  message: string;
}
