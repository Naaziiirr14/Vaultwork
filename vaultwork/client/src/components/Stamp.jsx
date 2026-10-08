import { motion } from "framer-motion";

const TONES = {
  funded: { tone: "ochre", text: "In escrow" },
  released: { tone: "green", text: "Released" },
  refunded: { tone: "plum", text: "Refunded" },
  disputed: { tone: "seal", text: "Disputed" },
};

// slam=true na paper mela stamp adikira maari vizhum. Illana already stamp pannina nilaimai la irukum.
export default function Stamp({ status, slam = false }) {
  const meta = TONES[status];
  if (!meta) return null;
  return (
    <motion.div
      className={`stamp stamp-${meta.tone}`}
      initial={slam ? { scale: 2.8, opacity: 0, rotate: -26 } : false}
      animate={{ scale: 1, opacity: 1, rotate: -7 }}
      transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.8 }}
      aria-label={meta.text}
    >
      <span>{meta.text}</span>
    </motion.div>
  );
}
