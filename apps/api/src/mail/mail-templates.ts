export interface EmailBody {
  subject: string;
  text: string;
  html: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function passwordResetEmail(input: {
  name: string;
  resetUrl: string;
  ttlMinutes: number;
}): EmailBody {
  const subject = "Atur ulang kata sandi MoonWitness";
  const greeting = `Halo ${input.name},`;
  const expiry = `Tautan ini berlaku ${input.ttlMinutes} menit dan hanya bisa dipakai sekali.`;
  const ignore =
    "Kalau kamu tidak meminta perubahan ini, abaikan email ini. Kata sandi kamu tidak akan berubah.";

  return {
    subject,
    text: [
      greeting,
      "",
      "Kami menerima permintaan untuk mengatur ulang kata sandi akun MoonWitness kamu.",
      "Gunakan tautan berikut untuk membuat kata sandi baru:",
      "",
      input.resetUrl,
      "",
      expiry,
      "",
      ignore,
    ].join("\n"),
    html: [
      `<p>Halo ${escapeHtml(input.name)},</p>`,
      "<p>Kami menerima permintaan untuk mengatur ulang kata sandi akun MoonWitness kamu.</p>",
      `<p><a href="${escapeHtml(input.resetUrl)}">Atur ulang kata sandi</a></p>`,
      `<p>Kalau tombol di atas tidak bisa diklik, salin tautan ini ke browser:</p>`,
      `<p style="word-break:break-all">${escapeHtml(input.resetUrl)}</p>`,
      `<p>${expiry}</p>`,
      `<p>${ignore}</p>`,
    ].join(""),
  };
}
