import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function ModalScrollLock({ children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return children;
}

export default function PatientPaymentsTab({ clinicId, patientKey, data, onRefresh }) {
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);

  const appointments = data?.appointments || [];
  const payments = data?.payments || [];
  const summary = data?.billing_summary || {};

  const unpaidAppointments = appointments.filter(
    (a) => a.payment_status !== 'paid' && a.status !== 'cancelled' && (floatAmt(a.amount) > 0)
  );

  function floatAmt(val) {
    return parseFloat(val || 0) || 0;
  }

  const openRecordModalForAppt = (appt) => {
    setSelectedApptId(String(appt.id));
    setAmount(String(appt.amount || ''));
    setPaymentMethod('cash');
    setReferenceNumber('');
    setNotes('');
    setShowRecordModal(true);
  };

  const handleApptChange = (idStr) => {
    setSelectedApptId(idStr);
    const found = appointments.find((a) => String(a.id) === String(idStr));
    if (found) {
      setAmount(String(found.amount || ''));
    }
  };

  const submitRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedApptId) {
      return toast.error('Please select an appointment');
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return toast.error('Enter a valid payment amount');
    }

    setRecording(true);
    try {
      await clinicPortal.billingCollect(clinicId, {
        appointment_id: Number(selectedApptId),
        amount: numAmount,
        method: paymentMethod,
        payment_method: paymentMethod,
        channel: 'offline',
        payment_channel: 'offline',
        reference_number: referenceNumber.trim() || null,
        transaction_id: referenceNumber.trim() || null,
        notes: notes.trim() || null,
      });

      toast.success('Payment recorded successfully!');
      setShowRecordModal(false);
      if (typeof onRefresh === 'function') {
        onRefresh();
      }
    } catch (err) {
      toast.error(err.message || 'Could not record payment');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Billing Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">Total Billed</p>
          <p className="text-lg font-bold text-slate-900 mt-0.5">{money(summary.total_amount)}</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
          <p className="text-xs text-emerald-800 font-medium">Total Paid</p>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">{money(summary.total_paid)}</p>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-xs">
          <p className="text-xs text-rose-800 font-medium">Outstanding Balance</p>
          <p className="text-lg font-bold text-rose-700 mt-0.5">{money(summary.outstanding_amount)}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
          <p className="text-xs text-amber-800 font-medium">Pending Due</p>
          <p className="text-lg font-bold text-amber-700 mt-0.5">{money(summary.pending_amount)}</p>
          {summary.next_due_date && (
            <p className="text-[10px] text-amber-600 font-semibold mt-1">
              Next due: {summary.next_due_date}
            </p>
          )}
        </div>
      </div>

      {/* Payment Action Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Payment Records & History</h3>
          <p className="text-xs text-slate-500">Record manual offline payments or view transaction logs</p>
        </div>

        <button
          type="button"
          className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1.5 shadow-xs"
          onClick={() => {
            if (unpaidAppointments.length > 0) {
              openRecordModalForAppt(unpaidAppointments[0]);
            } else {
              setSelectedApptId('');
              setAmount('');
              setShowRecordModal(true);
            }
          }}
        >
          <FaIcon icon="fa-hand-holding-dollar" />
          <span>Record Manual Payment</span>
        </button>
      </div>

      {/* Payments History Table */}
      {!payments.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          <FaIcon icon="fa-receipt" className="text-3xl text-slate-300 mb-2 block mx-auto" />
          No payment transactions recorded for this patient.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Booking Ref</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Ref / Transaction #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((pay) => {
                  const status = (pay.status || 'paid').toLowerCase();
                  const isPaid = status === 'paid';
                  const method = (pay.method || pay.payment_method || 'cash').replace(/_/g, ' ');
                  const refNo = pay.reference_number || pay.receipt_number || pay.razorpay_payment_id || pay.transaction_id || '—';

                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-medium whitespace-nowrap text-slate-900">
                        {pay.created_at ? new Date(pay.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : pay.appointment_date || '—'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-700">
                        {pay.booking_id || `Appt #${pay.appointment_id || '—'}`}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 capitalize">
                        {pay.consultation_type?.replace(/_/g, ' ') || 'Visit'}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-medium text-slate-700 capitalize">
                        <span className="inline-flex items-center gap-1">
                          <FaIcon icon={method.includes('online') ? 'fa-globe' : method.includes('card') ? 'fa-credit-card' : method.includes('upi') ? 'fa-mobile' : 'fa-money-bill-wave'} className="text-[11px] text-slate-400" />
                          {method}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        {refNo}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {money(pay.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Manual Payment Modal */}
      {showRecordModal && (
        <ModalScrollLock>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/60 backdrop-blur-md overflow-y-auto transition-opacity animate-in fade-in duration-200"
            onClick={(e) => e.target === e.currentTarget && setShowRecordModal(false)}
          >
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100/90 my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
              {/* Sticky Top Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xs">
                    <FaIcon icon="fa-hand-holding-dollar" className="text-sm" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">Record Manual Payment</h3>
                    <p className="text-xs text-slate-500 font-normal">Collect offline cash, card, UPI or cheque payment</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all duration-200 hover:rotate-90"
                  title="Close modal"
                >
                  <FaIcon icon="fa-xmark" className="text-sm" />
                </button>
              </div>

              {/* Scrollable Form Body Container */}
              <form onSubmit={submitRecordPayment} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Select Appointment <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium transition-all shadow-xs"
                      value={selectedApptId}
                      onChange={(e) => handleApptChange(e.target.value)}
                    >
                      <option value="">-- Select Unpaid or Pending Appointment --</option>
                      {appointments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.booking_id || `Appt #${a.id}`} · {a.appointment_date} · {money(a.amount)} ({a.payment_status || 'unpaid'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Amount Collected (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="500"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 pl-9 pr-4 py-3 text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xs"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Payment Method <span className="text-rose-500">*</span>
                      </label>
                      <select
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium transition-all shadow-xs"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="card">💳 Credit / Debit Card</option>
                        <option value="upi">📱 UPI / QR Code</option>
                        <option value="bank_transfer">🏦 Bank Transfer / NEFT</option>
                        <option value="cheque">📝 Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Reference / Transaction No. <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/987654321 or Receipt #1042"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-xs sm:text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-xs"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Payment Notes <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/30 px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 resize-none transition-all shadow-xs"
                      rows={2}
                      placeholder="e.g. Received cash at reception counter..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sticky Bottom Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRecordModal(false)}
                    className="px-5 py-2.5 sm:py-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recording}
                    className="px-6 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-60 transition-all flex items-center gap-2"
                  >
                    {recording ? (
                      <>
                        <FaIcon icon="fa-spinner" className="animate-spin text-xs" />
                        Recording Payment…
                      </>
                    ) : (
                      <>
                        <FaIcon icon="fa-check" className="text-xs" />
                        Save & Record Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalScrollLock>
      )}
    </div>
  );
}
