/** Utils ฝั่ง client ล้วน (ไม่ import next-auth/crypto — ใช้ใน component ได้ปลอดภัย) */
export const formatThaiDate = (d: string | Date) =>
  new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
