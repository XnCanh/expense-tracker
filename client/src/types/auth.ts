export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AppUser;
  requiresWalletSetup: boolean;
}
