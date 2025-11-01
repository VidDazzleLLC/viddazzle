export default function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          fontSize: '5rem',
          fontWeight: '900',
          background: 'linear-gradient(to right, #60a5fa, #c084fc)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Autopilot
        </h1>
      </div>

      {/* Headline */}
      <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: '700' }}>
        AI Reads Social Posts → Scores Leads → Replies → Syncs to CRM
      </h2>

      {/* Subheadline */}
      <p style={{ fontSize: '1.5rem', marginBottom: '40px', opacity: 0.9, maxWidth: '700px' }}>
        Turn every comment into a customer. No code. No setup. Just $49/month.
      </p>

      {/* Features */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '50px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', minWidth: '200px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🤖</div>
          <p style={{ fontWeight: 'bold' }}>AI Replies</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Instant, personalized responses</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', minWidth: '200px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎯</div>
          <p style={{ fontWeight: 'bold' }}>Lead Scoring</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>0–100 intent score</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', minWidth: '200px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚡</div>
          <p style={{ fontWeight: 'bold' }}>CRM Sync</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Auto-add to HubSpot, Salesforce</p>
        </div>
      </div>

      {/* CTA */}
      <a href="https://buy.stripe.com/7sYcN4dL96YF3SgfbE3Ru0h"
         style={{
           background: 'linear-gradient(to right, #10b981, #34d399)',
           color: 'white',
           padding: '20px 50px',
           borderRadius: '50px',
           fontSize: '1.5rem',
           fontWeight: 'bold',
           textDecoration: 'none',
           boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
           transition: 'all 0.3s'
         }}
         onMouseOver={e => e.target.style.transform = 'translateY(-5px)'}
         onMouseOut={e => e.target.style.transform = 'translateY(0)'}
      >
        Start Free Trial — $49/month
      </a>

      <p style={{ marginTop: '20px', opacity: 0.8 }}>
        No credit card required • Cancel anytime
      </p>
    </div>
  );
}