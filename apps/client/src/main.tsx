import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [health, setHealth] = React.useState<string>("loading…");

  React.useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("unreachable"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Travora</h1>
      <p>
        API status: <strong>{health}</strong>
      </p>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

