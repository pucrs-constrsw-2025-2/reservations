import { Controller, Get, Post, Put, Patch, Delete, Param, Body } from '@nestjs/common';
import { AuthorizedUserService } from './authorized-user.service';
import { CreateAuthorizedUserDto, UpdateAuthorizedUserDto, PatchAuthorizedUserDto } from './dtos/authorized-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Authorized Users')
@Controller('reservations/:reservationId/authorized-users')
export class AuthorizedUserController {
  constructor(private readonly authorizedUserService: AuthorizedUserService) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar usuário autorizado à reserva' })
  @ApiParam({ name: 'reservationId', type: 'string', description: 'ID da reserva' })
  @ApiBody({ type: CreateAuthorizedUserDto })
  @ApiResponse({ status: 201, description: 'Usuário autorizado adicionado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada.' })
  create(
    @Param('reservationId') reservationId: string,
    @Body() createAuthorizedUserDto: CreateAuthorizedUserDto
  ) {
    return this.authorizedUserService.addToReservation(reservationId, createAuthorizedUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários autorizados de uma reserva' })
  @ApiParam({ name: 'reservationId', type: 'string', description: 'ID da reserva' })
  @ApiResponse({ status: 200, description: 'Lista de usuários autorizados retornada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Reserva não encontrada.' })
  findAll(@Param('reservationId') reservationId: string) {
    return this.authorizedUserService.findByReservation(reservationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário autorizado específico por ID' })
  @ApiParam({ name: 'reservationId', type: 'string', description: 'ID da reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do usuário autorizado' })
  @ApiResponse({ status: 200, description: 'Usuário autorizado encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuário autorizado ou reserva não encontrada.' })
  findOne(
    @Param('reservationId') reservationId: string,
    @Param('id') id: string
  ) {
    return this.authorizedUserService.findOne(reservationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar completamente um usuário autorizado' })
  @ApiParam({ name: 'reservationId', type: 'string', description: 'ID da reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do usuário autorizado' })
  @ApiBody({ type: UpdateAuthorizedUserDto })
  @ApiResponse({ status: 200, description: 'Usuário autorizado atualizado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário autorizado ou reserva não encontrada.' })
  update(
    @Param('reservationId') reservationId: string,
    @Param('id') id: string,
    @Body() updateAuthorizedUserDto: UpdateAuthorizedUserDto
  ) {
    return this.authorizedUserService.update(reservationId, id, updateAuthorizedUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar parcialmente um usuário autorizado' })
  @ApiParam({ name: 'reservationId', type: 'string', description: 'ID da reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do usuário autorizado' })
  @ApiBody({ type: PatchAuthorizedUserDto })
  @ApiResponse({ status: 200, description: 'Usuário autorizado atualizado parcialmente com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário autorizado ou reserva não encontrada.' })
  patch(
    @Param('reservationId') reservationId: string,
    @Param('id') id: string,
    @Body() patchAuthorizedUserDto: PatchAuthorizedUserDto
  ) {
    return this.authorizedUserService.patch(reservationId, id, patchAuthorizedUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário autorizado da reserva' })
  @ApiParam({ name: 'reservationId', type: 'string', description: 'ID da reserva' })
  @ApiParam({ name: 'id', type: 'string', description: 'ID do usuário autorizado' })
  @ApiResponse({ status: 200, description: 'Usuário autorizado removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Usuário autorizado ou reserva não encontrada.' })
  remove(
    @Param('reservationId') reservationId: string,
    @Param('id') id: string
  ) {
    return this.authorizedUserService.remove(reservationId, id);
  }
}