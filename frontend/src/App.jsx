import { Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Support Ticket Management</h1>
        <nav className="app-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
