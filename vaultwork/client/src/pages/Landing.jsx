import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageWrap from "../components/PageWrap.jsx";
import EscrowTrack from "../components/EscrowTrack.jsx";
import Stamp from "../components/Stamp.jsx";
import Money from "../components/Money.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Right side shield design (inga thaan irukku, separate file venaam)
function HeroArt() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        right: "max(-120px, calc((100% - 1140px) / 2 - 90px))",
        top: "50%",
        marginTop: "-322px",
        color: "var(--green)",
        opacity: 0.18,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <motion.svg
        viewBox="0 0 400 460"
        width="560"
        height="644"
        fill="none"
        stroke="currentColor"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* shield */}
        <path
          d="M200 20 L360 80 V220 C360 320 290 400 200 440 C110 400 40 320 40 220 V80 Z"
          strokeWidth="3"
        />
        <path
          d="M200 56 L328 104 V220 C328 300 272 366 200 400 C128 366 72 300 72 220 V104 Z"
          strokeWidth="1.5"
        />
        {/* tick */}
        <path d="M130 225 L180 275 L274 170" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        {/* floating diamonds */}
        <motion.rect
          x="10" y="300" width="34" height="34" rx="4" strokeWidth="2.5"
          style={{ originX: "27px", originY: "317px" }}
          animate={{ rotate: [45, 90, 45] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.rect
          x="350" y="360" width="26" height="26" rx="4" strokeWidth="2.5"
          style={{ originX: "363px", originY: "373px" }}
          animate={{ rotate: [45, 0, 45] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.rect
          x="330" y="10" width="20" height="20" rx="3" strokeWidth="2.5"
          style={{ originX: "340px", originY: "20px" }}
          animate={{ rotate: [45, 135, 45] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}

const HEADLINE = ["Pay", "when", "the", "work", "is", "done,", "not", "before."];

const DEMO = {
  pending: {
    note: "The client and freelancer agreed on ₹10,000 for this milestone. No money has moved yet.",
    actions: [{ label: "Client funds the milestone", to: "funded", primary: true }],
  },
  funded: {
    note: "The payment is locked in escrow. The freelancer can start work knowing the money exists.",
    actions: [{ label: "Freelancer submits the work", to: "submitted", primary: true }],
  },
  submitted: {
    note: "The client reviews the work. Approving releases the money. Rejecting sends it to an admin.",
    actions: [
      { label: "Client approves", to: "released", primary: true },
      { label: "Client rejects", to: "disputed" },
    ],
  },
  disputed: {
    note: "An admin reads both sides and decides where the money goes.",
    actions: [
      { label: "Admin releases to freelancer", to: "released", primary: true },
      { label: "Admin refunds the client", to: "refunded" },
    ],
  },
  released: {
    note: "The freelancer is paid and this milestone is closed.",
    actions: [{ label: "Start over", to: "pending" }],
  },
  refunded: {
    note: "The money went back to the client and this milestone is closed.",
    actions: [{ label: "Start over", to: "pending" }],
  },
};

const STEPS = [
  {
    title: "The client posts a job and splits the budget into milestones.",
    body: "Each milestone has its own amount, so nobody has to trust one big payment.",
  },
  {
    title: "Freelancers apply and the client hires one.",
    body: "Only the hired freelancer can submit work for the milestones.",
  },
  {
    title: "The client funds a milestone through Razorpay.",
    body: "The money is held, not sent. The freelancer can see it is there before starting.",
  },
  {
    title: "The freelancer submits and the client approves.",
    body: "Approval releases the money. A rejection goes to an admin. If the client stays silent, it releases on its own after 7 days.",
  },
];

function DemoSlip() {
  const [status, setStatus] = useState("pending");
  const [moved, setMoved] = useState(false);
  const step = DEMO[status];

  return (
    <motion.div
      className="slip demo"
      initial={{ y: -60, rotate: -4, opacity: 0 }}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.9 }}
    >
      <p className="demo-kicker">Try it. Press the buttons and watch the money move.</p>
      <div className="demo-head">
        <div>
          <span className="ms-index">Milestone 1 of 2</span>
          <h3>Landing page design</h3>
        </div>
        <Money value={10000} className="amount" />
      </div>
      <EscrowTrack status={status} />
      <p className="demo-note" aria-live="polite">{step.note}</p>
      <div className="demo-actions">
        {step.actions.map((a) => (
          <button
            key={a.to + a.label}
            className={`btn ${a.primary ? "btn-primary" : "btn-ghost"}`}
            onClick={() => {
              setMoved(a.to !== "pending");
              setStatus(a.to);
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      {moved && <Stamp key={status} status={status} slam />}
    </motion.div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  return (
    <PageWrap className="landing">
      <div className="hero-bleed">
        <HeroArt />

        <section className="hero wrap">
        <div className="hero-copy">
          <h1 className="h-hero" aria-label={HEADLINE.join(" ")}>
            {HEADLINE.map((w, i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="word"
                initial={{ opacity: 0, y: "0.6em", filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="lead"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
          >
            Vaultwork holds a client's payment in escrow, one milestone at a time, and releases it to the freelancer only after the work is approved.
          </motion.p>
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">Open your dashboard</Link>
            ) : (
              <>
                <Link to="/register?role=client" className="btn btn-green btn-lg">Hire a freelancer</Link>
                <Link to="/register?role=freelancer" className="btn btn-ghost btn-lg">Find paid work</Link>
              </>
            )}
          </motion.div>
        </div>

        <DemoSlip />
        </section>
      </div>

      <div className="wrap">
      <section className="band">
        <h2 className="h-display">How a milestone travels</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={i}>
              <span className="steps-n">{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="band two-col">
        <div>
          <h2 className="h-display">For clients</h2>
          <p className="lead">You pay only for work you have seen. Every milestone is funded on its own, and you can always see how much is sitting in escrow.</p>
        </div>
        <div>
          <h2 className="h-display">For freelancers</h2>
          <p className="lead">You start work knowing the money is real. If a client goes quiet after you submit, the payment releases by itself.</p>
        </div>
      </section>

      <footer className="foot">
        <p>Vaultwork is a final year project built with MongoDB, Express, React and Node. Payments run in Razorpay test mode, so no real money moves.</p>
      </footer>
      </div>
    </PageWrap>
  );
}
