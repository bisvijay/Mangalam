export type UserRole = "admin" | "manager" | "receptionist";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
}

export interface StaffList {
  users: User[];
}

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}
