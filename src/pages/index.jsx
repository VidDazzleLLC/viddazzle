export default function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to right, #667eea, #764ba2)',
      color: 'white',
      textAlign: 'center',
      padding: '80px 20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '20px' }}>
        Autopilot
      </h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
        AI reads social posts → scores leads → replies → syncs to CRM
      </p>
      <a 
        href="https://buy.stripe.com/7sYcN4dL96YF3SgfbE3Ru0h"
        style={{
          background: 'white',
          color: '#667eea',
          padding: '16px 40px',
          borderRadius: '50px',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          textDecoration: 'none'
        }}
      >
        Start Free Trial — $49/month
      </a>
    </div>
  );
}