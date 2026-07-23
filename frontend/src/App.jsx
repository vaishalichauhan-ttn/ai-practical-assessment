import { useEffect, useState } from "react";
import { Navigate, Routes, Route, NavLink } from "react-router-dom";
import { listUsers } from "./api/users.js";
import { DEFAULT_USER_EMAIL } from "./constants/ticket.js";
import HomePage from "./pages/HomePage.jsx";
import TicketDetailPage from "./pages/TicketDetailPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";

function App() {
  const [defaultUser, setDefaultUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultUser() {
      try {
        const users = await listUsers();
        if (cancelled) {
          return;
        }

        const user = users.find((entry) => entry.email === DEFAULT_USER_EMAIL);
        setDefaultUser(user ?? null);
      } catch {
        if (!cancelled) {
          setDefaultUser(null);
        }
      }
    }

    loadDefaultUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-main">
          <h1>Support Ticket Management</h1>
          <nav className="app-nav">
            <NavLink to="/tickets">Tickets</NavLink>
            <NavLink to="/home">Home</NavLink>
          </nav>
        </div>
        {defaultUser && (
          <div className="app-user" aria-label="Default user">
            <span className="app-user-name">{defaultUser.name}</span>
            <span className="app-user-email">{defaultUser.email}</span>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
