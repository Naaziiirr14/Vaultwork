import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageWrap from "../components/PageWrap.jsx";
import Loader from "../components/Loader.jsx";
import Money from "../components/Money.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { errMsg } from "../api.js";
import { inr } from "../utils/format.js";

const LABELS = {
  client: { escrow: "Held in escrow", released: "Paid to freelancers", refunded: "Refunded to you", pending: "Not funded yet" },
  freelancer: { escrow: "Secured for you", released: "Earned", refunded: "Refunded to clients", pending: "Waiting for funding" },
  admin: { escrow: "Held in escrow", released: "Released", refunded: "Refunded", pending: "Not funded yet" },
};

const SEGMENTS = [
  { key: "released", color: "var(--green)" },
  { key: "inEscrow", color: "var(--ochre)" },
  { key: "pending", color: "var(--ink-3)" },
  { key: "refunded", color: "var(--plum)" },
];

function Pips({ done, count }) {
  return (
    <span className="pips" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className={i < done ? "on" : ""} />
      ))}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/stats/me"), api.get("/jobs/mine")])
      .then(([s, j]) => {
        setStats(s.data);
        setJobs(j.data.jobs);
      })
      .catch((e) => toast.error(errMsg(e)));
  }, []);

  if (!stats || !jobs) {
    return (
      <PageWrap>
        <Loader />
      </PageWrap>
    );
  }

  const L = LABELS[user.role];
  const a = stats.amounts;
  const total = a.pending + a.inEscrow + a.released + a.refunded;

  return (
    <PageWrap>
      <header className="page-head">
        <div>
          <h1 className="h-display">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="lead">
            {user.role === "client" && "Here is where your money is right now."}
            {user.role === "freelancer" && "Here is what is secured and what you have earned."}
            {user.role === "admin" && "Here is the state of every escrow on the platform."}
          </p>
        </div>
        {user.role === "client" && (
          <Link to="/jobs/new" className="btn btn-primary">Post a job</Link>
        )}
        {user.role === "freelancer" && (
          <Link to="/jobs" className="btn btn-primary">Browse jobs</Link>
        )}
        {user.role === "admin" && (
          <Link to="/disputes" className="btn btn-primary">
            {stats.openDisputes ? `Review ${stats.openDisputes} open dispute${stats.openDisputes > 1 ? "s" : ""}` : "Open disputes"}
          </Link>
        )}
      </header>

      <section className="ledger" aria-label="Money summary">
        <div>
          <span className="ledger-label">{L.escrow}</span>
          <Money value={a.inEscrow} className="ledger-num" />
        </div>
        <div>
          <span className="ledger-label">{L.released}</span>
          <Money value={a.released} className="ledger-num" />
        </div>
        <div>
          <span className="ledger-label">{L.pending}</span>
          <Money value={a.pending} className="ledger-num" />
        </div>
        <div>
          <span className="ledger-label">{L.refunded}</span>
          <Money value={a.refunded} className="ledger-num" />
        </div>
      </section>

      <div className="strip" aria-hidden="true">
        {total === 0 ? (
          <span className="strip-empty" />
        ) : (
          SEGMENTS.map((s) => {
            const value = s.key === "inEscrow" ? a.inEscrow : a[s.key];
            return (
              <motion.span
                key={s.key}
                style={{ background: s.color }}
                initial={{ width: 0 }}
                animate={{ width: `${(value / total) * 100}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            );
          })
        )}
      </div>

      <section className="section">
        <div className="section-head">
          <h2>{user.role === "admin" ? "All jobs" : "Your jobs"}</h2>
          <span className="muted">
            {stats.jobs.active} in progress, {stats.jobs.open} open, {stats.jobs.completed} completed
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="empty">
            <h3>No jobs yet</h3>
            <p className="muted">
              {user.role === "client" && "Post your first job and split the budget into milestones."}
              {user.role === "freelancer" && "Browse open jobs and apply to the ones that fit."}
              {user.role === "admin" && "Jobs will show up here once clients post them."}
            </p>
            {user.role === "client" && <Link to="/jobs/new" className="btn btn-primary">Post a job</Link>}
            {user.role === "freelancer" && <Link to="/jobs" className="btn btn-primary">Browse jobs</Link>}
          </div>
        ) : (
          <div className="rows">
            {jobs.map((j) => (
              <Link to={`/jobs/${j._id}`} key={j._id} className="row">
                <div className="row-main">
                  <h3>{j.title}</h3>
                  <p className="muted">
                    {user.role === "freelancer" &&
                      (j.myStatus === "hired" ? `Client: ${j.client?.name}` : j.myStatus === "applied" ? "Application sent" : "Another freelancer was hired")}
                    {user.role === "client" &&
                      (j.freelancer ? `Freelancer: ${j.freelancer.name}` : `${j.applicantCount} applicant${j.applicantCount === 1 ? "" : "s"}`)}
                    {user.role === "admin" &&
                      `${j.client?.name || "Client"}${j.freelancer ? ` and ${j.freelancer.name}` : ""}`}
                  </p>
                </div>
                <div className="row-progress">
                  <Pips done={j.progress.done} count={j.progress.count} />
                  <small className="muted">
                    {j.progress.done} of {j.progress.count} milestones closed
                  </small>
                </div>
                <div className="row-end">
                  <span className="amount-sm">{inr(j.budget)}</span>
                  <StatusBadge status={j.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageWrap>
  );
}
