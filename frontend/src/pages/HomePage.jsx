import { useEffect, useState } from "react";
import { getHealth, getErrorMessage } from "../api/client.js";

function HomePage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const data = await getHealth();
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to reach API"));
          setHealth(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card">
      <h2>Welcome</h2>
      <p className="muted">
        Foundation placeholder for the Support Ticket Management System.
      </p>

      <h3>API Health</h3>
      {loading && <p className="muted">Checking backend health...</p>}
      {!loading && health && (
        <p className="status-ok">Backend status: {health.status}</p>
      )}
      {!loading && error && (
        <p className="status-error">Backend unavailable: {error}</p>
      )}
    </section>
  );
}

export default HomePage;
