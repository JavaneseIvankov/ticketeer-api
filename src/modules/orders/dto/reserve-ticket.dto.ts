import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ReserveTicketDto {
  @IsInt({ message: 'Jumlah tiket harus berupa bilangan bulat.' })
  @Min(1, { message: 'Jumlah tiket minimal 1.' })
  @IsNotEmpty({ message: 'Jumlah tiket tidak boleh kosong.' })
  quantity!: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
