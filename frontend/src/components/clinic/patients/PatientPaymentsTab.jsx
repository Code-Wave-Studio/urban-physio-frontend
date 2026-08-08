import { useState } from 'react';
import toast from 'react-hot-toast';
import FaIcon from '../../FaIcon';
import { clinicPortal } from '../../../services/api';

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
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
        payment_method: paymentMethod,
        payment_channel: 'offline',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FaIcon icon="fa-hand-holding-dollar" className="text-emerald-600 text-sm" />
                Record Manual Payment
              </h3>
              <button type="button" onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-600 text-sm p-1">
                <FaIcon icon="fa-xmark" />
              </button>
            </div>

            <form onSubmit={submitRecordPayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Appointment *</label>
                <select
                  required
                  className="input-field text-xs py-2 w-full font-medium"
                  value={selectedApptId}
                  onChange={(e) => handleApptChange(e.target.value)}
                >
                  <option value="">-- Choose Appointment --</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.booking_id || `Appt #${a.id}`} · {a.appointment_date} · {money(a.amount)} ({a.payment_status || 'unpaid'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Collected (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  className="input-field text-xs py-2 w-full font-bold text-slate-900"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method *</label>
                <select
                  className="input-field text-xs py-2 w-full font-medium"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="bank_transfer">Bank Transfer / NEFT</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Reference / Transaction Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/123456789 or Receipt #"
                  className="input-field text-xs py-2 w-full font-mono"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Notes (Optional)</label>
                <textarea
                  className="input-field text-xs w-full py-1.5 resize-none"
                  rows={2}
                  placeholder="e.g. Collected at reception desk"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowRecordModal(false)} className="btn-outline text-xs py-2 px-4">
                  Cancel
                </button>
                <button type="submit" disabled={recording} className="btn-primary text-xs py-2 px-5">
                  {recording ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
