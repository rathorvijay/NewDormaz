export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initRazorpayPayment = async ({ amount, orderId, key, user, onSuccess, onFailure }) => {
  const loaded = await loadRazorpay();
  if (!loaded) {
    alert('Razorpay SDK failed to load. Please check your internet connection.');
    return;
  }

  const options = {
    key,
    amount: amount * 100,
    currency: 'INR',
    name: 'Dormez Mattress Industry',
    description: 'Premium Mattress Purchase',
    image: 'https://via.placeholder.com/150?text=D',
    order_id: orderId,
    handler: function (response) {
      onSuccess(response);
    },
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: { color: '#1a237e' },
    modal: {
      ondismiss: () => {
        if (onFailure) onFailure('Payment cancelled');
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (res) => {
    if (onFailure) onFailure(res.error.description);
  });
  rzp.open();
};
