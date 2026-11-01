import assert from "node:assert/strict";
import { createServer, type Socket } from "node:net";
import test from "node:test";
import type { SmtpMailConfig } from "./mail-config.js";
import { createMailer, MailDeliveryError } from "./mailer.js";

const password = "a-long-service-password";

function stub(hook: (socket: Socket) => void) {
  const sockets = new Set<Socket>();
  return new Promise<{ port: number; stop(): Promise<void> }>((resolve) => {
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      hook(socket);
    });
    server.listen(0, "127.0.0.1", () => {
      const info = server.address();
      assert.ok(info && typeof info !== "string");
      resolve({
        port: info.port,
        stop: () =>
          new Promise<void>((done) => {
            for (const socket of sockets) socket.destroy();
            server.close(() => done());
          }),
      });
    });
  });
}

function mailConfig(port: number): SmtpMailConfig {
  return {
    host: "127.0.0.1",
    port,
    secure: false,
    username: "app@a-l-l-a-h.com",
    password,
    from: "MoonWitness <app@a-l-l-a-h.com>",
  };
}

const resetMail = {
  to: "bjo@a-l-l-a-h.com",
  name: "Bjo",
  resetUrl: "https://a-l-l-a-h.com/?mode=reset&token=abc",
  ttlMinutes: 30,
};

void test("a stalled SMTP conversation is cut off by the send deadline", async () => {
  const server = await stub((socket) => {
    socket.write("220 mail.a-l-l-a-h.com ESMTP Stalwart\r\n");
  });
  const mailer = createMailer(mailConfig(server.port), { deadlineMs: 250 });
  try {
    await assert.rejects(
      () => mailer.sendPasswordReset(resetMail),
      (error: unknown) =>
        error instanceof MailDeliveryError && /timed out/.test(error.message),
    );
  } finally {
    mailer.close();
    await server.stop();
  }
});

void test("a rejected submission surfaces the server reason, never the credential", async () => {
  const server = await stub((socket) => {
    socket.end("421 4.7.0 Too many messages from this client\r\n");
  });
  const mailer = createMailer(mailConfig(server.port), { deadlineMs: 5_000 });
  try {
    await assert.rejects(
      () => mailer.sendPasswordReset(resetMail),
      (error: unknown) => {
        if (!(error instanceof MailDeliveryError)) return false;
        assert.equal(error.message.includes(password), false);
        assert.equal(error.message.includes("Too many messages"), true);
        return true;
      },
    );
  } finally {
    mailer.close();
    await server.stop();
  }
});
