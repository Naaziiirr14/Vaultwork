import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageWrap from "../components/PageWrap.jsx";
import Money from "../components/Money.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { errMsg } from "../api.js";

const blank = () => ({ id: Math.random().toString(36).slice(2), title: "", amount: "" });

export default function PostJob() {
  const toast = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [milestones, setMilestones] = useState([blank()]);
  const [busy, setBusy] = useState(false);

  const total = milestones.reduce((s, m) => s + (parseInt(m.amount, 10) || 0), 0);

  const update = (id, key, value) =>
    setMilestones((list) => list.map((m) => (m.id === id ? { ...m, [key]: value } : m)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/jobs", {
        title,
        description,
        skills,
        milestones: milestones.map((m) => ({ title: m.title, amount: parseInt(m.amount, 10) })),
      });
      toast.success("Job posted. Freelancers can apply now.");
      navigate(`/jobs/${data.job._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrap>
      <header className="page-head">
        <div>
          <h1 className="h-display">Post a job</h1>
          <p className="lead">Describe the work, then split the budget into milestones. You fund each milestone only after you hire someone.</p>
        </div>
      </header>

      <form className="post" onSubmit={submit}>
        <div className="post-left">
          <div className="field">
            <label htmlFor="title">Job title</label>
            <input id="title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Landing page for a Chennai bakery" />
          </div>
          <div className="field">
            <label htmlFor="desc">What needs to be done?</label>
            <textarea id="desc" required rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the work, the tools you expect, and what done looks like." />
          </div>
          <div className="field">
            <label htmlFor="skills">Skills (separate with commas)</label>
            <input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Figma" />
          </div>
        </div>

        <aside className="post-right slip">
          <h2>Milestones</h2>
          <p className="muted">Up to 6. Amounts are in whole rupees.</p>

          <ol className="tally">
            <AnimatePresence initial={false}>
              {milestones.map((m, i) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <span className="tally-n">{i + 1}</span>
                  <input
                    aria-label={`Milestone ${i + 1} title`}
                    required
                    value={m.title}
                    onChange={(e) => update(m.id, "title", e.target.value)}
                    placeholder="What gets delivered"
                  />
                  <input
                    aria-label={`Milestone ${i + 1} amount in rupees`}
                    className="tally-amount"
                    required
                    inputMode="numeric"
                    value={m.amount}
                    onChange={(e) => update(m.id, "amount", e.target.value.replace(/\D/g, ""))}
                    placeholder="₹"
                  />
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove milestone ${i + 1}`}
                      onClick={() => setMilestones((l) => l.filter((x) => x.id !== m.id))}
                    >
                      ×
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {milestones.length < 6 && (
            <button type="button" className="link-btn" onClick={() => setMilestones((l) => [...l, blank()])}>
              Add another milestone
            </button>
          )}

          <div className="tally-total">
            <span>Total budget</span>
            <Money value={total} className="amount" />
          </div>

          <button className="btn btn-primary btn-block" disabled={busy || total < 1}>
            {busy ? "Posting…" : "Post job"}
          </button>
        </aside>
      </form>
    </PageWrap>
  );
}
