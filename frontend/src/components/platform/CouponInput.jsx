import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { coupons } from '../../services/api';

export default function CouponInput({ amount, consultationType = 'all', onApplied, onClear }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(null);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await coupons.validate({ code: code.trim(), amount, consultation_type: consultationType });
      setApplied(res.data ?? res);
      onApplied?.(res.data ?? res);
      toast.success('Coupon applied!');
    } catch (err) {
      toast.error(err.message || 'Invalid coupon');
      setApplied(null);
      onClear?.();
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setApplied(null);
    setCode('');
    onClear?.();
  };

  return (
    <div className="glass-card p-4">
      <label className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
        <FaIcon icon="fa-tag" className="text-orange-500" />
        Promo code
      </label>
      {applied ? (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div>
            <p className="font-bold text-emerald-800 text-sm">{applied.code}</p>
            <p className="text-xs text-emerald-700">−₹{applied.discount_amount} · Pay ₹{applied.final_amount}</p>
          </div>
          <button type="button" onClick={clear} className="text-xs text-red-600 font-semibold">Remove</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input className="input-field flex-1 uppercase" placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <button type="button" onClick={apply} disabled={loading} className="btn-outline shrink-0 px-4">{loading ? '…' : 'Apply'}</button>
        </div>
      )}
    </div>
  );
}
