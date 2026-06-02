/**
 * Forgot-password hooks.
 *
 * Backed by the public (no-JWT) backend endpoints:
 *   POST /api/password-reset            { email }
 *       Always returns a generic success - the server never reveals
 *       whether the email maps to an account (anti-enumeration).
 *   POST /api/password-reset/confirm    { token, newPassword }
 *       Consumes the single-use token from the emailed link and sets
 *       the new password. No old password required.
 *
 * These endpoints are reachable while logged out, so we hit them with
 * the shared axios client - the request interceptor simply sends no
 * Authorization header when there's no token.
 */
import { useMutation } from '@tanstack/react-query'
import { api } from './api'

/** Request a reset link by email. Resolves even for unknown emails. */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: async ({ email }) => {
      const res = await api.post('/api/password-reset', { email })
      return res.data
    },
  })
}

/**
 * Confirm a reset: consume the token + set the new password.
 *
 * Surfaces backend error messages verbatim so the form can show
 * things like "this reset link has expired" or "newPassword must be
 * at least 6 characters" without mapping status codes.
 */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: async ({ token, newPassword }) => {
      const res = await api.post('/api/password-reset/confirm', {
        token,
        newPassword,
      })
      return res.data
    },
  })
}
