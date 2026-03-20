export default function Home() {
  return (
    <main style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#a78bfa', fontSize: '2rem', marginBottom: '0.5rem' }}>Contextify API</h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>AI-powered text analysis backend</p>

      <div style={{ background: '#1a1a2e', border: '1px solid #312e81', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem' }}>
        <h2 style={{ color: '#c4b5fd', marginTop: 0 }}>POST /api/analyze</h2>
        <p>Analyze any text for manipulation, hidden meanings, and risk level.</p>
        <pre style={{ background: '#0d0d1a', padding: '1rem', borderRadius: '4px', overflow: 'auto', fontSize: '0.85rem' }}>
{`{
  "text": "Your text to analyze",
  "type": "message | contract | medical"
}`}
        </pre>
      </div>

      <div style={{ background: '#1a1a2e', border: '1px solid #312e81', borderRadius: '8px', padding: '1.5rem' }}>
        <h2 style={{ color: '#c4b5fd', marginTop: 0 }}>GET /api/health</h2>
        <p>Health check endpoint.</p>
      </div>
    </main>
  );
}
