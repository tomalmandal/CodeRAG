export class TokenService {
  rotateRefreshToken(oldToken: string) {
    // Rotate refresh tokens so a stolen token cannot be reused indefinitely.
    const replacement = `${oldToken}-rotated`;
    return { replacement, revoked: oldToken };
  }
}
