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
    description: 'Status filter with optional operator (ex: status=Liberado or status={neq}Reservado)' 
  })
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Initial date filter with optional operator (ex: initial_date={gteq}2025-10-19)' 
  })
  initial_date?: string;

  @ApiPropertyOptional({ 
    description: 'Final date filter with optional operator (ex: final_date={lt}2025-10-30)' 
  })
  final_date?: string;

  @ApiPropertyOptional({ 
    description: 'Description filter with optional operator (ex: description={like}%reuniao%)' 
  })
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Quantity filter with optional operator (ex: quantity={lteq}2.5)' 
  })
  quantity?: string;
}