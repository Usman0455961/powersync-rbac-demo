import { useState, useEffect, useCallback } from "react";
import { usePowerSync } from "@powersync/react";
import {
  User,
  Role,
  Permission,
  RolePermission,
} from "@/app/library/powersync/AppSchema";
import { v4 as uuidv4 } from "uuid";

export const useRBACPowerSync = () => {
  const powerSync = usePowerSync();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!powerSync) {
      setError("PowerSync not initialized");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        usersResult,
        rolesResult,
        permissionsResult,
        rolePermissionsResult,
      ] = await Promise.all([
        powerSync.getAll("SELECT * FROM users ORDER BY created_at DESC"),
        powerSync.getAll("SELECT * FROM roles ORDER BY created_at DESC"),
        powerSync.getAll("SELECT * FROM permissions ORDER BY created_at DESC"),
        powerSync.getAll(
          "SELECT * FROM role_permissions ORDER BY created_at DESC"
        ),
      ]);

      setUsers((usersResult as User[]) ?? []);
      setRoles((rolesResult as Role[]) ?? []);
      setPermissions((permissionsResult as Permission[]) ?? []);
      setRolePermissions((rolePermissionsResult as RolePermission[]) ?? []);
    } catch (err) {
      console.error("[RBAC] Error loading data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      setUsers([]);
      setRoles([]);
      setPermissions([]);
      setRolePermissions([]);
    } finally {
      setLoading(false);
    }
  }, [powerSync]);

  useEffect(() => {
    if (!powerSync) return;

    // Set up real-time subscriptions
    powerSync.watch("SELECT * FROM users ORDER BY created_at DESC", [], {
      onResult: (result) => setUsers(result.rows?._array ?? []),
    });

    powerSync.watch("SELECT * FROM roles ORDER BY created_at DESC", [], {
      onResult: (result) => setRoles(result.rows?._array ?? []),
    });

    powerSync.watch("SELECT * FROM permissions ORDER BY created_at DESC", [], {
      onResult: (result) => setPermissions(result.rows?._array ?? []),
    });

    powerSync.watch(
      "SELECT * FROM role_permissions ORDER BY created_at DESC",
      [],
      { onResult: (result) => setRolePermissions(result.rows?._array ?? []) }
    );

    // Load initial data
    loadData();

    // Cleanup - PowerSync handles unsubscriptions automatically
    return () => {};
  }, [powerSync, loadData]);

  const createUser = useCallback(
    async (userData: Omit<User, "id" | "created_at" | "updated_at">) => {
      if (!powerSync) throw new Error("PowerSync not initialized");

      const now = new Date().toISOString();
      const user: User = {
        id: uuidv4(),
        ...userData,
        created_at: now,
        updated_at: now,
      };

      await powerSync.execute(
        "INSERT INTO users (id, name, email, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          user.id,
          user.name,
          user.email,
          user.role_id || null,
          user.created_at,
          user.updated_at,
        ]
      );

      return user;
    },
    [powerSync]
  );

  const createRole = useCallback(
    async (roleData: Omit<Role, "id" | "created_at" | "updated_at">) => {
      if (!powerSync) throw new Error("PowerSync not initialized");

      const now = new Date().toISOString();
      const role: Role = {
        id: uuidv4(),
        ...roleData,
        created_at: now,
        updated_at: now,
      };

      await powerSync.execute(
        "INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [role.id, role.name, role.description, role.created_at, role.updated_at]
      );

      return role;
    },
    [powerSync]
  );

  const createPermission = useCallback(
    async (
      permissionData: Omit<Permission, "id" | "created_at" | "updated_at">
    ) => {
      if (!powerSync) throw new Error("PowerSync not initialized");

      const now = new Date().toISOString();
      const permission: Permission = {
        id: uuidv4(),
        ...permissionData,
        created_at: now,
        updated_at: now,
      };

      await powerSync.execute(
        "INSERT INTO permissions (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [
          permission.id,
          permission.name,
          permission.description,
          permission.created_at,
          permission.updated_at,
        ]
      );

      return permission;
    },
    [powerSync]
  );

  const toggleRolePermission = useCallback(
    async (roleId: string, permissionId: string) => {
      if (!powerSync) throw new Error("PowerSync not initialized");

      const existing = rolePermissions.some(
        (rp) => rp.role_id === roleId && rp.permission_id === permissionId
      );

      if (existing) {
        await powerSync.execute(
          "DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?",
          [roleId, permissionId]
        );
      } else {
        const now = new Date().toISOString();
        await powerSync.execute(
          "INSERT INTO role_permissions (id, role_id, permission_id, created_at) VALUES (?, ?, ?, ?)",
          [uuidv4(), roleId, permissionId, now]
        );
      }
    },
    [powerSync, rolePermissions]
  );

  const getUserRole = useCallback(
    (userId: string): Role | undefined => {
      const user = users.find((u) => u.id === userId);
      return user?.role_id
        ? roles.find((r) => r.id === user.role_id)
        : undefined;
    },
    [users, roles]
  );

  const getRolePermissions = useCallback(
    (roleId: string): Permission[] => {
      const rolePermIds = rolePermissions
        .filter((rp) => rp.role_id === roleId)
        .map((rp) => rp.permission_id);
      return permissions.filter((p) => rolePermIds.includes(p.id));
    },
    [rolePermissions, permissions]
  );

  return {
    users,
    roles,
    permissions,
    rolePermissions,
    loading,
    error,
    createUser,
    createRole,
    createPermission,
    toggleRolePermission,
    getUserRole,
    getRolePermissions,
    refetch: loadData,
  };
};
