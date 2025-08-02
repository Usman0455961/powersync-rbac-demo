import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  CrudEntry,
  UpdateType,
} from "@powersync/web";

export class BackendConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const response = await fetch("/api/powersync-token");
    if (!response.ok) {
      throw new Error("Failed to fetch PowerSync credentials");
    }
    return response.json();
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const transaction = await database.getNextCrudTransaction();
    console.log(
      "🚀 ~ BackendConnector ~ uploadData ~ transaction:",
      transaction
    );

    if (!transaction) {
      return;
    }

    try {
      // Process each operation individually and send to backend
      const operations = [];

      for (const op of transaction.crud) {
        // The data that needs to be changed in the remote db
        const record = { ...op.opData, id: op.id };

        let operation;
        switch (op.op) {
          case UpdateType.PUT:
            operation = {
              op: "PUT",
              type: op.table,
              id: op.id,
              data: record,
            };
            break;
          case UpdateType.PATCH:
            operation = {
              op: "PATCH",
              type: op.table,
              id: op.id,
              data: record,
            };
            break;
          case UpdateType.DELETE:
            operation = {
              op: "DELETE",
              type: op.table,
              id: op.id,
              data: null,
            };
            break;
          default:
            console.warn(`Unknown operation type: ${op.op}`);
            continue;
        }

        operations.push(operation);
      }

      // Send all operations to backend
      if (operations.length > 0) {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(operations),
        });

        if (!response.ok) {
          throw new Error("Failed to upload data to backend");
        }
      }

      await transaction.complete();
    } catch (error) {
      console.error("Error uploading data:", error);
      // if (this.shouldDiscardDataOnError(error)) {
      //   console.error("Discarding data due to error");
      //   await transaction.complete();
      // } else {
        throw error;
      // }
    }
  }

  // shouldDiscardDataOnError(error: any): boolean {
  //   // Discard data on network errors
  //   return error instanceof TypeError;
  // }
}
