import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { OpenAICompatibleProvider } from "@moonwitness/agent-runtime";
import { createConversationStore } from "@moonwitness/database";
import { createQlOrm } from "ql_orm";
import { countUsersWithRole, seedRoles } from "ql_auth/services/rbac";
import aiManifest from "ql_ai/__manifest__";
import authManifest from "ql_auth/__manifest__";
import baseManifest from "ql_base/__manifest__";
import chatManifest from "ql_chat/__manifest__";
import { resolveModelProviderConfig } from "./ai/model-config.js";
import { parseProviderEncryptionKey } from "./ai/provider-secrets.js";
import { readBootstrapAdmin } from "./auth/bootstrap.js";
import { resolveAppBaseUrl, resolveMailConfig } from "./mail/mail-config.js";
import { createMailer, type MailSender } from "./mail/mailer.js";
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
await seedRoles(orm);
if ((await countUsersWithRole(orm, "super_admin")) === 0) {
  console.warn(
    "Belum ada super_admin. Isi BOOTSTRAP_ADMIN_EMAIL dan BOOTSTRAP_ADMIN_TOKEN, daftar, lalu cabut kedua env itu.",
  );
}
const store = createConversationStore(orm);
const mailConfig = resolveMailConfig(process.env);
const mail: MailSender | undefined = mailConfig.enabled
  ? createMailer(mailConfig.config)
  : undefined;
if (!mailConfig.enabled) {
  console.warn(`Email dinonaktifkan (${mailConfig.reason})`);
}
const server = createApiServer(provider, store, orm, {
  encryptionKey: parseProviderEncryptionKey(
    process.env.PROVIDER_ENCRYPTION_KEY,
  ),
  bootstrapAdmin: readBootstrapAdmin(process.env),
  mail,
  appBaseUrl: resolveAppBaseUrl(process.env),
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
    mail?.close();
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
