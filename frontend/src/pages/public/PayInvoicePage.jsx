import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import FaIcon from '../../components/FaIcon';
import { publicInvoicePay } from '../../services/api';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PayInvoicePage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicInvoicePay
      .info(token)
      .then((r) => setInfo(r.data || r))
      .catch((e) => setError(e.message || 'Invoice not found'))
      .finally(() => setLoading(false));
  }, [token]);

  const upiQr = useMemo(() => {
    if (!info?.upi_id || Number(info.amount_due) <= 0) return null;
    const data = `upi://pay?pa=${encodeURIComponent(info.upi_id)}&am=${encodeURIComponent(String(info.amount_due))}&cu=INR&tn=${encodeURIComponent(info.invoice_number || 'Invoice')}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(data)}`;
  }, [info]);

  const payOnline = async () => {
    if (!token) return;
    setPaying(true);
    try {
      const orderRes = await publicInvoicePay.order(token);
      const order = orderRes.data || orderRes;
      if (!window.Razorpay) {
        toast.error('Payment SDK not loaded. Refresh and try again.');
        return;
      }
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: info?.clinic_name || 'The Urban Physio',
        description: `Invoice ${order.invoice_number || info?.invoice_number || ''}`,
        order_id: order.order_id,
        handler: () => {
          toast.success('Payment submitted — clinic will confirm shortly');
          setInfo((prev) => (prev ? { ...prev, status: 'paid', amount_due: 0 } : prev));
        },
        modal: { ondismiss: () => toast('Payment cancelled') },
      });
      rzp.open();
    } catch (e) {
      toast.error(e.message || 'Could not start payment');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-2xl bg-white shadow-lg p-8 text-center">
          <FaIcon icon="fa-link-slash" className="text-3xl text-rose-400 mb-3" />
          <h1 className="text-xl font-bold text-slate-900">Link unavailable</h1>
          <p className="text-sm text-slate-500 mt-2">{error || 'This invoice payment link is invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  const due = Number(info.amount_due) || 0;
  const paidOff = due <= 0 || info.status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-100 py-10 px-4">
      <div className="max-w-lg mx-auto rounded-3xl bg-white shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-teal-700 text-white px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-teal-100">Secure invoice payment</p>
          <h1 className="text-xl font-bold mt-1">{info.clinic_name}</h1>
          <p className="text-sm text-teal-100 mt-1">{info.invoice_number}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] uppercase text-slate-400 font-semibold">Total</p>
              <p className="text-lg font-bold text-slate-900">{money(info.grand_total)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-[11px] uppercase text-amber-600 font-semibold">Due</p>
              <p className="text-lg font-bold text-amber-700">{money(due)}</p>
            </div>
          </div>

          {Array.isArray(info.line_items) && info.line_items.length > 0 && (
            <ul className="text-sm divide-y border rounded-xl overflow-hidden">
              {info.line_items.map((it, i) => (
                <li key={i} className="flex justify-between gap-3 px-3 py-2">
                  <span className="text-slate-700 truncate">{it.description || 'Item'}</span>
                  <span className="font-medium whitespace-nowrap">{money((it.qty || 1) * (it.unit_price || 0))}</span>
                </li>
              ))}
            </ul>
          )}

          {paidOff ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center text-emerald-800 font-semibold">
              <FaIcon icon="fa-circle-check" className="mr-2" /> Paid in full
            </div>
          ) : (
            <>
              {info.razorpay_key_id && (
                <button
                  type="button"
                  disabled={paying}
                  onClick={payOnline}
                  className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 disabled:opacity-60"
                >
                  {paying ? 'Opening checkout…' : 'Pay securely online'}
                </button>
              )}

              {upiQr && (
                <div className="flex flex-col items-center gap-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Or scan UPI QR</p>
                  <img src={upiQr} alt="UPI QR" className="w-40 h-40 rounded-xl border" />
                  <p className="text-sm text-slate-600">{info.upi_id}</p>
                </div>
              )}

              {info.payment_link && info.payment_link.includes('razorpay') && (
                <a
                  href={info.payment_link}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-sm text-teal-700 underline"
                >
                  Open Razorpay payment link
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
