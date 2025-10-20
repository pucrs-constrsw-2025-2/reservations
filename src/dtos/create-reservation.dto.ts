import { IsString, IsDateString, IsOptional, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorizedUserDto } from './authorized-user.dto';

export class CreateReservationDto {
  @ApiProperty({ type: 'string', format: 'date', description: 'Data de início da reserva (YYYY-MM-DD)' })
  @IsDateString()
  initial_date: string;

  @ApiProperty({ type: 'string', format: 'date', description: 'Data de término da reserva (YYYY-MM-DD)' })
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 1000, description: 'Detalhes adicionais da reserva' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @ApiPropertyOptional({ type: [AuthorizedUserDto], description: 'Lista de usuários autorizados a acessar a reserva' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorizedUserDto)
  authorizedUsers?: AuthorizedUserDto[];

  @ApiPropertyOptional({ type: 'string', format: 'uuid', description: 'ID do recurso dessa reserva' })
  @IsOptional()
  resource_id?: string;

  @ApiPropertyOptional({ type: 'string', format: 'uuid', description: 'ID da aula dessa reserva' })
  @IsOptional()
  lesson_id?: string;
}
