export interface User {
  id: string; // 'sub' từ JWT
  name: string; // 'name' hoặc 'preferred_username' từ JWT
  avatarUrl?: string; // Sẽ phát triển sau
}