# Authentication Setup

This API now requires Bearer token authentication for all endpoints. The authentication is validated through a Keycloak gateway.

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Keycloak Gateway Configuration
KEYCLOAK_GATEWAY_URL=http://localhost:3000
KEYCLOAK_ME_ENDPOINT=/me

# Application Configuration
PORT=3001
```

## How It Works

1. All endpoints now require an `Authorization` header with a Bearer token:

   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. The application validates the token by making a request to the Keycloak gateway:
   - URL: `${KEYCLOAK_GATEWAY_URL}${KEYCLOAK_ME_ENDPOINT}`
   - Method: GET
   - Headers: `Authorization: Bearer <token>`

3. If the token is valid, the user information returned from the gateway is stored in the request object and can be accessed in controllers using the `@User()` decorator.

## API Documentation

The Swagger documentation is available at `/api` and includes Bearer authentication support. You can:

1. Click the "Authorize" button in the Swagger UI
2. Enter your Bearer token
3. Test the endpoints directly from the documentation

## Example Usage

```bash
# Example API call with authentication
curl -X GET "http://localhost:3001/reservation" \
  -H "Authorization: Bearer your-jwt-token-here" \
  -H "Content-Type: application/json"
```

## Error Responses

- `401 Unauthorized`: Missing or invalid Authorization header
- `401 Unauthorized`: Token validation failed at Keycloak gateway

## Development Notes

- The `AuthGuard` is applied globally to all controllers
- User information from the Keycloak gateway is available via the `@User()` decorator
- HTTP timeout for gateway requests is set to 5 seconds
- All authentication-related configurations are loaded from environment variables
