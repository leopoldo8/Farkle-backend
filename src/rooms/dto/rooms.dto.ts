import { IsNotEmpty, MaxLength, IsMongoId, IsArray, ArrayMinSize, ArrayMaxSize, IsInt, IsString } from 'class-validator';

export class CreateDto {
  @IsNotEmpty()
  @MaxLength(25)
  name: string;
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
