import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder — in real app, this would call Firebase
    setTimeout(() => {
      alert('Login successful! Redirecting to app...');
      window.location.href = '/app';
      setLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    // Placeholder for Google Auth
    setTimeout(() => {
      alert('Google login successful! Redirecting to app...');
      window.location.href = '/app';
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to right, #667eea, #764ba2)',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        color: '#333',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          Welcome to Autopilot
        </h1>
        <p style={{ marginBottom: '30px' }}>
          Sign in to access your dashboard
        </p>
        
        {/* Email/Password Login */}
        <form onSubmit={handleLogin} style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            required
          />
          <button type="submit" disabled={loading} style={{
            width: '100%',
            background: '#667eea',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '10px'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginBottom: '20px' }}>or</p>

        {/* Google Login */}
        <button onClick={handleGoogleLogin} disabled={loading} style={{
          width: '100%',
          background: '#4285f4',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          New? <a href="#" style={{ color: '#667eea' }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}