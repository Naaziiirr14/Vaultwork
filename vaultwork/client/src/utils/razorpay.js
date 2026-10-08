export const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Could not load Razorpay checkout. Check your internet connection."));
    document.body.appendChild(script);
  });

// Checkout open pannum. Payment success aana response resolve aagum; cancel/fail aana reject.
export const openCheckout = async ({ order, user, description }) => {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "Vaultwork",
      description,
      prefill: { name: user.name, email: user.email },
      theme: { color: "#14213a" },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r.error?.description || "Payment failed")));
    rzp.open();
  });
};
