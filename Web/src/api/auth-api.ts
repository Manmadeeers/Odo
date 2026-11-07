import { apiRequest } from './http'

export interface AuthenticatedUser {
  id: string
  email: string
  emailVerified: boolean
}

export interface AuthSession {
  user: AuthenticatedUser
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

interface MessageResponse {
  message: string
}

interface RegistrationResponse extends MessageResponse {
  user: AuthenticatedUser
}

function post<T>(path: string, body?: object, accessToken?: string) {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  })
}

export const authApi = {
  register(email: string, password: string) {
    return post<RegistrationResponse>('/auth/register', { email, password })
  },

  login(email: string, password: string) {
    return post<AuthSession>('/auth/login', { email, password })
  },

  refresh(refreshToken: string) {
    return post<AuthSession>('/auth/refresh-token', { refreshToken })
  },

  logout(accessToken: string) {
    return post<MessageResponse>('/auth/logout', undefined, accessToken)
  },

  confirmEmail(token: string) {
    return post<MessageResponse>('/auth/confirm-email', { token })
  },

  resendVerificationEmail(email: string) {
    return post<MessageResponse>('/auth/resend-verification-email', { email })
  },

  forgotPassword(email: string) {
    return post<MessageResponse>('/auth/forgot-password', { email })
  },

  resetPassword(token: string, newPassword: string) {
    return post<MessageResponse>('/auth/reset-password', {
      token,
      newPassword,
    })
  },

  changePassword(
    accessToken: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return post<MessageResponse>(
      '/auth/change-password',
      { currentPassword, newPassword },
      accessToken,
    )
  },
}
