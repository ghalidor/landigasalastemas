export interface UserPermissions {
  isGlobal: boolean;
  canPublish: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  permissions: UserPermissions;
  allowedVenueIds: number[];
}

export interface LoginResponse {
  token: string;
  expiraEn: string;
  usuario: AuthUser;
}

export interface Role {
  id: number;
  name: string;
  isGlobal: boolean;
  canPublish: boolean;
}

export interface ManagedUser {
  id: number;
  username: string;
  fullName: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  allowedVenueIds: number[];
}

export interface UsersResponse {
  users: ManagedUser[];
  roles: Role[];
}
