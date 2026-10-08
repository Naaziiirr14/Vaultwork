import { Link } from "react-router-dom";
import PageWrap from "../components/PageWrap.jsx";

export default function NotFound() {
  return (
    <PageWrap className="page-narrow">
      <h1 className="h-display">This page is not in the vault</h1>
      <p className="lead">The address may be wrong, or the page was moved.</p>
      <Link to="/" className="btn btn-primary">Go to the home page</Link>
    </PageWrap>
  );
}
