"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { PowerSyncDatabase } from "@powersync/web";
import { PowerSyncContext } from "@powersync/react";
import { AppSchema } from "./AppSchema";
import { BackendConnector } from "./BackendConnector";

export const PowerSyncSetup = ({ children }: { children: ReactNode }) => {
  const [powerSync, setPowerSync] = useState<PowerSyncDatabase>();

  useEffect(() => {
    const setup = async () => {
      const powerSync = new PowerSyncDatabase({
        database: { dbFilename: "powersync.db" },
        schema: AppSchema,
      });

      const connector = new BackendConnector();
      await powerSync.init();
      await powerSync.connect(connector);

      // Test connection
      try {
        const testResult = await powerSync.execute(
          "SELECT * FROM sqlite_schema"
        );
        console.log("PowerSync test query successful", testResult);
      } catch (error) {
        console.error("PowerSync test query failed", error);
      }

      setPowerSync(powerSync);
    };

    setup().catch(console.error);

    return () => {
      powerSync?.disconnect();
    };
  }, []);

  if (!powerSync) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>Initializing PowerSync...</p>
        </div>
      </div>
    );
  }

  return (
    <PowerSyncContext.Provider value={powerSync}>
      {children}
    </PowerSyncContext.Provider>
  );
};
