import toast from 'react-hot-toast';
import { payments } from '../services/api';

function bookingMeta(appt) {
  if (!appt?.booking_meta) return {};
  return typeof appt.booking_meta === 'object' ? appt.booking_meta : {};
}

/** True when booking is held until Razorpay (online) payment completes — not offline/clinic COD. */
export function isAwaitingOnlinePayment(appt) {
  if (!appt || appt.status !== 'pending') return false;
  if (appt.payment_status === 'paid') return false;
  const meta = bookingMeta(appt);
  return Number(meta.pay_now_amount) > 0;
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

export function handlePaymentError(err, { onPendingNavigate } = {}) {
  if (err?.code === 'DISMISS' || err?.message === 'Payment cancelled') {
    toast.error('Payment not completed. Your booking stays on hold until you pay.');
    onPendingNavigate?.();
    return;
  }
  const msg = err?.message || 'Payment failed';
  toast.error(msg === 'A server error occurred' ? 'Payment could not be started. Please try again.' : msg);
}
