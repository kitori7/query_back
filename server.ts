import "reflect-metadata";
import dataSource from "./data-source";
import { createApp } from "./app";
import { env } from "./src/config/env";

export async function bootstrap(): Promise<void> {
  await dataSource.initialize();
  createApp().listen(env.port, () => {
    console.log(`App is running at http://localhost:${env.port}`);
  });
}

if (require.main === module) {
  bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("Application bootstrap failed", message);
    process.exitCode = 1;
  });
}

