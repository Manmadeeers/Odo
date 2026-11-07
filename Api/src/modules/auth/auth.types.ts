export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface AuthenticationResult {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
