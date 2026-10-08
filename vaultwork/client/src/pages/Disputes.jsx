import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageWrap from "../components/PageWrap.jsx";
import Loader from "../components/Loader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { errMsg } from "../api.js";
import { fmtDate, inr } from "../utils/format.js";

function DisputeCard({ d, isAdmin, onDone }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const resolve = async (decision) => {
    setBusy(decision);
    try {
      await api.put(`/disputes/${d._id}/resolve`, { decision, adminNote: note });
      toast.success(decision === "release" ? "Released to the freelancer." : "Refunded to the client.");
      await onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <article className="slip dispute">
      <header>
        <div>
          <Link to={`/jobs/${d.job?._id}`} className="dispute-job">{d.job?.title}</Link>
          <p className="muted">
            {d.milestone?.title} · {d.job?.client?.name} and {d.job?.freelancer?.name}
          </p>
        </div>
        <div className="dispute-end">
          <span className="amount-sm">{inr(d.milestone?.amount)}</span>
          <StatusBadge status={d.status} />
        </div>
      </header>

      <blockquote>
        <b>{d.raisedBy?.name} rejected the work on {fmtDate(d.createdAt)}:</b>
        <p>{d.reason}</p>
      </blockquote>

      {d.status === "resolved" ? (
        <p className="verdict">
          <b>{d.decision === "release" ? "Released to the freelancer" : "Refunded to the client"}</b>
          {d.adminNote ? `. ${d.adminNote}` : ""}
        </p>
      ) : isAdmin ? (
        <div className="resolve">
          <div className="field">
            <label htmlFor={`note-${d._id}`}>Note for both sides (optional)</label>
            <textarea id={`note-${d._id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you decided this way" />
          </div>
          <div className="resolve-actions">
            <button className="btn btn-green" disabled={!!busy} onClick={() => resolve("release")}>
              {busy === "release" ? "Releasing…" : "Release to freelancer"}
            </button>
            <button className="btn btn-seal" disabled={!!busy} onClick={() => resolve("refund")}>
              {busy === "refund" ? "Refunding…" : "Refund to client"}
            </button>
          </div>
        </div>
      ) : (
        <p className="hint">Waiting for an admin to decide.</p>
      )}
    </article>
  );
}

export default function Disputes() {
  const { user } = useAuth();
  const toast = useToast();
  const [disputes, setDisputes] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/disputes");
      setDisputes(data.disputes);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageWrap className="page-narrow">
      <header className="page-head">
        <div>
          <h1 className="h-display">Disputes</h1>
          <p className="lead">
            {user.role === "admin"
              ? "When a client rejects work, the money stays in escrow until you decide."
              : "Rejected milestones wait here for an admin's decision."}
          </p>
        </div>
      </header>

      {!disputes ? (
        <Loader label="Loading disputes" />
      ) : disputes.length === 0 ? (
        <div className="empty">
          <h3>No disputes</h3>
          <p className="muted">Everything is running smoothly. A dispute appears here when a client rejects submitted work.</p>
        </div>
      ) : (
        <div className="dispute-list">
          {disputes.map((d) => (
            <DisputeCard key={d._id} d={d} isAdmin={user.role === "admin"} onDone={load} />
          ))}
        </div>
      )}
    </PageWrap>
  );
}
