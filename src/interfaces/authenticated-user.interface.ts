export interface AuthenticatedUser {
  id: string;
  username: string;
  email?: string;
  // Add other properties based on what your Keycloak gateway returns
  [key: string]: any;
}