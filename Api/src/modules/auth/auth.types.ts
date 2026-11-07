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

export interface RegistrationResult {
  user: AuthenticatedUser;
  message: 'Registration successful. Check your email to verify your account';
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

export type RefreshTokenResult = AuthenticationResult;

export interface LogoutResult {
  message: 'Logged out';
}

export interface ChangePasswordResult {
  message: 'Password changed successfully';
}

export interface ResendVerificationEmailResult {
  message: 'If an unverified account exists for that email, a verification link has been sent';
}

export interface AuthenticatedRequestUser extends AuthenticatedUser {
  sessionId: string;
}
