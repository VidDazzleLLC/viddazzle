import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // EMAIL/PASSWORD LOGIN
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/app';
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
    setLoading(false);
  };

  // GOOGLE LOGIN — FORCES ACCOUNT PICKER
  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'  // This forces the Google account chooser
    });
    try {
      await signInWithPopup(auth, provider);
      window.location.href = '/app';
    } catch (error) {
      alert('Google login failed: ' + error.message);
    }
    setLoading(false);
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

        {/* EMAIL/PASSWORD LOGIN */}
        <form onSubmit={handleEmailLogin} style={{ marginBottom: '20px' }}>
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
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#667eea',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginBottom: '20px' }}>or</p>

        {/* GOOGLE LOGIN */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          style={{
            width: '100%',
            background: '#4285f4',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          New? <a href="#" style={{ color: '#667eea' }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}