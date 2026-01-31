import { realAuthApi } from '../real';
import type { LoginRequest, LoginResponse, User } from '../../types';

export const authApi = {
  login: (credentials: LoginRequest): Promise<LoginResponse> => {
    return realAuthApi.login(credentials);
  },

  me: (): Promise<User> => {
    return realAuthApi.me();
  },

  logout: (): Promise<void> => {
    return realAuthApi.logout();
  },
};
