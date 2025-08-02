# PowerSync RBAC Demo

A complete Role-Based Access Control (RBAC) system built with Next.js and PowerSync, demonstrating real-time data synchronization between frontend, local storage, and PostgreSQL database.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                Next.js Application                          │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend UI   │ PowerSync Local │ Backend API     │   Database Layer       │
│                 │   (IndexedDB)   │   Endpoints     │                        │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐  │  ┌──────────────────┐  │
│  │React      │  │  │Local RBAC │  │  │/api/sync  │  │  │DatabaseService   │  │
│  │Components │◄─┤  │Tables     │◄─┤  │Endpoint   │◄─┤  │(PostgreSQL ops)  │  │
│  └───────────┘  │  └───────────┘  │  └───────────┘  │  └──────────────────┘  │
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐  │  ┌──────────────────┐  │
│  │RBAC Hooks │  │  │PowerSync  │  │  │Backend    │  │  │PostgreSQL        │  │
│  │(useRBAC)  │  │  │Schema     │  │  │Connector  │  │  │RBAC Tables       │  │
│  └───────────┘  │  └───────────┘  │  └───────────┘  │  └──────────────────┘  │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
                                   ▲
                                   │
                ┌─────────────────────────────────────┐
                │        PowerSync Cloud              │
                │                                     │
                │  ┌─────────────┐ ┌─────────────┐   │
                │  │Sync Engine  │ │Sync Rules   │   │
                │  │             │ │(YAML)       │   │
                │  └─────────────┘ └─────────────┘   │
                │                                     │
                └─────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### 1. Frontend → Backend (Create/Update Operations)

```typescript
// src/app/library/powersync/BackendConnector.ts - Handles PowerSync to Backend Communication
export class BackendConnector implements PowerSyncBackendConnector {
  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    
    if (!transaction) return;

    try {
      const operations = [];
      
      // Transform PowerSync operations to API format
      for (const op of transaction.crud) {
        const record = { ...op.opData, id: op.id };
        
        let operation;
        switch (op.op) {
          case UpdateType.PUT:
            operation = {
              op: "PUT",
              type: op.table,    // users, roles, permissions, role_permissions
              id: op.id,
              data: record
            };
            break;
          case UpdateType.PATCH:
            operation = { op: "PATCH", type: op.table, id: op.id, data: record };
            break;
          case UpdateType.DELETE:
            operation = { op: "DELETE", type: op.table, id: op.id, data: null };
            break;
        }
        operations.push(operation);
      }

      // Send to backend API
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operations),
      });

      if (!response.ok) {
        throw new Error("Failed to upload data to backend");
      }

      await transaction.complete();
    } catch (error) {
      console.error("Error uploading data:", error);
      throw error;
    }
  }
}
```

### 2. Complete Data Flow Sequence

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │ PowerSync   │    │ Backend     │    │ PostgreSQL  │
│   Action    │    │ Local DB    │    │ API         │    │ Database    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Create User    │                   │                   │
       │ ─────────────────►│                   │                   │
       │                   │ 2. Store Locally │                   │
       │                   │ (IndexedDB)       │                   │
       │                   │                   │                   │
       │                   │ 3. Auto Upload    │                   │
       │                   │ ─────────────────►│                   │
       │                   │                   │ 4. Process CRUD   │
       │                   │                   │ ─────────────────►│
       │                   │                   │                   │ 5. Store Data
       │                   │ ◄─────────────────┤ ◄─────────────────┤
       │ ◄─────────────────┤ 6. Real-time Sync │                   │
       │ 7. UI Update      │                   │                   │
```

### 3. Backend API Processing (`/api/sync`)

```typescript
// /api/sync/route.ts
export async function POST(request: NextRequest) {
  const operations: SyncOperation[] = await request.json();
  
  for (const operation of operations) {
    switch (operation.type) {
      case "users":
        await handleUserOperation(operation);
        break;
      case "roles":
        await handleRoleOperation(operation);
        break;
      case "permissions":
        await handlePermissionOperation(operation);
        break;
      case "role_permissions":
        await handleRolePermissionOperation(operation);
        break;
    }
  }
}

async function handleUserOperation(operation: SyncOperation) {
  switch (operation.op) {
    case "PUT":
    case "PATCH":
      return await DatabaseService.createUser(operation.data);
    case "DELETE":
      return await DatabaseService.deleteUser(operation.id);
  }
}
```

## 🚀 Project Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- PowerSync account ([PowerSync Cloud](https://powersync.journeyapps.com))

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd powersync-rbac-demo
npm install
```

### 2. Database Setup

Create a PostgreSQL instance on your preferred cloud provider (DigitalOcean, AWS RDS, Google Cloud SQL, etc.).

### 3. Create Database Tables

Connect to your PostgreSQL database and run the following SQL:

```sql
-- RBAC Database Schema for PowerSync

-- 1. Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Permissions table  
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Role-Permissions junction table (many-to-many)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Add indexes for better performance
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Create PowerSync publication (required for PowerSync to track changes)
CREATE PUBLICATION powersync FOR ALL TABLES;

-- What does this publication do?
-- A PostgreSQL publication is part of logical replication that defines which tables
-- and what changes (INSERT, UPDATE, DELETE) should be tracked and made available
-- to external systems like PowerSync.
--
-- Why is it needed?
-- - PowerSync uses PostgreSQL's logical replication to detect real-time changes
-- - Without this publication, PowerSync cannot see when data changes in your database
-- - The publication acts as a "change feed" that PowerSync subscribes to
-- - This enables bi-directional sync: changes flow from database → PowerSync → clients
-- - Essential for real-time updates across all connected devices/browsers
```

### 4. Populate Sample Data

```sql
-- Insert sample roles
INSERT INTO roles (name, description) VALUES 
    ('admin', 'Full system access'),
    ('manager', 'Management level access'),
    ('customer', 'Limited customer access');

-- Insert sample permissions
INSERT INTO permissions (name, description) VALUES 
    ('users.create', 'Create new users'),
    ('users.read', 'View users'),
    ('users.update', 'Update user information'),
    ('users.delete', 'Delete users'),
    ('roles.manage', 'Manage roles and permissions'),
    ('profile.read', 'View own profile'),
    ('profile.update', 'Update own profile'),
    ('dashboard.view', 'View dashboard'),
    ('reports.generate', 'Generate reports');

-- Link permissions to roles
-- Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id) 
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'admin';

-- Manager gets specific permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'manager' AND p.name IN (
    'users.read', 'users.update', 'dashboard.view', 'reports.generate'
);

-- Customer gets limited permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'customer' AND p.name IN ('profile.read', 'profile.update');

-- Insert sample users
INSERT INTO users (name, email, role_id) VALUES 
    ('Admin User', 'admin@example.com', (SELECT id FROM roles WHERE name = 'admin')),
    ('Manager User', 'manager@example.com', (SELECT id FROM roles WHERE name = 'manager')),
    ('John Customer', 'john@example.com', (SELECT id FROM roles WHERE name = 'customer')),
    ('Jane Customer', 'jane@example.com', (SELECT id FROM roles WHERE name = 'customer'));
```

## ⚡ PowerSync Setup

### 1. Create PowerSync Instance

1. Go to [PowerSync Cloud Console](https://powersync.journeyapps.com)
2. Create a new account or sign in
3. Create a new PowerSync instance
4. Note down your instance URL and credentials

### 2. Connect PostgreSQL to PowerSync

1. In PowerSync Console, go to **Database Connections**
2. Add your PostgreSQL connection details:
   ```
   Host: your-postgres-host
   Port: 5432
   Database: powersync_rbac
   Username: your-username
   Password: your-password
   ```
3. Test the connection

### 3. Configure Sync Rules

Create a `sync-rules.yaml` file in your PowerSync console with the following content:

```yaml
# sync-rules.yaml - Defines what data PowerSync synchronizes

bucket_definitions:
  global:
    # Global bucket - all users get access to all RBAC data
    # In production, you might want user-specific buckets for security
    data:
      # Sync all users
      - SELECT id, name, email, role_id, created_at, updated_at FROM users
      
      # Sync all roles
      - SELECT id, name, description, created_at, updated_at FROM roles
      
      # Sync all permissions
      - SELECT id, name, description, created_at, updated_at FROM permissions
      
      # Sync role-permission relationships
      - SELECT id, role_id, permission_id, created_at FROM role_permissions

bucket_parameters:
  # No parameters needed for global bucket
  global: []
```

#### 🎯 What Sync Rules Do:

**Purpose**: Sync rules define exactly what data PowerSync should synchronize between your PostgreSQL database and client applications.

**Key Concepts**:
- **Buckets**: Logical containers for data (like user-specific or global data)
- **Bucket Definitions**: SQL queries that define what data goes into each bucket
- **Bucket Parameters**: Variables that make buckets dynamic (e.g., user_id)

**In Our RBAC System**:
- We use a `global` bucket because all users need access to roles and permissions
- Each SELECT statement defines a table to sync
- PowerSync automatically handles real-time updates when this data changes
- Changes flow both ways: client → database and database → client

**Production Considerations**:
```yaml
# Example of user-specific buckets for better security
user_data:
  parameters: ['user_id']
  data:
    - SELECT id, name, email FROM users WHERE id = $1
    - SELECT r.* FROM roles r JOIN users u ON r.id = u.role_id WHERE u.id = $1
```

### 4. Deploy Sync Rules

1. Upload the `sync-rules.yaml` to your PowerSync instance
2. Deploy the rules
3. Verify that data is being synced

## 🔧 Environment Configuration

Create a `.env.local` file in your project root:

```bash
# PowerSync Configuration
NEXT_PUBLIC_POWERSYNC_URL="https://your-powersync-instance.powersync.journeyapps.com"
NEXT_PUBLIC_POWERSYNC_TOKEN="your-powersync-jwt-token"

# Database Configuration
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=powersync_rbac
DB_USER=your-username
DB_PASSWORD=your-password

# SSL Configuration (for cloud databases like DigitalOcean)
DB_SSL_REQUIRED=true
```

## 🏃‍♂️ Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to see the application.

## 📱 Features & Pages

### RBAC Test (`/rbac-test`)
- Create users, roles, and permissions
- Assign permissions to roles
- Real-time data display
- Role-permission matrix


## 🔄 How It Works

### Frontend → Backend Flow:
1. User creates data in React form
2. Data is stored in PowerSync local database (IndexedDB)
3. PowerSync automatically uploads to backend via `BackendConnector`
4. Backend API (`/api/sync`) receives CRUD operations
5. `DatabaseService` writes to PostgreSQL
6. PowerSync detects changes and syncs back to all clients

### Real-time Updates:
1. Any change in PostgreSQL triggers PowerSync
2. PowerSync pushes updates to all connected clients
3. React components update automatically via `usePowerSync` hooks

### Key Backend Connector Features:

```typescript
// Automatic operation transformation
const record = { ...op.opData, id: op.id };

// Operation type mapping
UpdateType.PUT    → "PUT"    (Create/Replace)
UpdateType.PATCH  → "PATCH"  (Update)
UpdateType.DELETE → "DELETE" (Remove)

// Table routing
op.table → operation.type → API handler
```

## 🛠️ Key Components

### Backend Integration
- **`src/app/library/powersync/BackendConnector.ts`**: Handles PowerSync → Backend communication
- **`/api/sync`**: Processes CRUD operations from PowerSync
- **`DatabaseService`**: Manages PostgreSQL operations

### Frontend Components
- **`useRBACPowerSync`**: Custom hook for RBAC operations
- **Real-time Components**: Auto-updating UI via PowerSync watchers
- **Form Components**: Create users, roles, permissions

### Database Layer
- **PowerSync Schema**: Defines local database structure
- **PostgreSQL**: Production data storage
- **Sync Rules**: Control what data synchronizes

## 🔍 Testing the Complete Flow

### 1. Real-time Sync Testing

**Test Client → Database Flow:**
1. **Create a user** in `/rbac-test`
2. **Check Browser DevTools** → Application → IndexedDB (local storage)
3. **Check Terminal** for sync API logs:
   ```
   🚀 ~ BackendConnector ~ uploadData ~ transaction: {...}
   📝 Processing PUT operation for users: {...}
   ✅ PUT operation completed for users
   ```
4. **Verify PostgreSQL** database for the new record
5. **Open multiple browser tabs** to see real-time sync

**Test Database → Client Flow:**
1. **Manually insert a record** directly in your PostgreSQL database:
   ```sql
   INSERT INTO users (name, email, role_id) VALUES 
   ('Test User', 'test@example.com', (SELECT id FROM roles WHERE name = 'admin'));
   ```
2. **Watch your client update in real-time** - the new user will appear instantly in all connected browser tabs
3. **No page refresh needed** - PowerSync automatically syncs the change to all clients

### 2. Offline Functionality Testing

**Test Offline Queue Management:**
1. **Open Chrome DevTools** → Network tab
2. **Enable "Offline" mode** (or throttle to "Offline")
3. **Create multiple operations while offline:**
   - Add 3-4 new users
   - Create 2-3 new roles
   - Add several permissions
   - Assign permissions to roles
4. **Check IndexedDB** → You'll see all data stored locally
5. **Disable offline mode** (restore internet connection)
6. **Watch the magic happen:**
   - PowerSync automatically detects connection restore
   - All queued operations are sent to backend sequentially
   - Database gets updated with all offline changes
   - Other connected clients receive all updates in real-time

**What to Observe:**
- **Instant UI updates** even when offline
- **Persistent local storage** - data remains after page refresh
- **Sequential sync** - operations are processed in correct order when online
- **Conflict resolution** - PowerSync handles any data conflicts gracefully

## 🚨 Troubleshooting

### Common Issues:

1. **PowerSync connection fails**
   - Check `NEXT_PUBLIC_POWERSYNC_URL` and token
   - Verify PowerSync instance is running

2. **Database connection errors**
   - For cloud databases, ensure SSL is properly configured
   - Check firewall settings and connection credentials

3. **Data not syncing**
   - Verify sync rules are deployed
   - Check PowerSync console for errors
   - Ensure database tables exist

4. **BackendConnector errors**
   - Check `/api/sync` endpoint logs
   - Verify operation format in browser network tab
   - Ensure DatabaseService methods exist

### Debug Tools:

- Browser DevTools → Console (PowerSync logs)
- PowerSync Console → Logs
- Network tab to see API calls
- Database query logs

## 📚 Additional Resources

- [PowerSync Documentation](https://docs.powersync.journeyapps.com)
- [PowerSync React SDK](https://github.com/powersync-ja/powersync-react)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🎯 Next Steps

- Implement user authentication
- Add row-level security (RLS) in PostgreSQL
- Create user-specific buckets in sync rules
- Add audit logging
- Implement more complex permission hierarchies
- Add error handling for network failures
- Implement offline queue management

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you have any questions or need help with the setup, please open an issue in this repository.
