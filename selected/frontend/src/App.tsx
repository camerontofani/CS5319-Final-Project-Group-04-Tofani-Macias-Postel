// temporary landing page for the monolith ui; wireframe screens will replace this
import "./App.css";

function App() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem" }}>
      <h1>SmartStudy - Selected Architecture</h1>
      <p>Layered monolith (single backend app).</p>

      <h2>Milestones</h2>
      <ol>
        <li>Authentication and onboarding</li>
        <li>Study plan generation</li>
        <li>Progress tracking dashboard</li>
        <li>Study groups and check-ins</li>
        <li>AI recommendations</li>
        <li>Testing and architecture evaluation</li>
      </ol>

      <h2>API Base</h2>
      <p>
        Backend runs at <code>http://localhost:8000</code> and routes are under
        <code> /api</code>.
      </p>
    </main>
  );
}

export default App;
