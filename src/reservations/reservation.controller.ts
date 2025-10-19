import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from '../dtos/create-reservation.dto';
import { UpdateReservationDto } from '../dtos/update-reservation.dto';
import { PatchReservationDto } from '../dtos/patch-reservation.dto';
import { QueryReservationDto } from '../dtos/query-reservation.dto';
import { AuthGuard } from '../guards/auth.guard'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reservation')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova reserva' })
  @ApiResponse({ status: 201, description: 'Reserva criada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação ausente, inválido ou expirado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Usuário não possui permissão para esta operação.' })
  @ApiBody({ type: CreateReservationDto })
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationService.create(createReservationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar reservas (com suporte a query string simples e complexa)' })
  @ApiResponse({ status: 200, description: 'Lista de reservas.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação ausente, inválido ou expirado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Usuário não possui permissão para esta operação.' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status (ex: status=Liberado ou status={neq}Reservado)' })
  @ApiQuery({ name: 'initial_date', required: false, description: 'Filtrar por data inicial (ex: initial_date={gteq}2025-10-19)' })
  @ApiQuery({ name: 'final_date', required: false, description: 'Filtrar por data final (ex: final_date={lt}2025-10-30)' })
  @ApiQuery({ name: 'description', required: false, description: 'Filtrar por descrição (ex: description={like}%reuniao%)' })
  @ApiQuery({ name: 'quantity', required: false, description: 'Filtrar por quantidade (ex: quantity={lteq}2.5)' })
  findAll(@Query() query: QueryReservationDto) {
    return this.reservationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar reserva por ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID da reserva' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação ausente, inválido ou expirado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Usuário não possui permissão para esta operação.' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.reservationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar totalmente uma reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID da reserva' })
  @ApiBody({ type: UpdateReservationDto })
  @ApiResponse({ status: 200, description: 'Reserva atualizada.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação ausente, inválido ou expirado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Usuário não possui permissão para esta operação.' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada.' })
  update(@Param('id') id: string, @Body() updateReservationDto: UpdateReservationDto) {
    return this.reservationService.update(id, updateReservationDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar parcialmente uma reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID da reserva' })
  @ApiBody({ type: PatchReservationDto })
  @ApiResponse({ status: 200, description: 'Reserva parcialmente atualizada.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação ausente, inválido ou expirado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Usuário não possui permissão para esta operação.' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada.' })
  patch(@Param('id') id: string, @Body() patchReservationDto: PatchReservationDto) {
    return this.reservationService.patch(id, patchReservationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID da reserva' })
  @ApiResponse({ status: 200, description: 'Reserva removida.' })
  @ApiResponse({ status: 401, description: 'Token de autenticação ausente, inválido ou expirado.' })
  @ApiResponse({ status: 403, description: 'Acesso negado. Usuário não possui permissão para esta operação.' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada.' })
  remove(@Param('id') id: string) {
    return this.reservationService.remove(id);
  }
}
