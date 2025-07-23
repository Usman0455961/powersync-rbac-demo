import {
  AbstractPowerSyncDatabase,
  PowerSyncBackendConnector,
  CrudEntry,
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

    if (!transaction) {
      return;
    }

    try {
      // Upload data to your backend service
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction.crud),
      });

      if (!response.ok) {
        throw new Error("Failed to upload data to backend");
      }

      await transaction.complete();
    } catch (error) {
      console.error("Error uploading data:", error);
      if (this.shouldDiscardDataOnError(error)) {
        console.error("Discarding data due to error");
        await transaction.complete();
      } else {
        throw error;
      }
    }
  }

  shouldDiscardDataOnError(error: any): boolean {
    // Discard data on network errors
    return error instanceof TypeError;
  }
}
