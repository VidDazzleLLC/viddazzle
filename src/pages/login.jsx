export default function Login() {
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
          Sign up to start scoring leads
        </p>
        
        {/* Email/Password Signup */}
        <form style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="Email"
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
          />
          <button type="submit" style={{
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
            Sign Up
          </button>
        </form>

        <p style={{ marginBottom: '20px' }}>or</p>

        {/* Google Auth */}
        <button style={{
          width: '100%',
          background: '#4285f4',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          Sign Up with Google
        </button>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Already have an account? <a href="#" style={{ color: '#667eea' }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}