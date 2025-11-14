import { createHash } from 'crypto';

export function generateRecoveryCodes(count: number): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let i = 0; i < count; i++) {
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

