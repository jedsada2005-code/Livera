import { createSeed, makePayment, voidPayment } from '../domain/ledger';
import type { Attachment, Payment, PaymentDraft } from '../domain/ledger';

const DB_NAME = 'livera-round1-demo';
let pending: Promise<IDBDatabase> | undefined;
const request = <T>(value: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  value.onsuccess = () => resolve(value.result);
  value.onerror = () => reject(value.error);
});
const completed = (tx: IDBTransaction) => new Promise<void>((resolve, reject) => {
  tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error ?? new Error('ไม่สามารถบันทึกข้อมูลได้'));
});
export function openDatabase() {
  if (!pending) pending = new Promise<IDBDatabase>((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, 1);
    opening.onupgradeneeded = () => {
      opening.result.createObjectStore('payments', { keyPath: 'id' });
      opening.result.createObjectStore('attachments', { keyPath: 'id' });
      opening.result.createObjectStore('meta');
    };
    opening.onerror = () => { pending = undefined; reject(opening.error); };
    opening.onblocked = () => { pending = undefined; reject(new Error('ปิดแท็บ LIVERA อื่นแล้วลองอีกครั้ง')); };
    opening.onsuccess = () => {
      const db = opening.result;
      db.onversionchange = () => { db.close(); pending = undefined; };
      resolve(db);
    };
  });
  return pending;
}
export async function loadPayments() {
  const db = await openDatabase();
  const tx = db.transaction(['payments', 'meta'], 'readwrite');
  const done = completed(tx);
  try {
    const initialized = await request(tx.objectStore('meta').get('initialized'));
    if (!initialized) {
      createSeed().forEach(entry => tx.objectStore('payments').put(entry));
      tx.objectStore('meta').put(true, 'initialized');
    }
    const entries = await request(tx.objectStore('payments').getAll()) as Payment[];
    await done;
    return entries;
  } catch (error) {
    try { tx.abort(); } catch { /* A failed read may already have aborted. */ }
    await done.catch(() => undefined);
    throw error;
  }
}
export async function validateFile(file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error('ไฟล์ต้องมีขนาดไม่เกิน 5 MB');
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const text = String.fromCharCode(...bytes);
  let type = '';
  if (bytes[0] === 0x89 && text.slice(1, 4) === 'PNG') type = 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) type = 'image/jpeg';
  if (text.startsWith('RIFF') && text.slice(8, 12) === 'WEBP') type = 'image/webp';
  if (text.startsWith('%PDF-')) type = 'application/pdf';
  if (!type) throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP และ PDF');
  return { id: crypto.randomUUID(), name: file.name.slice(0, 150), size: file.size, type } satisfies Attachment;
}
export async function savePayment(draft: PaymentDraft, file?: File) {
  const attachment = file ? await validateFile(file) : undefined;
  const db = await openDatabase();
  const tx = db.transaction(['payments', 'attachments'], 'readwrite');
  const done = completed(tx);
  try {
    const entries = await request(tx.objectStore('payments').getAll()) as Payment[];
    // Revalidate against the latest ledger inside the same transaction, including other tabs.
    const payment = makePayment(draft, entries, attachment);
    tx.objectStore('payments').add(payment);
    if (attachment && file) tx.objectStore('attachments').add({ id: attachment.id, blob: file });
    await done;
    return payment;
  } catch (error) {
    try { tx.abort(); } catch { /* A failed write may already have aborted. */ }
    await done.catch(() => undefined);
    throw error;
  }
}
export async function cancelPayment(id: string, reason: string) {
  const db = await openDatabase();
  const tx = db.transaction('payments', 'readwrite');
  const done = completed(tx);
  try {
    const old = await request(tx.objectStore('payments').get(id)) as Payment | undefined;
    if (!old) throw new Error('ไม่พบรายการที่ต้องการยกเลิก');
    const entry = voidPayment(old, reason);
    tx.objectStore('payments').put(entry);
    await done;
    return entry;
  } catch (error) {
    try { tx.abort(); } catch { /* Already aborted. */ }
    await done.catch(() => undefined);
    throw error;
  }
}
export async function loadAttachment(id: string): Promise<Blob> {
  const db = await openDatabase();
  const stored = await request(db.transaction('attachments').objectStore('attachments').get(id));
  if (!stored?.blob) throw new Error('ไม่พบไฟล์ในเบราว์เซอร์นี้ อาจถูกล้างข้อมูลไปแล้ว');
  return stored.blob;
}
export async function resetPayments() {
  const db = await openDatabase();
  const tx = db.transaction(['payments', 'attachments', 'meta'], 'readwrite');
  const done = completed(tx);
  tx.objectStore('payments').clear(); tx.objectStore('attachments').clear();
  createSeed().forEach(entry => tx.objectStore('payments').put(entry));
  tx.objectStore('meta').put(true, 'initialized');
  await done;
}
