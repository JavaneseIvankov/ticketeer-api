import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventStatus } from '../../../common/enums/index.js';
import { CreateTicketTierDto } from './create-tier.dto.js';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul acara tidak boleh kosong.' })
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Deskripsi acara tidak boleh kosong.' })
  description!: string;

  @IsString()
  @IsNotEmpty({ message: 'Lokasi acara tidak boleh kosong.' })
  venue!: string;

  @IsISO8601({}, { message: 'Format waktu acara harus ISO 8601.' })
  eventDate!: string;

  @IsOptional()
  @IsEnum(EventStatus, { message: 'Status acara tidak valid.' })
  status?: EventStatus = EventStatus.PUBLISHED;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketTierDto)
  tiers?: CreateTicketTierDto[];
}
