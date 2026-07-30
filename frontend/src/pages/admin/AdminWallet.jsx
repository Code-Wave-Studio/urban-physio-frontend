import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminDashboardLayout from '../../layouts/AdminDashboardLayout';
import { admin } from '../../services/api';

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const emptyOp = { user_id: '', amount: '', reason: '', status: 'active' };

export default function AdminWallet() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [settings, setSettings] = useState({});
  const [ledger, setLedger] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('overview');
  const [op, setOp] = useState(emptyOp);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      admin.walletOverview(),
      admin.walletSettings(),
      admin.walletLedger({ q }),
    ])
      .then(([o, s, l]) => {
        setOverview(o.data);
        setSettings(s.data || {});
        setLedger(l.data?.transactions || []);
      })
      .catch((e) => toast.error(e.message || 'Failed to load wallet admin'))
      .finally(() => setLoading(false));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const saveSettings = async () => {
    try {
      const res = await admin.updateWalletSettings(settings);
      setSettings(res.data || settings);
      toast.success('Settings saved');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    }
  };

  const runCredit = async () => {
    try {
      await admin.walletCredit({
        user_id: Number(op.user_id),
        amount: Number(op.amount),
        reason: op.reason || 'Admin credit',
      });
      toast.success('Credited');
      setOp(emptyOp);
      load();
    } catch (e) {
      toast.error(e.message || 'Credit failed');
    }
  };

  const runDebit = async () => {
    try {
      await admin.walletDebit({
        user_id: Number(op.user_id),
        amount: Number(op.amount),
        reason: op.reason || 'Admin debit',
      });
      toast.success('Debited');
      setOp(emptyOp);
      load();
    } catch (e) {
      toast.error(e.message || 'Debit failed');
    }
  };

  const runStatus = async () => {
    try {
      await admin.walletSetStatus({ user_id: Number(op.user_id), status: op.status });
      toast.success('Status updated');
      load();
    } catch (e) {
      toast.error(e.message || 'Status update failed');
    }
  };

  const t = overview?.totals || {};
  const top = overview?.top_users || [];
  const daily = overview?.daily_30d || [];

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Wallet</h1>
          <p className="text-sm text-slate-500 mt-1">Balances, ledger, manual credit/debit, and wallet settings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['overview', 'operations', 'ledger', 'settings'].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize border ${
                tab === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {k}
            </button>
          ))}
          <button type="button" onClick={load} className="ml-auto text-sm text-teal-700 hover:underline">
            Refresh
          </button>
        </div>

        {loading && <p className="text-slate-500">Loading…</p>}

        {!loading && tab === 'overview' && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ['Wallets', t.wallets],
                ['Total available', inr(t.total_available)],
                ['Lifetime credits', inr(t.total_credits)],
                ['Lifetime debits', inr(t.total_debits)],
                ['Refunds to wallet', inr(t.total_refunds)],
                ['Recharge volume', inr(overview?.recharge_volume)],
              ].map(([label, val]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="text-xl font-semibold mt-1">{val}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold mb-3">Top wallet balances</h3>
                <div className="space-y-2">
                  {top.length === 0 && <p className="text-sm text-slate-500">No wallets yet</p>}
                  {top.map((u) => (
                    <div key={u.user_id} className="flex justify-between text-sm border-b border-slate-100 py-2">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-slate-500 text-xs">{u.email} · user #{u.user_id}</div>
                      </div>
                      <div className="text-right font-semibold">{inr(u.available_balance)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="font-semibold mb-3">30-day credit / debit</h3>
                <div className="flex items-end gap-1 h-36 overflow-x-auto">
                  {daily.map((d) => {
                    const max = Math.max(1, ...daily.map((x) => Math.max(Number(x.credits), Number(x.debits))));
                    return (
                      <div key={d.day} className="flex gap-0.5 items-end min-w-[12px]" title={d.day}>
                        <div className="w-1.5 bg-emerald-500 rounded-t" style={{ height: `${(Number(d.credits) / max) * 100}%` }} />
                        <div className="w-1.5 bg-rose-400 rounded-t" style={{ height: `${(Number(d.debits) / max) * 100}%` }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && tab === 'operations' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 max-w-xl space-y-3">
            <h3 className="font-semibold">Manual operations</h3>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="User ID"
              value={op.user_id}
              onChange={(e) => setOp({ ...op, user_id: e.target.value })}
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Amount"
              value={op.amount}
              onChange={(e) => setOp({ ...op, amount: e.target.value })}
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Reason"
              value={op.reason}
              onChange={(e) => setOp({ ...op, reason: e.target.value })}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={runCredit} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm">Credit</button>
              <button type="button" onClick={runDebit} className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm">Debit</button>
            </div>
            <div className="flex gap-2 items-center pt-2 border-t">
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={op.status}
                onChange={(e) => setOp({ ...op, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="frozen">Frozen</option>
                <option value="suspended">Suspended</option>
              </select>
              <button type="button" onClick={runStatus} className="px-4 py-2 rounded-lg border text-sm">Set status</button>
            </div>
          </div>
        )}

        {!loading && tab === 'ledger' && (
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="p-4 border-b flex gap-2">
              <input
                className="border rounded-lg px-3 py-1.5 text-sm flex-1"
                placeholder="Search email, name, txn ref…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="button" onClick={load} className="px-3 py-1.5 text-sm border rounded-lg">Search</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-2 whitespace-nowrap">{String(row.created_at || '').slice(0, 16)}</td>
                      <td className="px-3 py-2">{row.user_name}<div className="text-xs text-slate-500">{row.email}</div></td>
                      <td className="px-3 py-2 capitalize">{String(row.type).replace(/_/g, ' ')}</td>
                      <td className={`px-3 py-2 ${row.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.direction === 'credit' ? '+' : '-'}{inr(row.amount)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{row.txn_ref}</td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && tab === 'settings' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 max-w-lg space-y-3">
            <h3 className="font-semibold">Wallet settings</h3>
            {[
              ['enabled', 'Wallet enabled'],
              ['split_payment_enabled', 'Split payment (wallet + Razorpay)'],
              ['refund_to_wallet_on_cancel', 'Auto-refund to wallet on cancel'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
            {[
              ['min_recharge', 'Min recharge'],
              ['max_recharge', 'Max recharge'],
              ['signup_bonus', 'Signup bonus'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="text-slate-600">{label}</span>
                <input
                  type="number"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={settings[key] ?? ''}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                />
              </label>
            ))}
            <button type="button" onClick={saveSettings} className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm">
              Save settings
            </button>
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
}
