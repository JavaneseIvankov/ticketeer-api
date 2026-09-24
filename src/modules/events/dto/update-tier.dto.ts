import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketTierDto } from './create-tier.dto.js';

// untuk melakukan Partial<T> dengan menggunakan class, kita bisa memakai libary ini
export class UpdateTicketTierDto extends PartialType(CreateTicketTierDto) {}
