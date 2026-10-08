import crypto from "crypto";

let instance = null;

export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Lazy load: Razorpay-a top-level la import pannaama, first use la mattum load pannrom
// (Node v24 crash issue ku munnadi nee pannina same approach)
export const getRazorpay = async () => {
  if (instance) return instance;
  const { default: Razorpay } = await import("razorpay");
  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return instance;
};

// Razorpay checkout success aana apram, signature genuine ah nu check pannrom
export const verifySignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
