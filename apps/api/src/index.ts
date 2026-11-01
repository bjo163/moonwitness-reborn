import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { OpenAICompatibleProvider } from "@moonwitness/agent-runtime";
import { createConversationStore } from "@moonwitness/database";
import { createQlOrm } from "ql_orm";
import aiManifest from "ql_ai/__manifest__";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import { resolveModelProviderConfig } from "./ai/model-config.js";
import { parseProviderEncryptionKey } from "./ai/provider-secrets.js";
import { createApiServer } from "./http/server.js";

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});

const port = Number(process.env.PORT ?? 3000);
const modelProvider = resolveModelProviderConfig(process.env);
const provider = modelProvider.config
  ? new OpenAICompatibleProvider(modelProvider.config)
  : undefined;
const databaseUrl =
  process.env.DATABASE_URL ?? "file:../../data/moonwitness.db";
const { orm, close: closeOrm } = await createQlOrm(databaseUrl, [
  authManifest,
  baseManifest,
  aiManifest,
  chatManifest,
]);
const store = createConversationStore(orm);
const server = createApiServer(provider, store, orm, {
  encryptionKey: parseProviderEncryptionKey(
    process.env.PROVIDER_ENCRYPTION_KEY,
  ),
});

server.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log("Conversation database is ready.");
  if (!provider) {
    console.warn(
      "No server-wide model provider is configured; users can add personal providers in /providers.",
    );
  }
});

function closeServer() {
  server.close((error) => {
    store.close();
    closeOrm();
    if (error) {
      console.error("API server failed to close cleanly.", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
