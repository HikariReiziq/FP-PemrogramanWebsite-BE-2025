export type IRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface IJwtPayload {
  id: string;
  user_id?: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  iat?: number;
  exp?: number;
}
