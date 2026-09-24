import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTicketTierDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori tiket tidak boleh kosong.' })
  name!: string;

  @IsNumber({}, { message: 'Harga tiket harus berupa angka.' })
  @Min(0, { message: 'Harga tiket tidak boleh negatif.' })
  price!: number;

  @IsInt({ message: 'Total kuota harus berupa bilangan bulat.' })
  @Min(1, { message: 'Total kuota minimal 1.' })
  totalQuota!: number;

  @IsOptional()
  @IsInt({
    message: 'Maksimum pembelian per pengguna harus berupa bilangan bulat.',
  })
  @Min(1, { message: 'Maksimum pembelian minimal 1.' })
  maxPerUser?: number = 4;

  // penggunaan schema untuk date disarankan menggunakan ini daripada @IsDateString
  // https://github.com/typestack/class-validator/issues/412
  @IsISO8601({}, { message: 'Format waktu mulai penjualan harus ISO 8601.' })
  salesStart!: string;

  @IsISO8601({}, { message: 'Format waktu akhir penjualan harus ISO 8601.' })
  salesEnd!: string;
}
