import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageWrap from "../components/PageWrap.jsx";
import Loader from "../components/Loader.jsx";
import Money from "../components/Money.jsx";
import MilestoneCard from "../components/MilestoneCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { errMsg } from "../api.js";
import { fmtDate } from "../utils/format.js";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [config, setConfig] = useState({ razorpayEnabled: false, mockPayments: false });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setData(res.data);
    } catch (e) {
      toast.error(errMsg(e));
      navigate("/jobs");
    }
  }, [id]);

  useEffect(() => {
    load();
    api.get("/config").then((r) => setConfig(r.data)).catch(() => {});
  }, [load]);

  if (!data) {
    return (
      <PageWrap>
        <Loader />
      </PageWrap>
    );
  }

  const { job, milestones, disputes, access } = data;
  const sum = (...s) => milestones.filter((m) => s.includes(m.status)).reduce((t, m) => t + m.amount, 0);
  const inEscrow = sum("funded", "submitted", "disputed");
  const released = sum("released");
  const waiting = sum("pending");

  const apply = async () => {
    setBusy("apply");
    try {
      await api.post(`/jobs/${id}/apply`, { message });
      toast.success("Application sent. The client will see it.");
      setMessage("");
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  const hire = async (freelancerId) => {
    setBusy(`hire-${freelancerId}`);
    try {
      await api.post(`/jobs/${id}/hire`, { freelancerId });
      toast.success("Freelancer hired. You can fund the first milestone now.");
      await load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <PageWrap>
      <header className="job-head">
        <div className="job-status">
          <StatusBadge status={job.status} />
          <span className="muted">Posted {fmtDate(job.createdAt)}</span>
        </div>
        <h1 className="h-display">{job.title}</h1>
        <p className="job-desc">{job.description}</p>
        {job.skills?.length > 0 && (
          <div className="chips">
            {job.skills.map((s) => (
              <span key={s} className="chip chip-static">{s}</span>
            ))}
          </div>
        )}
      </header>

      <div className="job-grid">
        <section className="job-main" aria-label="Milestones">
          <div className="section-head">
            <h2>Milestones</h2>
            <span className="muted">{milestones.length} in total</span>
          </div>
          <div className="ms-list">
            {milestones.map((m, i) => (
              <MilestoneCard
                key={m._id}
                m={m}
                index={i}
                job={job}
                access={access}
                config={config}
                dispute={disputes.find((d) => String(d.milestone) === String(m._id))}
                onChange={load}
              />
            ))}
          </div>
        </section>

        <aside className="job-side">
          <div className="slip side-ledger">
            <h2>Job ledger</h2>
            <dl>
              <div>
                <dt>Total budget</dt>
                <dd><Money value={job.budget} /></dd>
              </div>
              <div>
                <dt>Held in escrow</dt>
                <dd><Money value={inEscrow} /></dd>
              </div>
              <div>
                <dt>Released</dt>
                <dd><Money value={released} /></dd>
              </div>
              <div>
                <dt>Not funded yet</dt>
                <dd><Money value={waiting} /></dd>
              </div>
            </dl>
          </div>

          <div className="slip side-people">
            <h2>People</h2>
            <dl>
              <div>
                <dt>Client</dt>
                <dd>{job.client?.name}</dd>
              </div>
              <div>
                <dt>Freelancer</dt>
                <dd>{job.freelancer ? job.freelancer.name : "Not hired yet"}</dd>
              </div>
            </dl>
          </div>

          {user.role === "freelancer" && job.status === "open" && (
            <div className="slip">
              <h2>Apply for this job</h2>
              {job.hasApplied ? (
                <p className="muted">You have applied. The client will pick one freelancer.</p>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="apply-msg">Short message to the client (optional)</label>
                    <textarea id="apply-msg" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why you are a good fit" />
                  </div>
                  <button className="btn btn-primary btn-block" disabled={busy === "apply"} onClick={apply}>
                    {busy === "apply" ? "Sending…" : "Send application"}
                  </button>
                </>
              )}
            </div>
          )}

          {(access.isClient || access.isAdmin) && job.status === "open" && (
            <div className="slip">
              <h2>Applicants ({job.applicants.length})</h2>
              {job.applicants.length === 0 ? (
                <p className="muted">No one has applied yet.</p>
              ) : (
                <ul className="applicants">
                  {job.applicants.map((a) => (
                    <li key={a.freelancer?._id}>
                      <div>
                        <b>{a.freelancer?.name}</b>
                        <small className="muted">Applied {fmtDate(a.appliedAt)}</small>
                        {a.message && <p>{a.message}</p>}
                      </div>
                      {access.isClient && (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={!!busy}
                          onClick={() => hire(a.freelancer._id)}
                        >
                          {busy === `hire-${a.freelancer._id}` ? "Hiring…" : "Hire"}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </PageWrap>
  );
}
