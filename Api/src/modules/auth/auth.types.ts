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

export interface EmailConfirmationResult {
  message: 'Email confirmed';
}

export interface ForgotPasswordResult {
  message: 'If an account exists for that email, a password reset link has been sent';
}

export interface ResetPasswordResult {
  message: 'Password reset successfully';
}
