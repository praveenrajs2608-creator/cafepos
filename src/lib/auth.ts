import { NextRequest } from 'next/server';

export interface UserSessionPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function signJWT(payload: UserSessionPayload): string {
  const secret = process.env.JWT_SECRET || 'secret';
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Basic mock signature for development environment
  const signature = Buffer.from(`${headerStr}.${payloadStr}.${secret}`).toString('base64url');
  return `${headerStr}.${payloadStr}.${signature}`;
}

export function verifyJWT(token: string): UserSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payloadStr) as UserSessionPayload;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): UserSessionPayload | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyJWT(token);
  }
  const cookieToken = req.cookies.get('token')?.value;
  if (cookieToken) {
    return verifyJWT(cookieToken);
  }
  return null;
}
