import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import { PATIENT_NAV } from '../../constants/patientNav';
import { wallet } from '../../services/api';

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function openWalletRechargeCheckout(orderPayload) {
  const order = orderPayload?.data ?? orderPayload ?? {};
  const { order_id, amount, key_id } = order;
  return new Promise((resolve, reject) => {
    if (window.Razorpay && key_id) {
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency: 'INR',
        name: 'The Urban Physio',
        description: 'Wallet recharge',
        order_id,
        handler: async (response) => {
          try {
            const verified = await wallet.verifyRecharge({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve(verified);
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(Object.assign(new Error('Payment cancelled'), { code: 'DISMISS' })),
        },
      });
      rzp.on('payment.failed', () => reject(new Error('Payment failed')));
      rzp.open();
      return;
    }
    if (import.meta.env.DEV && order_id) {
      wallet
        .verifyRecharge({
          razorpay_order_id: order_id,
          razorpay_payment_id: 'pay_demo_' + Date.now(),
          razorpay_signature: 'demo',
        })
        .then(resolve)
        .catch(reject);
      return;
    }
    reject(new Error('Payment gateway unavailable'));
  });
}

export default function PatientWallet() {
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [txns, setTxns] = useState([]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [recharging, setRecharging] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([wallet.balance(), wallet.analytics(), wallet.history()])
      .then(([b, a, h]) => {
        setBalance(b.data);
        setAnalytics(a.data);
        setTxns(h.data?.transactions || []);
      })
      .catch((e) => toast.error(e.message || 'Could not load wallet'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const w = balance?.wallet || {};
  const settings = balance?.settings || {};
  const quick = settings.quick_amounts || [100, 250, 500, 1000, 2000, 5000, 10000];

  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (filter === 'credit' && t.direction !== 'credit') return false;
      if (filter === 'debit' && t.direction !== 'debit') return false;
      if (q) {
        const hay = `${t.txn_ref || ''} ${t.description || ''} ${t.type || ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [txns, filter, q]);

  const recharge = async (amount) => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setRecharging(true);
    try {
      const orderRes = await wallet.recharge(amt);
      await openWalletRechargeCheckout(orderRes);
      toast.success('Wallet credited');
      setCustomAmount('');
      load();
    } catch (err) {
      if (err?.code !== 'DISMISS') toast.error(err.message || 'Recharge failed');
    } finally {
      setRecharging(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['Txn Ref', 'Type', 'Direction', 'Amount', 'Balance After', 'Status', 'Date'],
      ...filtered.map((t) => [
        t.txn_ref,
        t.type,
        t.direction,
        t.amount,
        t.balance_after,
        t.status,
        t.created_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shell = dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900';
  const card = dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className={`-m-4 sm:-m-6 p-4 sm:p-6 min-h-[70vh] ${shell}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Urban Physio Wallet</h1>
            <p className={`text-sm ${muted}`}>Recharge, pay for bookings, and track every credit & debit.</p>
          </div>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${card}`}
          >
            <FaIcon icon={dark ? 'fa-sun' : 'fa-moon'} className="mr-2" />
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>

        {loading ? (
          <p className={muted}>Loading wallet…</p>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              <div
                className={`lg:col-span-2 rounded-2xl border p-6 relative overflow-hidden ${card}`}
                style={{
                  background: dark
                    ? 'linear-gradient(135deg,#0f172a 0%,#134e4a 55%,#0f766e 100%)'
                    : 'linear-gradient(135deg,#ecfdf5 0%,#ccfbf1 40%,#ffffff 100%)',
                }}
              >
                <p className={`text-sm ${muted}`}>Available balance</p>
                <p className="text-4xl font-bold mt-1 tracking-tight">{inr(w.available_balance)}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span>Locked: {inr(w.locked_balance)}</span>
                  <span>Pending: {inr(w.pending_balance)}</span>
                  <span className="capitalize">Status: {w.status || 'active'}</span>
                </div>
                <div className={`mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ${muted}`}>
                  <div>Lifetime credits<br /><strong className={dark ? 'text-white' : 'text-slate-800'}>{inr(w.lifetime_credits)}</strong></div>
                  <div>Lifetime debits<br /><strong className={dark ? 'text-white' : 'text-slate-800'}>{inr(w.lifetime_debits)}</strong></div>
                  <div>Refunds<br /><strong className={dark ? 'text-white' : 'text-slate-800'}>{inr(w.total_refunds)}</strong></div>
                  <div>Cashback<br /><strong className={dark ? 'text-white' : 'text-slate-800'}>{inr(w.cashback_earned)}</strong></div>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 ${card}`}>
                <h2 className="font-semibold mb-3">Add money</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {quick.map((a) => (
                    <button
                      key={a}
                      type="button"
                      disabled={recharging || !settings.enabled}
                      onClick={() => recharge(a)}
                      className="px-3 py-1.5 rounded-lg text-sm border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                    >
                      {inr(a)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={settings.min_recharge || 100}
                    max={settings.max_recharge || 50000}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Custom amount"
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'}`}
                  />
                  <button
                    type="button"
                    disabled={recharging || !settings.enabled}
                    onClick={() => recharge(customAmount)}
                    className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
                  >
                    {recharging ? '…' : 'Pay'}
                  </button>
                </div>
                <p className={`text-xs mt-2 ${muted}`}>
                  Min {inr(settings.min_recharge)} · Max {inr(settings.max_recharge)}
                </p>
                {balance?.referral_code && (
                  <p className={`text-xs mt-3 ${muted}`}>
                    Referral code: <strong className={dark ? 'text-teal-300' : 'text-teal-700'}>{balance.referral_code}</strong>
                    {' '}(reward {inr(settings.referral_reward_amount)})
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className={`rounded-xl border p-4 ${card}`}>
                <p className={`text-xs uppercase tracking-wide ${muted}`}>This month spent</p>
                <p className="text-xl font-semibold mt-1">{inr(analytics?.month_spent)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${card}`}>
                <p className={`text-xs uppercase tracking-wide ${muted}`}>This month received</p>
                <p className="text-xl font-semibold mt-1">{inr(analytics?.month_received)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${card}`}>
                <p className={`text-xs uppercase tracking-wide ${muted}`}>Referral earnings</p>
                <p className="text-xl font-semibold mt-1">{inr(w.referral_earnings)}</p>
              </div>
            </div>

            {(analytics?.trend_30d || []).length > 0 && (
              <div className={`rounded-xl border p-4 mb-6 ${card}`}>
                <h3 className="font-semibold mb-3">30-day activity</h3>
                <div className="flex items-end gap-1 h-28 overflow-x-auto">
                  {analytics.trend_30d.map((d) => {
                    const max = Math.max(
                      1,
                      ...analytics.trend_30d.map((x) => Number(x.credits) + Number(x.debits))
                    );
                    const h = ((Number(d.credits) + Number(d.debits)) / max) * 100;
                    return (
                      <div key={d.day} className="flex flex-col items-center gap-1 min-w-[10px]" title={`${d.day}: +${d.credits} / -${d.debits}`}>
                        <div className="w-2 rounded-t bg-teal-500" style={{ height: `${Math.max(4, h)}%` }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`rounded-xl border ${card}`}>
              <div className="flex flex-wrap items-center gap-3 p-4 border-b border-inherit">
                <h3 className="font-semibold flex-1">Transaction history</h3>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${dark ? 'bg-slate-800 border-slate-600' : ''}`}
                >
                  <option value="all">All</option>
                  <option value="credit">Credits</option>
                  <option value="debit">Debits</option>
                </select>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search…"
                  className={`rounded-lg border px-3 py-1.5 text-sm ${dark ? 'bg-slate-800 border-slate-600' : ''}`}
                />
                <button type="button" onClick={exportCsv} className="text-sm px-3 py-1.5 rounded-lg border hover:bg-teal-50">
                  Download Excel/CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={dark ? 'bg-slate-800/60' : 'bg-slate-50'}>
                    <tr className="text-left">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Ref</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`px-4 py-8 text-center ${muted}`}>No transactions yet</td>
                      </tr>
                    )}
                    {filtered.map((t) => (
                      <tr key={t.id} className="border-t border-slate-100/20">
                        <td className="px-4 py-2 whitespace-nowrap">{String(t.created_at || '').slice(0, 16).replace('T', ' ')}</td>
                        <td className="px-4 py-2 font-mono text-xs">{t.txn_ref}</td>
                        <td className="px-4 py-2 capitalize">{String(t.type || '').replace(/_/g, ' ')}</td>
                        <td className={`px-4 py-2 font-medium ${t.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.direction === 'credit' ? '+' : '-'}{inr(t.amount)}
                        </td>
                        <td className="px-4 py-2">{inr(t.balance_after)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
