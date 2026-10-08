import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Loader from "./components/Loader.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Jobs from "./pages/Jobs.jsx";
import PostJob from "./pages/PostJob.jsx";
import JobDetail from "./pages/JobDetail.jsx";
import Disputes from "./pages/Disputes.jsx";
import NotFound from "./pages/NotFound.jsx";

function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const location = useLocation();

  // Route maarumbodhu top ku scroll
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <Navbar />
      <div id="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
          <Route path="/jobs/new" element={<Protected roles={["client"]}><PostJob /></Protected>} />
          <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
          <Route path="/disputes" element={<Protected><Disputes /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}