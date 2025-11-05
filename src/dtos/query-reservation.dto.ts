import { ApiPropertyOptional } from '@nestjs/swagger';

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
  reservation_id?: string;

  @ApiPropertyOptional({ 
    description: 'Initial date filter with optional operator (ex: initial_date={gteq}2025-10-19)' 
  })
  initial_date?: string;

  @ApiPropertyOptional({ 
    description: 'End date filter with optional operator (ex: end_date={lt}2025-10-30)' 
  })
  end_date?: string;

  @ApiPropertyOptional({ 
    description: 'Details filter with optional operator (ex: details={like}%reuniao%)' 
  })
  details?: string;

  @ApiPropertyOptional({ 
    description: 'Resource ID filter with optional operator (ex: resource_id=uuid)' 
  })
  resource_id?: string;

  @ApiPropertyOptional({ 
    description: 'Lesson ID filter with optional operator (ex: lesson_id=uuid)' 
  })
  lesson_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by logical deletion flag: deleted=true or deleted={neq}true (default is deleted=false)'
  })
  deleted?: string;
}