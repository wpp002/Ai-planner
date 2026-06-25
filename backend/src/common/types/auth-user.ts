export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'SUPPORT';
};
