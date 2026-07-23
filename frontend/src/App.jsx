import { Navigate, Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import TicketDetailPage from "./pages/TicketDetailPage.jsx";
import TicketsPage from "./pages/TicketsPage.jsx";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Support Ticket Management</h1>
        <nav className="app-nav">
          <NavLink to="/tickets">Tickets</NavLink>
          <NavLink to="/home">Home</NavLink>
        </nav>
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
