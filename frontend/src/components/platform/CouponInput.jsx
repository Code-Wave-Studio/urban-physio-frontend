import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../FaIcon';
import { coupons } from '../../services/api';

/**
 * @param {{ amount: number, consultationType?: string, orderType?: 'appointment' | 'package', onApplied?: (data: object) => void, onClear?: () => void, className?: string }} props
 */
export default function CouponInput({
  amount,
  consultationType = 'all',
  orderType = 'appointment',
  onApplied,
  onClear,
  className = '',
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(null);

  const validateType = orderType === 'package' ? 'package' : consultationType;

  const apply = async () => {
    if (!code.trim()) return;
    if (!amount || amount <= 0) {
      toast.error('Enter booking amount before applying a coupon');
      return;
    }
    setLoading(true);
    try {
      const res = await coupons.validate({
        code: code.trim(),
        amount,
        consultation_type: validateType,
      });
      const data = res.data ?? res;
      setApplied(data);
      onApplied?.(data);
      toast.success('Promo code applied!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid coupon');
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
    <div className={`rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 to-amber-50/50 p-4 sm:p-5 ${className}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
          <FaIcon icon="fa-tag" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">Have a promo code?</p>
          <p className="text-xs text-slate-600 mt-0.5">Apply a valid coupon to save on this booking</p>
        </div>
      </div>

      {applied ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-emerald-200 shadow-sm">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-bold tracking-wide">
                <FaIcon icon="fa-check" className="text-xs" />
                {applied.code}
              </span>
              {applied.title && <span className="text-xs text-slate-600 truncate">{applied.title}</span>}
            </div>
            <p className="text-sm text-slate-700 mt-2">
              You save <strong className="text-emerald-700">₹{Number(applied.discount_amount).toLocaleString('en-IN')}</strong>
              {' · '}
              Pay <strong>₹{Number(applied.final_amount).toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <button type="button" onClick={clear} className="btn-outline text-sm shrink-0 border-red-200 text-red-700 hover:bg-red-50">
            Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input-field flex-1 uppercase tracking-wider font-medium"
            placeholder="e.g. WELCOME10"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), apply())}
          />
          <button
            type="button"
            onClick={apply}
            disabled={loading || !code.trim()}
            className="btn-primary shrink-0 px-6 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <FaIcon icon="fa-spinner" className="fa-spin" /> Checking…
              </span>
            ) : (
              'Apply code'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
