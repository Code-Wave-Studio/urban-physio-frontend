import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import FaIcon from '../../components/FaIcon';
import InvoiceModal from '../../components/InvoiceModal';
import { PATIENT_NAV } from '../../constants/patientNav';
import { patientPortal, payments } from '../../services/api';

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

const STATUS_STYLE = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200',
  partial_refund: 'bg-violet-50 text-violet-700 border-violet-200',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PatientBills() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = () => {
    setLoading(true);
    patientPortal
      .bills()
      .then((r) => setData(r.data))
      .catch((e) => toast.error(e.message || 'Could not load bills'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const s = data?.summary || {};
  const bills = (data?.bills || []).filter((b) => (filter === 'all' ? true : b.status === filter));

  const payNow = async (bill) => {
    // Clinic invoices: use magic payment link (no appointment Razorpay order)
    if (bill.source === 'clinic_invoice') {
      if (bill.payment_link) {
        window.open(bill.payment_link, '_blank', 'noopener,noreferrer');
        return;
      }
      toast.error('Payment link not available yet — contact the clinic');
      return;
    }
    try {
      const orderRes = await payments.createOrder(bill.appointment_id);
      const order = orderRes.data;
      if (order?.paid_via_wallet) {
        toast.success('Paid from wallet — booking confirmed');
        load();
        return;
      }
      if (!window.Razorpay) {
        toast.error('Payment SDK not loaded. Refresh and try again.');
        return;
      }
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'The Urban Physio',
        description: `Invoice ${bill.invoice_number || ''}`,
        order_id: order.order_id,
        handler: async (resp) => {
          try {
            await payments.verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            toast.success('Payment successful');
            load();
          } catch (err) {
            toast.error(err.message || 'Verification failed');
          }
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Could not start payment');
    }
  };

  return (
    <DashboardLayout links={PATIENT_NAV} variant="patient">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Bills & Payments</h1>
        <p className="text-sm text-slate-500 mt-1">All your invoices, receipts, payments and refunds in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="glass-card !p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Total Paid</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{loading ? '…' : inr(s.total_paid)}</p>
        </div>
        <div className="glass-card !p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Amount Due</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{loading ? '…' : inr(s.total_due)}</p>
        </div>
        <div className="glass-card !p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Refunded</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{loading ? '…' : inr(s.total_refunded)}</p>
        </div>
        <div className="glass-card !p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">Total Invoices</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{loading ? '…' : s.count || 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {['all', 'paid', 'pending', 'refunded'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border capitalize transition ${
              filter === f ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="glass-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <FaIcon icon="fa-spinner" className="fa-spin text-2xl" />
          </div>
        ) : bills.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <FaIcon icon="fa-file-invoice" className="text-3xl mb-2" />
            <p className="text-sm">No bills to show.</p>
          </div>
        ) : (
          <div className="overflow-x-auto portal-table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-400 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-4 py-2.5">Invoice</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Doctor</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={`${b.source || 'payment'}-${b.id}`} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{b.invoice_number || `#${b.id}`}</p>
                      <p className="text-xs text-slate-400">{b.clinic_name || b.booking_id}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{fmtDate(b.paid_at || b.created_at)}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {b.source === 'clinic_invoice' ? (b.clinic_name || 'Clinic') : `Dr. ${b.doctor_name}`}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {inr(b.amount)}
                      {Number(b.amount_due) > 0 && b.status === 'pending' && (
                        <span className="block text-[11px] text-amber-600">Due {inr(b.amount_due)}</span>
                      )}
                      {Number(b.refund_amount) > 0 && (
                        <span className="block text-[11px] text-violet-600">-{inr(b.refund_amount)} refunded</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[b.status] || STATUS_STYLE.pending}`}>
                        {String(b.status).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {b.status === 'paid' && b.source !== 'clinic_invoice' && b.appointment_id ? (
                        <button
                          type="button"
                          onClick={() => setInvoiceId(b.appointment_id)}
                          className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-semibold text-xs"
                        >
                          <FaIcon icon="fa-receipt" /> Invoice
                        </button>
                      ) : b.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => payNow(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs px-2.5 py-1.5"
                        >
                          <FaIcon icon="fa-credit-card" /> Pay now
                        </button>
                      ) : b.source === 'clinic_invoice' && b.payment_link ? (
                        <a
                          href={b.payment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-semibold text-xs"
                        >
                          <FaIcon icon="fa-arrow-up-right-from-square" /> Open
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal appointmentId={invoiceId} open={!!invoiceId} onClose={() => setInvoiceId(null)} />
    </DashboardLayout>
  );
}
