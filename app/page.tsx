export default function Home() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/analyze',
      description: 'Analyze any text for manipulation, hidden meanings, and risk level. Works for anonymous and authenticated users.',
      body: '{\n  "text": "Your text to analyze",\n  "type": "message | contract | medical"\n}',
      auth: 'Optional',
    },
    {
      method: 'POST',
      path: '/api/auth/signup',
      description: 'Create a new account. Returns user info and session token.',
      body: '{\n  "email": "user@example.com",\n  "password": "secret123",\n  "fullName": "Jane Doe"\n}',
      auth: 'None',
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Login with email and password. Returns user info and session token.',
      body: '{\n  "email": "user@example.com",\n  "password": "secret123"\n}',
      auth: 'None',
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Get the current authenticated user. Returns { user: null } if not logged in.',
      body: null,
      auth: 'Cookie or Bearer token',
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      description: 'Logout and clear session.',
      body: null,
      auth: 'Cookie or Bearer token',
    },
    {
      method: 'GET',
      path: '/api/analyses',
      description: 'Get your saved analyses. Supports ?limit=20&offset=0 pagination.',
      body: null,
      auth: 'Required',
    },
    {
      method: 'GET',
      path: '/api/analyses/:id',
      description: 'Get a single saved analysis by ID.',
      body: null,
      auth: 'Required',
    },
    {
      method: 'PATCH',
      path: '/api/analyses/:id',
      description: 'Toggle favorite status on an analysis.',
      body: null,
      auth: 'Required',
    },
    {
      method: 'DELETE',
      path: '/api/analyses/:id',
      description: 'Delete a saved analysis.',
      body: null,
      auth: 'Required',
    },
    {
      method: 'GET',
      path: '/api/health',
      description: 'Health check endpoint. Returns service status.',
      body: null,
      auth: 'None',
    },
  ];

  const methodColors: Record<string, string> = {
    GET: '#34d399',
    POST: '#60a5fa',
    PATCH: '#fbbf24',
    DELETE: '#f87171',
  };

  return (
    <main style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif', background: '#0d0d1a', minHeight: '100vh', color: '#e2e8f0' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ color: '#a78bfa', fontSize: '2.2rem', marginBottom: '0.4rem', fontWeight: 700 }}>Contextify API</h1>
        <p style={{ color: '#9ca3af', fontSize: '1.1rem', margin: 0 }}>AI-powered text analysis with authentication and cloud sync</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ background: '#1e1b4b', color: '#a78bfa', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', border: '1px solid #3730a3' }}>v1.1.0</span>
          <span style={{ background: '#064e3b', color: '#34d399', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', border: '1px solid #065f46' }}>Neon PostgreSQL</span>
          <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', border: '1px solid #1d4ed8' }}>Groq LLaMA 3.3 70B</span>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#c4b5fd', fontSize: '1.1rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Endpoints</h2>
      </div>

      {endpoints.map((ep, i) => (
        <div
          key={i}
          style={{ background: '#1a1a2e', border: '1px solid #312e81', borderRadius: '10px', padding: '1.25rem', marginBottom: '0.75rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{
              background: methodColors[ep.method] + '22',
              color: methodColors[ep.method],
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              border: `1px solid ${methodColors[ep.method]}44`,
            }}>
              {ep.method}
            </span>
            <code style={{ color: '#e2e8f0', fontSize: '0.95rem', fontFamily: 'monospace' }}>{ep.path}</code>
            <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.8rem' }}>Auth: {ep.auth}</span>
          </div>
          <p style={{ color: '#9ca3af', margin: '0 0 0.75rem', fontSize: '0.9rem' }}>{ep.description}</p>
          {ep.body && (
            <pre style={{ background: '#0d0d1a', padding: '0.75rem 1rem', borderRadius: '6px', overflow: 'auto', fontSize: '0.82rem', margin: 0, color: '#c4b5fd', border: '1px solid #1e1b4b' }}>
              {ep.body}
            </pre>
          )}
        </div>
      ))}

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a2e', borderRadius: '8px', border: '1px solid #312e81' }}>
        <h3 style={{ color: '#c4b5fd', margin: '0 0 0.5rem' }}>Authentication</h3>
        <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
          Include your session token as a cookie (<code style={{ color: '#a78bfa' }}>ctx_session</code>) or as a Bearer token in the{' '}
          <code style={{ color: '#a78bfa' }}>Authorization</code> header:{' '}
          <code style={{ color: '#a78bfa' }}>Authorization: Bearer &lt;token&gt;</code>
        </p>
      </div>
    </main>
  );
}
