import { UserRole } from '../../users/entities/user.entity';

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
  };
}

export class RefreshResponseDto {
  access_token: string;
  refresh_token: string;
}
