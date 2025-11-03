# Reservations API

**Microservice de Gerenciamento de Reservas** desenvolvido com [NestJS](https://nestjs.com/) e TypeScript.

## Descrição

API RESTful para gerenciamento de reservas de recursos vinculados a aulas. Suporta operações CRUD completas com validação de dados, autenticação via OAuth (Keycloak Gateway) e consultas avançadas com operadores personalizados.

## 🔐 Autenticação

**IMPORTANTE:** Todos os endpoints requerem autenticação via Bearer token JWT obtido através do **OAuth Service (Keycloak Gateway)**.

### Fluxo de Autenticação

1. **Obter token** através do OAuth service (`/login` endpoint)
2. **Incluir token** no header `Authorization: Bearer <token>` em todas as requisições
3. O **AuthGuard** valida o token automaticamente via `POST http://{OAUTH_INTERNAL_HOST}:{OAUTH_INTERNAL_API_PORT}/validate`

### Variáveis de Ambiente Necessárias

```bash
# OAuth Service Configuration
OAUTH_INTERNAL_HOST=localhost
OAUTH_INTERNAL_API_PORT=3000

# Database Configuration
POSTGRESQL_HOST=localhost
POSTGRESQL_PORT=5432
POSTGRESQL_USER=postgres
POSTGRESQL_PASSWORD=postgres
POSTGRESQL_DB=reservations

# Application Configuration
PORT=8080
```

## 📁 Estrutura do Projeto

```
src/
├── app.module.ts                    # Módulo raiz da aplicação
├── main.ts                          # Ponto de entrada (bootstrap + Swagger)
├── health.controller.ts             # Health check endpoint
├── authorized-user/                 # Módulo de usuários autorizados
│   ├── authorized-user.controller.ts
│   └── authorized-user.service.ts
├── decorators/                      # Custom decorators
│   └── user.decorator.ts
├── dtos/                           # Data Transfer Objects
│   ├── authorized-user.dto.ts
│   ├── create-reservation.dto.ts
│   ├── update-reservation.dto.ts
│   ├── patch-reservation.dto.ts
│   └── query-reservation.dto.ts
├── entities/                       # TypeORM Entities
│   ├── authorized-user.entity.ts
│   └── reservation.entity.ts
├── guards/                         # Authentication Guards
│   ├── auth.guard.ts
│   └── auth.guard.spec.ts
├── interfaces/                     # TypeScript Interfaces
└── reservations/                   # Módulo principal de reservas
    ├── reservation.controller.ts   # REST endpoints
    ├── reservation.service.ts      # Business logic
    ├── reservation.module.ts
    └── reservation.service.spec.ts # Unit tests
```

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 14
- OAuth Service (Keycloak Gateway) em execução

### Setup

```bash
No repositório base use o docker-compose.yml para subir o container reservations com suas dependências.
```

### Acessar Documentação Swagger

Após iniciar a aplicação, acesse:

**http://localhost:8086/api**

A documentação interativa Swagger permite:

- ✅ Visualizar todos os endpoints
- ✅ Testar requisições diretamente
- ✅ Autenticar com Bearer token (clique no botão "Authorize")
- ✅ Ver schemas de request/response

## 📋 Endpoints Disponíveis

### Health Check

```http
GET /health
```

Retorna o status da aplicação (não requer autenticação).

### Reservations

Todos os endpoints abaixo requerem autenticação via Bearer token:

| Método   | Endpoint           | Descrição                                 |
| -------- | ------------------ | ----------------------------------------- |
| `POST`   | `/reservation`     | Criar nova reserva                        |
| `GET`    | `/reservation`     | Listar reservas (suporta query operators) |
| `GET`    | `/reservation/:id` | Buscar reserva por ID                     |
| `PUT`    | `/reservation/:id` | Atualizar reserva (substituição completa) |
| `PATCH`  | `/reservation/:id` | Atualizar reserva (parcial)               |
| `DELETE` | `/reservation/:id` | Remover reserva                           |

### Authorized Users

| Método   | Endpoint               | Descrição                     |
| -------- | ---------------------- | ----------------------------- |
| `POST`   | `/authorized-user`     | Criar novo usuário autorizado |
| `GET`    | `/authorized-user`     | Listar usuários autorizados   |
| `GET`    | `/authorized-user/:id` | Buscar usuário por ID         |
| `PUT`    | `/authorized-user/:id` | Atualizar usuário             |
| `PATCH`  | `/authorized-user/:id` | Atualizar usuário (parcial)   |
| `DELETE` | `/authorized-user/:id` | Remover usuário               |

## 🔍 Query Operators

O endpoint `GET /reservation` suporta filtros avançados:

### Operadores Disponíveis

| Operador                  | Sintaxe                 | Descrição                        | Exemplo                         |
| ------------------------- | ----------------------- | -------------------------------- | ------------------------------- |
| **Equals**                | `field=value`           | Igualdade exata                  | `resource_id=uuid-123`          |
| **Not Equal**             | `field={neq}value`      | Diferente de                     | `resource_id={neq}uuid-123`     |
| **Greater Than**          | `field={gt}value`       | Maior que                        | `initial_date={gt}2025-10-01`   |
| **Greater Than or Equal** | `field={gteq}value`     | Maior ou igual                   | `initial_date={gteq}2025-10-01` |
| **Less Than**             | `field={lt}value`       | Menor que                        | `end_date={lt}2025-12-31`       |
| **Less Than or Equal**    | `field={lteq}value`     | Menor ou igual                   | `end_date={lteq}2025-12-31`     |
| **Like**                  | `field={like}%pattern%` | Busca parcial (case-insensitive) | `details={like}%reunião%`       |

### Exemplos de Query

```bash
# Buscar reservas de um recurso específico
GET /reservation?resource_id=abc-123

# Reservas a partir de 19/10/2025
GET /reservation?initial_date={gteq}2025-10-19

# Reservas que terminam antes de 31/12/2025
GET /reservation?end_date={lt}2025-12-31

# Detalhes contendo "reunião" (case-insensitive)
GET /reservation?details={like}%reunião%

# Combinar múltiplos filtros
GET /reservation?resource_id=abc-123&initial_date={gteq}2025-10-19&details={like}%sala%
```

## 🧪 Testes

```bash
# Unit tests
npm run test

# Unit tests com watch
npm run test:watch

# E2E tests (requer PostgreSQL em execução)
npm run test:e2e

# Coverage report
npm run test:cov

# PowerShell script para E2E com setup automático
.\run-tests.ps1
```

### Executar Testes com SonarQube

```powershell
# A partir de backend/utils/sonarqube
.\run-reservations-sonar.ps1
```

Este script:

1. Executa unit tests com coverage
2. Gera relatórios lcov e JUnit XML
3. Envia resultados para SonarQube

## 🐳 Docker

O projeto inclui um `Dockerfile` pronto para produção:

```bash
# Build da imagem
docker build -t reservations-api .

# Executar container
docker run -p 8080:8080 --env-file .env reservations-api
```

## 📚 Documentação Adicional

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Detalhes completos sobre autenticação OAuth/Keycloak
- [TEST_README.md](./TEST_README.md) - Guia detalhado de testes e2e
- [Swagger UI](http://localhost:8080/api) - Documentação interativa da API

## 🛠️ Tecnologias Utilizadas

- **Framework:** NestJS 11
- **Linguagem:** TypeScript 5.7
- **ORM:** TypeORM 0.3
- **Database:** PostgreSQL 14+
- **Validação:** class-validator + class-transformer
- **Documentação:** Swagger/OpenAPI
- **Auth:** JWT via OAuth Service (Keycloak Gateway)
- **HTTP Client:** Axios (via @nestjs/axios)
- **Testes:** Jest + Supertest

## 🔧 Scripts Disponíveis

| Script              | Descrição                   |
| ------------------- | --------------------------- |
| `npm run start`     | Inicia em modo produção     |
| `npm run start:dev` | Inicia com hot-reload       |
| `npm run build`     | Build para produção         |
| `npm run test`      | Executa unit tests          |
| `npm run test:cov`  | Executa tests com coverage  |
| `npm run test:e2e`  | Executa testes end-to-end   |
| `npm run lint`      | Executa ESLint              |
| `npm run format`    | Formata código com Prettier |

## ⚠️ Notas Importantes

1. **Sincronização de Schema:** O TypeORM está configurado com `synchronize: true` para desenvolvimento. **Em produção, use migrações!**

2. **Autenticação Obrigatória:** Todos os endpoints (exceto `/health`) requerem Bearer token válido do OAuth service.

3. **Variáveis de Ambiente:** Copie `.env.example` para `.env` e ajuste conforme seu ambiente.

4. **OAuth Service:** Certifique-se de que o OAuth service esteja rodando em `http://{OAUTH_INTERNAL_HOST}:{OAUTH_INTERNAL_API_PORT}` antes de iniciar esta aplicação.

## 📞 Contato e Suporte

Para questões sobre o NestJS framework:

- [Documentação NestJS](https://docs.nestjs.com)
- [Discord](https://discord.gg/G7Qnnhy)

## 📄 Licença

Este projeto utiliza o framework NestJS que é [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
