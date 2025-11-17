import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryOperator {
  static readonly EQ = '';  // default, no operator
  static readonly NEQ = '{neq}';
  static readonly GT = '{gt}';
  static readonly GTEQ = '{gteq}';
  static readonly LT = '{lt}';
  static readonly LTEQ = '{lteq}';
  static readonly LIKE = '{like}';
}

export class QueryReservationDto {
  @ApiPropertyOptional({ 
    description: 'Reservation ID filter with optional operator (ex: reservation_id=uuid or reservation_id={neq}uuid)' 
  })
    @IsOptional()
  @IsString()
  reservation_id?: string;

  @ApiPropertyOptional({ 
    description: 'Initial date filter with optional operator (ex: initial_date={gteq}2025-10-19)' 
  })
    @IsOptional()
  @IsString()
  initial_date?: string;

  @ApiPropertyOptional({ 
    description: 'End date filter with optional operator (ex: end_date={lt}2025-10-30)' 
  })
    @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({ 
    description: 'Details filter with optional operator (ex: details={like}%reuniao%)' 
  })
    @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({ 
    description: 'Resource ID filter with optional operator (ex: resource_id=uuid)' 
  })
    @IsOptional()
  @IsString()
  resource_id?: string;

  @ApiPropertyOptional({ 
    description: 'Lesson ID filter with optional operator (ex: lesson_id=uuid)' 
  })
    @IsOptional()
  @IsString()
  lesson_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by logical deletion flag: deleted=true or deleted={neq}true (default is deleted=false)'
  })
    @IsOptional()
  @IsString()
  deleted?: string;
}