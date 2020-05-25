import { IsNotEmpty, MaxLength, IsMongoId, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize, IsInt } from 'class-validator';

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
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsInt({ each: true })
  dicesSelected: number[];
}
