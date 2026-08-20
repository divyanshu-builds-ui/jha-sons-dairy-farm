import { useState } from 'react';
import BRAND from '../utils/config';

export default function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  function openDonation({ name, amount = 100, onSuccess }) {
    setLoading(true);
    setStatus(null);

    const options = {
      key: 'rzp_test_TS1jFCsd6FTyXl',
      amount,
      currency: 'INR',
      name: BRAND.name,
      description: 'Gau Seva Donation — ₹1',
      handler: function (response) {
        setStatus('success');
        setLoading(false);
        onSuccess && onSuccess({ name, paymentId: response.razorpay_payment_id });
      },
      prefill: { name: name || '' },
      notes: { purpose: 'Gau Seva', donor_name: name || '' },
      theme: { color: '#3d5a3e' },
      modal: {
        ondismiss: () => { setLoading(false); setStatus(null); },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { setStatus('failed'); setLoading(false); });
      rzp.open();
    } catch {
      setLoading(false);
      setStatus('failed');
    }
  }

  return { openDonation, loading, status, setStatus };
}
