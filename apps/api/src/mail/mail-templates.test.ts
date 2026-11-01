import assert from "node:assert/strict";
import test from "node:test";
import { escapeHtml, passwordResetEmail } from "./mail-templates.js";

void test("the reset email carries one link in both parts and names the expiry", () => {
  const mail = passwordResetEmail({
    name: "Bjo",
    resetUrl: "https://a-l-l-a-h.com/?mode=reset&token=abc123",
    ttlMinutes: 30,
  });
  assert.equal(mail.subject, "Atur ulang kata sandi MoonWitness");
  assert.equal(mail.text.split("https://a-l-l-a-h.com/?mode=reset&token=abc123").length - 1, 1);
  assert.match(mail.text, /berlaku 30 menit/);
  assert.match(mail.html, /href="https:\/\/a-l-l-a-h\.com\/\?mode=reset&amp;token=abc123"/);
  assert.match(mail.html, /hanya bisa dipakai sekali/);
});

void test("a crafted display name cannot inject markup into the html part", () => {
  const malicious = `<script>alert("x")</script>`;
  const mail = passwordResetEmail({
    name: malicious,
    resetUrl: "https://a-l-l-a-h.com/?mode=reset&token=abc123",
    ttlMinutes: 30,
  });
  assert.equal(mail.html.includes("<script>"), false);
  assert.equal(mail.html.includes("&lt;script&gt;"), true);
  assert.equal(escapeHtml("a & b < c > d \" e ' f"), "a &amp; b &lt; c &gt; d &quot; e &#39; f");
});
