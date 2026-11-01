import { createTransport, type Mail } from "nodemailer";
import type { SmtpMailConfig } from "./mail-config.js";
import { passwordResetEmail, type EmailBody } from "./mail-templates.js";

export const MAIL_SEND_DEADLINE_MS = 10_000;

export class MailDeliveryError extends Error {}

export interface PasswordResetMail {
  to: string;
  name: string;
  resetUrl: string;
  ttlMinutes: number;
}

export interface MailSender {
  sendPasswordReset(mail: PasswordResetMail): Promise<void>;
  close(): void;
}

export interface MailerOptions {
  deadlineMs?: number;
}

function mailBody(input: PasswordResetMail): EmailBody {
  return passwordResetEmail({
    name: input.name,
    resetUrl: input.resetUrl,
    ttlMinutes: input.ttlMinutes,
  });
}

/**
 * Stalwart owns queueing, so a submission failure is reported to the caller
 * after one attempt instead of blocking this request on retries.
 */
async function deliver(
  transport: Mail,
  message: { from: string; to: string; subject: string; text: string; html: string },
  deadlineMs: number,
): Promise<void> {
  const pending = transport.sendMail(message);
  // The send keeps running after the deadline; swallow it so it cannot reject unhandled.
  pending.catch(() => undefined);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new MailDeliveryError("SMTP submission timed out.")),
      deadlineMs,
    );
  });

  try {
    await Promise.race([pending, deadline]);
  } catch (error) {
    if (error instanceof MailDeliveryError) throw error;
    const code = (error as { code?: string }).code ?? "UNKNOWN";
    const response = (error as { response?: string }).response ?? "";
    const command = (error as { command?: string }).command ?? "";
    throw new MailDeliveryError(
      `SMTP submission failed (${code} ${command} ${response})`.trim(),
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function createMailer(
  config: SmtpMailConfig,
  options: MailerOptions = {},
): MailSender {
  const deadlineMs = options.deadlineMs ?? MAIL_SEND_DEADLINE_MS;
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.username, pass: config.password },
    pool: true,
    maxConnections: 1,
    maxMessages: Infinity,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  return {
    async sendPasswordReset(mail) {
      const body = mailBody(mail);
      await deliver(
        transport,
        { from: config.from, to: mail.to, ...body },
        deadlineMs,
      );
    },
    close() {
      transport.close();
    },
  };
}
