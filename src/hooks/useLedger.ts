import { useCallback, useEffect, useMemo, useState } from 'react';
import * as database from '../data/database';
import { createSeed, summarize } from '../domain/ledger';
import type { Payment, PaymentDraft } from '../domain/ledger';

const channelName = 'livera-demo-ledger';
function broadcast() {
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(channelName); channel.postMessage('changed'); channel.close();
  }
}
export function useLedger() {
  const [entries, setEntries] = useState<Payment[]>(createSeed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try { setEntries(await database.loadPayments()); setError(''); }
    catch { setError('เบราว์เซอร์นี้ยังเก็บข้อมูลไม่ได้ จึงแสดงข้อมูลตั้งต้นและปิดการบันทึก กรุณาลองใหม่หรือเปิดด้วยเบราว์เซอร์ปกติ'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refresh();
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;
    if (channel) channel.onmessage = () => void refresh();
    const focus = () => void refresh(); window.addEventListener('focus', focus);
    return () => { channel?.close(); window.removeEventListener('focus', focus); };
  }, [refresh]);
  const add = async (draft: PaymentDraft, file?: File) => {
    const payment = await database.savePayment(draft, file); await refresh(); broadcast(); return payment;
  };
  const cancel = async (id: string, reason: string) => { await database.cancelPayment(id, reason); await refresh(); broadcast(); };
  const reset = async () => { await database.resetPayments(); await refresh(); broadcast(); };
  const policies = useMemo(() => summarize(entries), [entries]);
  const totals = useMemo(() => ({ paid: policies.reduce((sum, item) => sum + Math.round(item.paid * 100), 0) / 100, remaining: policies.reduce((sum, item) => sum + Math.round((item.remaining ?? 0) * 100), 0) / 100, pending: entries.filter(entry => entry.status === 'pending').length }), [policies, entries]);
  return { entries, policies, totals, loading, error, refresh, add, cancel, reset };
}
export type Ledger = ReturnType<typeof useLedger>;
