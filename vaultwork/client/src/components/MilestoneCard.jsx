import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import api, { errMsg } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { fmtDate, fmtDateTime, inr, STATUS_LABEL } from "../utils/format.js";
import { openCheckout } from "../utils/razorpay.js";
import EscrowTrack from "./EscrowTrack.jsx";
import Modal from "./Modal.jsx";
import Money from "./Money.jsx";
import Stamp from "./Stamp.jsx";
import StatusBadge from "./StatusBadge.jsx";

export default function MilestoneCard({ m, index, job, access, config, dispute, onChange }) {
  const toast = useToast();
  const { user } = useAuth();
  const controls = useAnimationControls();

  const [busy, setBusy] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [reason, setReason] = useState("");

  // Status maarumbodhu mattum stamp slam + card oru thadava ulukkum
  const prevStatus = useRef(m.status);
  const changed = prevStatus.current !== m.status;
  useEffect(() => {
    if (prevStatus.current !== m.status) {
      if (["funded", "released", "refunded", "disputed"].includes(m.status)) {
        controls.start({ x: [0, -6, 6, -3, 2, 0], transition: { duration: 0.4, delay: 0.14 } });
      }
      prevStatus.current = m.status;
    }
  }, [m.status, controls]);

  const { isClient, isFreelancer, isAdmin } = access;

  const run = async (key, fn, okMsg) => {
    setBusy(key);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await onChange();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  const fund = () =>
    run(
      "fund",
      async () => {
        const { data: order } = await api.post(`/milestones/${m._id}/fund-order`);
        const response = await openCheckout({ order, user, description: m.title });
        await api.post(`/milestones/${m._id}/verify`, response);
      },
      "Payment verified. The money is now held in escrow."
    );

  const mockFund = () =>
    run("mock", () => api.post(`/milestones/${m._id}/mock-fund`), "Simulated payment done. The money is now held in escrow.");

  const submit = () =>
    run(
      "submit",
      async () => {
        await api.post(`/milestones/${m._id}/submit`, { note, link });
        setSubmitOpen(false);
        setNote("");
        setLink("");
      },
      "Work submitted. The client can review it now."
    );

  const approve = () =>
    run("approve", () => api.post(`/milestones/${m._id}/approve`), "Approved. The payment is released to the freelancer.");

  const reject = () =>
    run(
      "reject",
      async () => {
        await api.post(`/milestones/${m._id}/reject`, { reason });
        setRejectOpen(false);
        setReason("");
      },
      "Rejected. An admin will review this milestone."
    );

  const canFund = isClient && m.status === "pending" && job.status === "in_progress";

  return (
    <>
    <motion.article animate={controls} className={`ms slip ms-${m.status}`}>
      <header className="ms-head">
        <div className="ms-title">
          <span className="ms-index">Milestone {index + 1}</span>
          <h3>{m.title}</h3>
          {m.description && <p className="muted">{m.description}</p>}
        </div>
        <div className="ms-money">
          <Money value={m.amount} className="amount" />
          <StatusBadge status={m.status} />
        </div>
      </header>

      <EscrowTrack status={m.status} />

      {m.submission?.note && (
        <div className="ms-submission">
          <b>Delivered work</b>
          <p>{m.submission.note}</p>
          {m.submission.link && (
            <a href={m.submission.link} target="_blank" rel="noreferrer">
              Open delivered files
            </a>
          )}
          <small className="muted">Submitted {fmtDateTime(m.submission.submittedAt)}</small>
        </div>
      )}

      {m.status === "disputed" && dispute && (
        <div className="ms-dispute">
          <b>Why the client rejected it</b>
          <p>{dispute.reason}</p>
        </div>
      )}

      <div className="ms-actions">
        {canFund && (
          <>
            {config.razorpayEnabled && (
              <button className="btn btn-primary" disabled={!!busy} onClick={fund}>
                {busy === "fund" ? "Opening Razorpay…" : `Fund ${inr(m.amount)} in escrow`}
              </button>
            )}
            {config.mockPayments && (
              <button className="btn btn-ghost" disabled={!!busy} onClick={mockFund}>
                {busy === "mock" ? "Working…" : "Simulate payment"}
              </button>
            )}
            {!config.razorpayEnabled && !config.mockPayments && (
              <p className="hint">Payments are not set up on the server yet. Add the Razorpay test keys to the server .env file.</p>
            )}
          </>
        )}

        {isClient && m.status === "pending" && job.status === "open" && (
          <p className="hint">Hire a freelancer first. Then you can fund this milestone.</p>
        )}
        {isFreelancer && m.status === "pending" && (
          <p className="hint">Waiting for the client to fund this milestone. Start after it is in escrow.</p>
        )}

        {isClient && m.status === "funded" && (
          <p className="hint">The money is locked in escrow. Waiting for the freelancer to deliver.</p>
        )}
        {isFreelancer && m.status === "funded" && (
          <>
            <button className="btn btn-primary" onClick={() => setSubmitOpen(true)}>
              Submit work
            </button>
            <p className="hint">Funded and locked. You are safe to start.</p>
          </>
        )}

        {isClient && m.status === "submitted" && (
          <>
            <button className="btn btn-green" disabled={!!busy} onClick={approve}>
              {busy === "approve" ? "Releasing…" : "Approve and release"}
            </button>
            <button className="btn btn-ghost" disabled={!!busy} onClick={() => setRejectOpen(true)}>
              Reject work
            </button>
            {m.autoReleaseAt && (
              <p className="hint">If you do not respond, this releases automatically on {fmtDate(m.autoReleaseAt)}.</p>
            )}
          </>
        )}
        {isFreelancer && m.status === "submitted" && (
          <p className="hint">
            Waiting for the client to review.
            {m.autoReleaseAt ? ` If they stay silent, it releases automatically on ${fmtDate(m.autoReleaseAt)}.` : ""}
          </p>
        )}

        {m.status === "disputed" && (
          <>
            <p className="hint">An admin will decide whether to release or refund this money.</p>
            {(isAdmin || isClient || isFreelancer) && (
              <Link to="/disputes" className="btn btn-ghost btn-sm">
                View dispute
              </Link>
            )}
          </>
        )}
        {m.status === "released" && <p className="hint">Paid out to the freelancer.</p>}
        {m.status === "refunded" && <p className="hint">Returned to the client.</p>}
      </div>

      <div className="ms-foot">
        <button className="link-btn" onClick={() => setShowLog((s) => !s)} aria-expanded={showLog}>
          {showLog ? "Hide history" : `Show history (${m.history?.length || 0})`}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showLog && (
          <motion.ol
            className="log"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {(m.history || []).map((h, i) => (
              <li key={i}>
                <span className={`log-dot log-${h.status}`} />
                <div>
                  <b>{STATUS_LABEL[h.status] || h.status}</b>
                  <span>{h.note}</span>
                  <small>
                    {h.by?.name || "System"} on {fmtDateTime(h.at)}
                  </small>
                </div>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>

      <Stamp key={m.status} status={m.status} slam={changed} />
    </motion.article>

      <Modal open={submitOpen} title="Submit your work" onClose={() => setSubmitOpen(false)}>
        <div className="field">
          <label htmlFor={`note-${m._id}`}>What are you delivering?</label>
          <textarea
            id={`note-${m._id}`}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe what is done and how the client can check it."
          />
        </div>
        <div className="field">
          <label htmlFor={`link-${m._id}`}>Link to files (optional)</label>
          <input
            id={`link-${m._id}`}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://drive.google.com/…"
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setSubmitOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!note.trim() || busy === "submit"} onClick={submit}>
            {busy === "submit" ? "Submitting…" : "Submit work"}
          </button>
        </div>
      </Modal>

      <Modal open={rejectOpen} title="Reject this work" onClose={() => setRejectOpen(false)}>
        <p className="muted">
          The money stays in escrow and an admin reviews both sides. Be specific about what is missing or wrong.
        </p>
        <div className="field">
          <label htmlFor={`reason-${m._id}`}>What is wrong?</label>
          <textarea
            id={`reason-${m._id}`}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="At least 10 characters."
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={() => setRejectOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-seal" disabled={reason.trim().length < 10 || busy === "reject"} onClick={reject}>
            {busy === "reject" ? "Sending…" : "Send to admin"}
          </button>
        </div>
      </Modal>
    </>
  );
}
