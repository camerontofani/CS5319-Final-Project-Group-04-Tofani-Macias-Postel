// temporary landing page for the microservices ui; wireframe screens will replace this
import "./App.css";

function App() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem" }}>
      <h1>SmartStudy - Unselected Architecture</h1>
      <p>Microservices (gateway + separate backend services).</p>

      <h2>Milestones</h2>
      <ol>
        <li>Gateway + Auth service</li>
        <li>Study Plan service</li>
        <li>Progress service</li>
        <li>Group service</li>
        <li>AI service (and optional notification service)</li>
        <li>Cross-service testing and architecture evaluation</li>
      </ol>

      <h2>Gateway Base</h2>
      <p>
        Gateway runs at <code>http://localhost:8100</code> and routes to service
        ports 8101-8106.
      </p>
    </main>
  );
}

export default App;
