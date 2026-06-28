import toast from 'react-hot-toast';
import { packageBookings } from '../services/api';

export function openPackageRazorpayCheckout(orderRes) {
  const payload = orderRes.data ?? orderRes;
  const { order_id, amount, key_id } = payload;

  return new Promise((resolve, reject) => {
    if (window.Razorpay && key_id) {
      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency: 'INR',
        name: 'The Urban Physio',
        description: payload.package?.name || 'Treatment Package',
        order_id,
        handler: async (response) => {
          try {
            const verified = await packageBookings.verify({
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
      packageBookings
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

export function handlePackagePaymentError(err) {
  if (err?.code === 'DISMISS' || err?.message === 'Payment cancelled') {
    toast.error('Payment not completed. Your package was not booked.');
    return;
  }
  const msg = err?.message || 'Payment failed';
  toast.error(msg === 'A server error occurred' ? 'Payment could not be started. Please try again.' : msg);
}
