import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

export enum UserRole {
  ADMIN = 'admin',
  RESELLER = 'reseller',
  MEMBER = 'member'
}

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const Admin = () => Roles(UserRole.ADMIN);
export const Reseller = () => Roles(UserRole.RESELLER);
export const AdminOrReseller = () => Roles(UserRole.ADMIN, UserRole.RESELLER);

export const Authenticated = () => Roles(UserRole.ADMIN, UserRole.RESELLER, UserRole.MEMBER);