import { NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/dbService";

interface SyncOperation {
  op: "PUT" | "PATCH" | "DELETE";
  type: string;
  id: string;
  data: any;
}

export async function POST(request: NextRequest) {
  try {
    const operations: SyncOperation[] = await request.json();

    console.log("\n🔄 PowerSync CRUD Transaction Received:", {
      timestamp: new Date().toISOString(),
      operationsCount: operations.length,
      operations: operations.map((operation) => ({
        op: operation.op,
        type: operation.type,
        id: operation.id,
        hasData: !!operation.data,
      })),
    });

    const results = [];

    // Process each CRUD operation in sequence
    for (const operation of operations) {
      console.log(
        `\n📝 Processing ${operation.op} operation for ${operation.type}:`,
        {
          id: operation.id,
          op: operation.op,
          type: operation.type,
          data: operation.data,
        }
      );

      try {
        let result;

        // Use operation.type instead of entry.type
        switch (operation.type) {
          case "users":
            result = await handleUserOperation(operation);
            break;
          case "roles":
            result = await handleRoleOperation(operation);
            break;
          case "permissions":
            result = await handlePermissionOperation(operation);
            break;
          case "role_permissions":
            result = await handleRolePermissionOperation(operation);
            break;
          default:
            console.warn(`Unknown table type: ${operation.type}`);
            continue;
        }

        results.push({
          operation: operation.op,
          type: operation.type,
          id: operation.id,
          success: true,
          result,
        });

        console.log(
          `✅ ${operation.op} operation completed for ${operation.type}`
        );
      } catch (error) {
        console.error(
          `❌ Error processing ${operation.op} for ${operation.type}:`,
          error
        );
        results.push({
          operation: operation.op,
          type: operation.type,
          id: operation.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("\n🎯 PowerSync transaction completed:", {
      totalOperations: operations.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("❌ PowerSync sync endpoint error:", error);
    return NextResponse.json(
      {
        error: "Failed to process sync data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleUserOperation(operation: SyncOperation) {
  switch (operation.op) {
    case "PUT":
    case "PATCH":
      return await DatabaseService.createUser(operation.data);
    case "DELETE":
      return await DatabaseService.deleteUser(operation.id);
    default:
      throw new Error(`Unknown operation: ${operation.op}`);
  }
}

async function handleRoleOperation(operation: SyncOperation) {
  switch (operation.op) {
    case "PUT":
    case "PATCH":
      return await DatabaseService.createRole(operation.data);
    case "DELETE":
      return await DatabaseService.deleteRole(operation.id);
    default:
      throw new Error(`Unknown operation: ${operation.op}`);
  }
}

async function handlePermissionOperation(operation: SyncOperation) {
  switch (operation.op) {
    case "PUT":
    case "PATCH":
      return await DatabaseService.createPermission(operation.data);
    case "DELETE":
      return await DatabaseService.deletePermission(operation.id);
    default:
      throw new Error(`Unknown operation: ${operation.op}`);
  }
}

async function handleRolePermissionOperation(operation: SyncOperation) {
  switch (operation.op) {
    case "PUT":
    case "PATCH":
      return await DatabaseService.createRolePermission(operation.data);
    case "DELETE":
      return await DatabaseService.deleteRolePermission(operation.id);
    default:
      throw new Error(`Unknown operation: ${operation.op}`);
  }
}
