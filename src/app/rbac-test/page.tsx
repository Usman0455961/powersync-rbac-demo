// filepath: [page.tsx](http://_vscodecontentref_/1)
"use client";

import React, { useState } from "react";
import { useRBACPowerSync } from "@/hooks/useRBACPowerSync";
import {
  Users,
  Shield,
  Key,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const RBACTestPage = () => {
  const {
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
    refetch,
  } = useRBACPowerSync();

  const [newUser, setNewUser] = useState({ name: "", email: "", role_id: "" });
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role_id: newUser.role_id ? newUser.role_id : null,
      });
      setNewUser({ name: "", email: "", role_id: "" });
      alert("User created successfully!");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      alert("Please enter a role name");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRole({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
      });
      setNewRole({ name: "", description: "" });
      alert("Role created successfully!");
    } catch (error) {
      console.error("Error creating role:", error);
      alert("Error creating role: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermission.name.trim()) {
      alert("Please enter a permission name");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPermission({
        name: newPermission.name.trim(),
        description: newPermission.description.trim(),
      });
      setNewPermission({ name: "", description: "" });
      alert("Permission created successfully!");
    } catch (error) {
      console.error("Error creating permission:", error);
      alert("Error creating permission: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePermission = async (
    roleId: string,
    permissionId: string
  ) => {
    try {
      await toggleRolePermission(roleId, permissionId);
    } catch (error) {
      console.error("Error toggling permission:", error);
      alert("Error toggling permission: " + (error as Error).message);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading RBAC data from PowerSync...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Connection Error
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            Check your PowerSync configuration and internet connection.
          </p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            RBAC System Test - PowerSync Connected!
          </h1>
          <p className="text-gray-600 mt-2">
            Test your RBAC system with real-time PowerSync synchronization
          </p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh Data
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold">{users.length}</p>
                <p className="text-gray-600">Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold">{roles.length}</p>
                <p className="text-gray-600">Roles</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Key className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold">{permissions.length}</p>
                <p className="text-gray-600">Permissions</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                <span className="text-white text-sm font-bold">R→P</span>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold">
                  {rolePermissions.length}
                </p>
                <p className="text-gray-600">Role-Permission Links</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Forms */}
          <div className="space-y-6">
            {/* Create User Form */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create User
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role (Optional)
                  </label>
                  <select
                    value={newUser.role_id}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role_id: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateUser}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create User
                </button>
              </div>
            </div>

            {/* Create Role Form */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Create Role
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) =>
                      setNewRole({ ...newRole, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) =>
                      setNewRole({ ...newRole, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleCreateRole}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Create Role
                </button>
              </div>
            </div>

            {/* Create Permission Form */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Create Permission
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newPermission.name}
                    onChange={(e) =>
                      setNewPermission({
                        ...newPermission,
                        name: e.target.value,
                      })
                    }
                    placeholder="e.g., users.create"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newPermission.description}
                    onChange={(e) =>
                      setNewPermission({
                        ...newPermission,
                        description: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <button
                  onClick={handleCreatePermission}
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Create Permission
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Data Display */}
          <div className="space-y-6">
            {/* Current Users */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  Current Users ({users.length})
                </h2>
              </div>

              <div className="p-6">
                {users.length > 0 ? (
                  <div className="space-y-3">
                    {users.map((user) => {
                      const userRole = getUserRole(user.id);
                      return (
                        <div
                          key={user.id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                          </div>
                          <div>
                            {userRole ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                {userRole.name}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                                No Role
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No users yet. Create some users above!
                  </p>
                )}
              </div>
            </div>

            {/* Role-Permission Matrix */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold">
                  Role-Permission Matrix
                </h2>
                <p className="text-sm text-gray-600">
                  Click to toggle permissions for each role
                </p>
              </div>

              <div className="p-6">
                {roles.length > 0 && permissions.length > 0 ? (
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <div key={role.id} className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">{role.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          {permissions.map((permission) => {
                            const isAssigned = rolePermissions.some(
                              (rp) =>
                                rp.role_id === role.id &&
                                rp.permission_id === permission.id
                            );

                            return (
                              <button
                                key={permission.id}
                                onClick={() =>
                                  handleTogglePermission(role.id, permission.id)
                                }
                                className={`text-xs px-3 py-1 rounded-full transition-colors ${
                                  isAssigned
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                {permission.name} {isAssigned ? "✓" : "+"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Create some roles and permissions to see the matrix!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACTestPage;