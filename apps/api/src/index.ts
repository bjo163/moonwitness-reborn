import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { OpenAICompatibleProvider } from "@moonwitness/agent-runtime";
import { createConversationStore } from "@moonwitness/database";
import { createQlOrm } from "ql_orm";
import { LocalDiskStorageDriver } from "ql_orm/storage/local";
import aiManifest from "ql_ai/__manifest__";
import attachmentManifest from "ql_attachment/__manifest__";
import { reapExpiredUploads } from "ql_attachment/services/attachment-service";
import { attachmentPolicyFromEnv } from "ql_attachment/services/policy-env";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import cloudflareManifest from "ql_cloudflare/__manifest__";
import corpusManifest from "ql_corpus/__manifest__";
import integrationManifest from "ql_integration/__manifest__";
import i18nManifest from "ql_i18n/__manifest__";
import geoManifest from "ql_geo/__manifest__";
import sourceManifest from "ql_source/__manifest__";
import researchManifest from "ql_research/__manifest__";
import workflowManifest from "ql_workflow/__manifest__";
import searchManifest from "ql_search/__manifest__";
import { resolveModelProviderConfig } from "./ai/model-config.js";
import { parseProviderEncryptionKey } from "./ai/provider-secrets.js";
import { createApiServer } from "./http/server.js";

dotenv.config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env"),
});

const port = Number(process.env.PORT ?? 3000);
const rawEncryptionKey = process.env.PROVIDER_ENCRYPTION_KEY?.trim();
const isKnownZeroKey = rawEncryptionKey === "0".repeat(64);
if (process.env.NODE_ENV === "production" && isKnownZeroKey) {
  throw new Error(
    "PROVIDER_ENCRYPTION_KEY cannot use the all-zero development fallback in production mode.",
  );
}

const modelProvider = resolveModelProviderConfig(process.env);
const provider = modelProvider.config
  ? new OpenAICompatibleProvider(modelProvider.config)
  : undefined;
const databaseUrl =
  process.env.DATABASE_URL ?? "file:../../data/moonwitness.db";
const attachmentStorage = new LocalDiskStorageDriver({
  rootDir: process.env.ATTACHMENT_STORAGE_DIR ?? "../../data/attachments",
});
const attachmentPolicy = attachmentPolicyFromEnv(process.env);
const { orm, close: closeOrm } = await createQlOrm(
  databaseUrl,
  [
    authManifest,
    baseManifest,
    aiManifest,
    chatManifest,
    integrationManifest,
    i18nManifest,
    geoManifest,
    cloudflareManifest,
    workflowManifest,
    sourceManifest,
    corpusManifest,
    researchManifest,
    searchManifest,
    attachmentManifest,
  ],
  { storage: attachmentStorage },
);

function runAttachmentReap(origin: string): void {
  void reapExpiredUploads(orm, attachmentStorage).catch((error: unknown) => {
    console.error(`Attachment reaper pass failed (${origin}).`, error);
  });
}

// A process-local sweep is the current bound: uploads interrupted by a deploy
// are reclaimed here rather than by a job queue the stack does not have yet.
runAttachmentReap("boot");
const attachmentReaper = setInterval(() => runAttachmentReap("interval"), 15 * 60 * 1000);
attachmentReaper.unref();

const store = createConversationStore(orm);
const server = createApiServer(provider, store, orm, {
  encryptionKey: parseProviderEncryptionKey(
    process.env.PROVIDER_ENCRYPTION_KEY,
  ),
  attachmentPolicy,
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
  clearInterval(attachmentReaper);
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
