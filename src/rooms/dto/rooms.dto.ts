import { IsNotEmpty, MaxLength, IsMongoId } from 'class-validator';

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
