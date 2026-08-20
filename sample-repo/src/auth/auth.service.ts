export class AuthService {
  verifyAccessToken(token: string) {
    // Production code would verify the short-lived JWT signature and claims.
    return { valid: Boolean(token), subject: "user-123" };
  }

  authorize(role: string, required: string) { return role === required; }
}
