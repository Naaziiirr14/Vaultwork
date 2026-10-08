import { motion } from "framer-motion";

const STAGES = [
  { key: "pending", label: "Awaiting funds" },
  { key: "funded", label: "In escrow" },
  { key: "submitted", label: "Under review" },
  { key: "released", label: "Released" },
];

// Ovvoru status-um coin edha stage la nikkanum nu
const INDEX = { pending: 0, funded: 1, submitted: 2, disputed: 2, released: 3, refunded: 0 };

export default function EscrowTrack({ status }) {
  const idx = INDEX[status] ?? 0;
  const left = ((idx + 0.5) / STAGES.length) * 100;
  const fill = (idx / (STAGES.length - 1)) * 100;

  return (
    <div className={`track track-${status}`} role="img" aria-label={`Escrow status: ${status}`}>
      <div className="track-rail">
        <motion.div
          className="track-fill"
          initial={false}
          animate={{ width: `${fill}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 16 }}
        />
      </div>
      <div className="track-nodes">
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            className={`track-node ${i <= idx ? "is-reached" : ""} ${i === idx ? "is-current" : ""}`}
          >
            <span className="track-dot" />
            <span className="track-label">{s.label}</span>
          </div>
        ))}
      </div>
      <motion.div
        className="track-coin"
        initial={false}
        animate={{ left: `${left}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 13 }}
      >
        ₹
      </motion.div>
    </div>
  );
}
