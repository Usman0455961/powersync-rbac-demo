// src/library/powersync/AppSchema.ts
import { column, Schema, Table } from '@powersync/web';

const users = new Table({
  name: column.text,
  email: column.text,
  role_id: column.text,
  created_at: column.text,
  updated_at: column.text
});

const roles = new Table({
  name: column.text,
  description: column.text,
  created_at: column.text,
  updated_at: column.text
});

const permissions = new Table({
  name: column.text,
  description: column.text,
  created_at: column.text,
  updated_at: column.text
});

const role_permissions = new Table({
  role_id: column.text,
  permission_id: column.text,
  created_at: column.text
});

export const AppSchema = new Schema({
  users,
  roles,
  permissions,
  role_permissions
});

export type Database = (typeof AppSchema)['types'];
export type User = Database['users'];
export type Role = Database['roles'];
export type Permission = Database['permissions'];
export type RolePermission = Database['role_permissions'];