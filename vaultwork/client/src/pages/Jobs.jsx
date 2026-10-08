import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageWrap from "../components/PageWrap.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api, { errMsg } from "../api.js";
import { fmtDate, inr } from "../utils/format.js";

export default function Jobs() {
  const { user } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/jobs", { params: { search } });
        setJobs(data.jobs);
      } catch (e) {
        toast.error(errMsg(e));
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <PageWrap>
      <header className="page-head">
        <div>
          <h1 className="h-display">Open jobs</h1>
          <p className="lead">Every job here has its budget split into milestones. Payment is held in escrow before work starts.</p>
        </div>
        {user.role === "client" && <Link to="/jobs/new" className="btn btn-primary">Post a job</Link>}
      </header>

      <div className="field search">
        <label htmlFor="search">Search by title, skill or keyword</label>
        <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="For example: React, Figma, bakery" />
      </div>

      {!jobs ? (
        <Loader label="Loading jobs" />
      ) : jobs.length === 0 ? (
        <div className="empty">
          <h3>No open jobs match that search</h3>
          <p className="muted">Try a different word, or clear the search box.</p>
        </div>
      ) : (
        <div className="rows">
          {jobs.map((j) => (
            <Link to={`/jobs/${j._id}`} key={j._id} className="row row-job">
              <div className="row-main">
                <h3>{j.title}</h3>
                <p className="clamp">{j.description}</p>
                <div className="chips">
                  {j.skills?.map((s) => (
                    <span className="chip chip-static" key={s}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="row-end">
                <span className="amount-sm">{inr(j.budget)}</span>
                <small className="muted">{j.milestoneCount} milestone{j.milestoneCount === 1 ? "" : "s"}</small>
                <small className="muted">
                  {j.hasApplied ? "You applied" : `${j.applicantCount} applicant${j.applicantCount === 1 ? "" : "s"}`}
                </small>
                <small className="muted">Posted {fmtDate(j.createdAt)} by {j.client?.name}</small>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageWrap>
  );
}
