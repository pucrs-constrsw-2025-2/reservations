import { IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorizedUserDto {
  @ApiProperty({ type: 'string', format: 'uuid', description: 'Identificador do usuário autorizado' })
  @IsString()
  user_id: string;

  @ApiProperty({ type: 'string', maxLength: 100, description: 'Nome do usuário autorizado' })
  @IsString()
  @MaxLength(100)
  name: string;
}

export class CreateAuthorizedUserDto {
  @ApiProperty({ type: 'string', format: 'uuid', description: 'Identificador do usuário autorizado' })
  @IsString()
  @IsUUID()
  user_id: string;

  @ApiProperty({ type: 'string', maxLength: 100, description: 'Nome do usuário autorizado' })
  @IsString()
  @MaxLength(100)
  name: string;
}

export class UpdateAuthorizedUserDto {
  @ApiProperty({ type: 'string', format: 'uuid', description: 'Identificador do usuário autorizado' })
  @IsString()
  user_id: string;

  @ApiProperty({ type: 'string', maxLength: 100, description: 'Nome do usuário autorizado' })
  @IsString()
  @MaxLength(100)
  name: string;
}

export class PatchAuthorizedUserDto {
  @ApiPropertyOptional({ type: 'string', format: 'uuid', description: 'Identificador do usuário autorizado' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 100, description: 'Nome do usuário autorizado' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}