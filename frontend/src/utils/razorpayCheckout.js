import toast from 'react-hot-toast';
import { appointments, payments } from '../services/api';

function bookingMeta(appt) {
  if (!appt?.booking_meta) return {};
  return typeof appt.booking_meta === 'object' ? appt.booking_meta : {};
}

/** True when Razorpay checkout is still required (not clinic COD / not already paid). */
export function isAwaitingOnlinePayment(appt) {
  if (!appt || appt.payment_status === 'paid') return false;
  if (appt.status !== 'pending') return false;

  const meta = bookingMeta(appt);
  const due = Number(meta.pay_now_amount ?? 0);

  if (meta.awaiting_online_payment === true) {
    return due > 0;
  }

  // Legacy rows before awaiting_online_payment flag
  if (due > 0 && (meta.payment_option === 'full_online' || meta.payment_option === 'partial_50')) {
    return true;
  }

  return false;
}

/** Amount due online now, or null if no online payment is pending. */
export function getOnlinePaymentDue(appt) {
  if (!isAwaitingOnlinePayment(appt)) return null;
  const meta = bookingMeta(appt);
  const due = Number(meta.pay_now_amount ?? 0);
  return due > 0 ? due : null;
}

/** Cash / pay-at-clinic / home balance still waiting for doctor to confirm */
export function hasOfflinePaymentPending(appt) {
  const meta = bookingMeta(appt);
  const due = Number(meta.pay_later_amount) || 0;
  if (due <= 0) return false;
  return (meta.offline_payment_status || 'pending') === 'pending';
}

/** Invoice only after online + offline (if any) are complete */
export function isInvoiceAvailable(appt) {
  if (!appt || appt.payment_status !== 'paid') return false;
  return !hasOfflinePaymentPending(appt);
}

/**
 * Open Razorpay checkout for a pending appointment payment.
 * Resolves when payment is verified; rejects on cancel/failure.
 */
export function openRazorpayCheckout(orderRes) {
  const payload = orderRes?.data ?? orderRes ?? {};
  const { order_id, amount, key_id } = payload;

  return new Promise((resolve, reject) => {
    if (window.Razorpay && key_id) {
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency: 'INR',
        name: 'The Urban Physio',
        description: 'Physiotherapy Booking',
        order_id,
        handler: async (response) => {
          try {
            const verified = await payments.verify({
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
      payments
        .verify({
          razorpay_order_id: order_id,
          razorpay_payment_id: 'pay_demo_' + Date.now(),
          razorpay_signature: 'demo',
        })
        .then(resolve)
        .catch(reject);
      return;
    }

    reject(new Error('Payment gateway unavailable. Please refresh and try again.'));
  });
}

/** Create order + checkout for an appointment awaiting payment. */
export async function completeAppointmentPayment(appointmentId) {
  const orderRes = await payments.createOrder(appointmentId);
  return openRazorpayCheckout(orderRes);
}

export function handlePaymentError(err, { cancelReservation = false, appointmentId } = {}) {
  if (err?.code === 'DISMISS' || err?.message === 'Payment cancelled') {
    toast.error(
      cancelReservation
        ? 'Payment not completed. Your slot was not booked.'
        : 'Payment not completed. Tap Pay again when you are ready.'
    );
    if (cancelReservation && appointmentId) {
      appointments.cancelAwaitingPayment(appointmentId).catch(() => {});
    }
    return;
  }
  const msg = err?.message || 'Payment failed';
  toast.error(msg === 'A server error occurred' ? 'Payment could not be started. Please try again.' : msg);
  if (cancelReservation && appointmentId) {
    appointments.cancelAwaitingPayment(appointmentId).catch(() => {});
  }
}
