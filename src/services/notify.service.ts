/**
 * Notification — แจ้งเตือน Admin เมื่อมีเรื่องร้องเรียนใหม่
 * - LINE: ผ่าน LINE Messaging API (push message)
 * - Email: ผ่าน Resend API
 * ทั้งสองช่องทางเป็น optional — ถ้าไม่ตั้งค่า ENV จะข้ามอย่างเงียบ ๆ
 */

export async function notifyLine(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_ADMIN_USER_ID;
  if (!token || !to) return;
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, messages: [{ type: 'text', text: message }] }),
    });
  } catch (e) {
    console.error('LINE notify ล้มเหลว:', e);
  }
}

export async function notifyEmail(subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!key || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: 'Ethics Tree <noreply@resend.dev>', to, subject, html }),
    });
  } catch (e) {
    console.error('Email notify ล้มเหลว:', e);
  }
}
