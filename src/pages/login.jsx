import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
          },
        });

        if (error) throw error;

        if (data?.user?.identities?.length === 0) {
          setError('An account with this email already exists. Please sign in instead.');
        } else {
          setMessage('Account created! Please check your email to confirm your account.');
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Redirect to app
        router.push('/app');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{isSignUp ? 'Sign Up' : 'Sign In'} - Autopilot</title>
      </Head>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #667eea, #764ba2)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          color: '#333',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>
            Welcome to Autopilot
          </h1>
          <p style={{ marginBottom: '30px', color: '#666' }}>
            {isSignUp ? 'Create your account' : 'Sign in to access your dashboard'}
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fee',
              color: '#c00',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div style={{
              background: '#efe',
              color: '#060',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} style={{ marginBottom: '20px' }}>
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
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              required
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#999' : '#667eea',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '10px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <p style={{ marginBottom: '20px', color: '#999' }}>or</p>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#999' : '#4285f4',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
            </svg>
            {loading ? 'Loading...' : 'Sign in with Google'}
          </button>

          {/* Toggle Sign Up / Sign In */}
          <p style={{ marginTop: '20px', fontSize: '14px' }}>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignUp(false);
                    setError('');
                    setMessage('');
                  }}
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Sign in
                </a>
              </>
            ) : (
              <>
                New to Autopilot?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignUp(true);
                    setError('');
                    setMessage('');
                  }}
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Create account
                </a>
              </>
            )}
          </p>

          {/* Back to Landing */}
          <p style={{ marginTop: '15px', fontSize: '14px' }}>
            <Link
              href="/"
              style={{ color: '#999', textDecoration: 'none' }}
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
