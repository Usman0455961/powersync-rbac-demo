import { query } from "./database";
import {
  User,
  Role,
  Permission,
  RolePermission,
} from "@/app/library/powersync/AppSchema";

export class DatabaseService {
  // Users
  static async createUser(user: User) {
    const sql = `
      INSERT INTO users (id, name, email, role_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role_id = EXCLUDED.role_id,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;

    const result = await query(sql, [
      user.id,
      user.name,
      user.email,
      user.role_id,
      user.created_at,
      user.updated_at,
    ]);

    console.log("✅ User created/updated in database:", result.rows[0]);
    return result.rows[0];
  }

  static async updateUser(user: Partial<User> & { id: string }) {
    const sql = `
      UPDATE users 
      SET name = COALESCE($2, name),
          email = COALESCE($3, email),
          role_id = COALESCE($4, role_id),
          updated_at = $5
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [
      user.id,
      user.name,
      user.email,
      user.role_id,
      user.updated_at || new Date().toISOString(),
    ]);

    console.log("✅ User updated in database:", result.rows[0]);
    return result.rows[0];
  }

  static async deleteUser(id: string) {
    const sql = "DELETE FROM users WHERE id = $1 RETURNING *";
    const result = await query(sql, [id]);
    console.log("✅ User deleted from database:", result.rows[0]);
    return result.rows[0];
  }

  static async getAllUsers() {
    const sql = "SELECT * FROM users ORDER BY created_at DESC";
    const result = await query(sql);
    return result.rows;
  }

  // Roles
  static async createRole(role: Role) {
    const sql = `
      INSERT INTO roles (id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;

    const result = await query(sql, [
      role.id,
      role.name,
      role.description,
      role.created_at,
      role.updated_at,
    ]);

    console.log("✅ Role created/updated in database:", result.rows[0]);
    return result.rows[0];
  }

  static async updateRole(role: Partial<Role> & { id: string }) {
    const sql = `
      UPDATE roles 
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          updated_at = $4
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [
      role.id,
      role.name,
      role.description,
      role.updated_at || new Date().toISOString(),
    ]);

    console.log("✅ Role updated in database:", result.rows[0]);
    return result.rows[0];
  }

  static async deleteRole(id: string) {
    const sql = "DELETE FROM roles WHERE id = $1 RETURNING *";
    const result = await query(sql, [id]);
    console.log("✅ Role deleted from database:", result.rows[0]);
    return result.rows[0];
  }

  static async getAllRoles() {
    const sql = "SELECT * FROM roles ORDER BY created_at DESC";
    const result = await query(sql);
    return result.rows;
  }

  // Permissions
  static async createPermission(permission: Permission) {
    const sql = `
      INSERT INTO permissions (id, name, description, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;

    const result = await query(sql, [
      permission.id,
      permission.name,
      permission.description,
      permission.created_at,
      permission.updated_at,
    ]);

    console.log("✅ Permission created/updated in database:", result.rows[0]);
    return result.rows[0];
  }

  static async updatePermission(
    permission: Partial<Permission> & { id: string }
  ) {
    const sql = `
      UPDATE permissions 
      SET name = COALESCE($2, name),
          description = COALESCE($3, description),
          updated_at = $4
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [
      permission.id,
      permission.name,
      permission.description,
      permission.updated_at || new Date().toISOString(),
    ]);

    console.log("✅ Permission updated in database:", result.rows[0]);
    return result.rows[0];
  }

  static async deletePermission(id: string) {
    const sql = "DELETE FROM permissions WHERE id = $1 RETURNING *";
    const result = await query(sql, [id]);
    console.log("✅ Permission deleted from database:", result.rows[0]);
    return result.rows[0];
  }

  static async getAllPermissions() {
    const sql = "SELECT * FROM permissions ORDER BY created_at DESC";
    const result = await query(sql);
    return result.rows;
  }

  // Role Permissions
  static async createRolePermission(rolePermission: RolePermission) {
    const sql = `
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (role_id, permission_id) DO UPDATE SET
        created_at = EXCLUDED.created_at
      RETURNING *
    `;

    const result = await query(sql, [
      rolePermission.id,
      rolePermission.role_id,
      rolePermission.permission_id,
      rolePermission.created_at,
    ]);

    console.log("✅ Role-Permission link created in database:", result.rows[0]);
    return result.rows[0];
  }

  static async deleteRolePermission(id: string) {
    const sql = "DELETE FROM role_permissions WHERE id = $1 RETURNING *";
    const result = await query(sql, [id]);
    console.log(
      "✅ Role-Permission link deleted from database:",
      result.rows[0]
    );
    return result.rows[0];
  }

  static async getAllRolePermissions() {
    const sql = `
      SELECT rp.*, r.name as role_name, p.name as permission_name 
      FROM role_permissions rp
      LEFT JOIN roles r ON rp.role_id = r.id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      ORDER BY rp.created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  }

  // Sequence testing
  static async getDataWithSequence() {
    const sql = `
      SELECT 
        'user' as type, id, name, email, created_at 
      FROM users
      UNION ALL
      SELECT 
        'role' as type, id, name, description, created_at 
      FROM roles
      UNION ALL
      SELECT 
        'permission' as type, id, name, description, created_at 
      FROM permissions
      ORDER BY created_at ASC
    `;
    const result = await query(sql);
    return result.rows;
  }
}
