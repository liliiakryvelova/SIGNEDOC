import type { CurrentUser, User } from '../../../../shared/types/entities.js';

export interface IAuthService {
  register(input: { name: string; email: string; password: string }): Promise<{ user: CurrentUser; accessToken: string }>;
  login(input: { email: string; password: string }): Promise<{ user: CurrentUser; accessToken: string }>;
  authenticate(authorization: string | null): Promise<CurrentUser | null>;
  getUser(id: string): Promise<User | null>;
}