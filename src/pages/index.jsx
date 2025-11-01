import { useState, useEffect } from 'react';

export default function Landing() {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const target = new Date('2025-11-28T23:59:59').getTime(); // Black Friday 2025 Midnight

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
        animation: 'pulse 6s infinite'
      }}></div>

      {/* Header */}
      <h1 style={{
        fontSize: '6rem',
        fontWeight: '900',
        marginBottom: '20px',
        background: 'linear-gradient(to right, #60a5fa, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 30px rgba(96,165,250,0.5)',
        letterSpacing: '-2px'
      }}>
        AUTOPILOT
      </h1>

      <p style={{ fontSize: '1.8rem', marginBottom: '30px', opacity: 0.9 }}>
        AI reads every social post → scores leads → replies → syncs to CRM
      </p>

      {/* WOW FEATURE */}
      <div style={{
        background: 'rgba(34,197,94,0.15)',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: '20px',
        padding: '20px',
        margin: '0 auto 40px',
        maxWidth: '800px',
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#86efac' }}>
          🔥 WOW FEATURE: <span style={{ color: 'white' }}>1 Post = 10 Leads in 24h</span>
        </p>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          Our AI finds hidden buyers in comments — <strong>average user gets 30 leads/month</strong>
        </p>
      </div>

      {/* BLACK FRIDAY DEAL */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '1.5rem', textDecoration: 'line-through', opacity: 0.6 }}>
          $149/month
        </p>
        <p style={{ fontSize: '4rem', fontWeight: 'bold', color: '#10b981' }}>
          $49/month
        </p>
        <p style={{ fontSize: '1.3rem', color: '#fbbf24', fontWeight: 'bold' }}>
          BLACK FRIDAY DEAL — ONLY 50 SPOTS
        </p>
      </div>

      {/* COUNTDOWN */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '40px',
        fontFamily: 'monospace'
      }}>
        {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
          <div key={unit} style={{
            background: 'rgba(255,255,255,0.1)',
            padding: '15px 20px',
            borderRadius: '12px',
            minWidth: '80px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {String(timeLeft[unit] || 0).padStart(2, '0')}
            </div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.7 }}>
              {unit}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <a href="https://buy.stripe.com/7sYcN4dL96YF3SgfbE3Ru0h"
         style={{
           background: 'linear-gradient(to right, #f59e0b, #ef4444)',
           color: 'white',
           padding: '20px 60px',
           borderRadius: '50px',
           fontSize: '1.6rem',
           fontWeight: 'bold',
           textDecoration: 'none',
           boxShadow: '0 15px 35px rgba(239,68,68,0.4)',
           display: 'inline-block',
           animation: 'pulse 2s infinite'
         }}>
        CLAIM BLACK FRIDAY DEAL NOW
      </a>

      <p style={{ marginTop: '20px', fontSize: '1.1rem', opacity: 0.8 }}>
        <strong>Free 7-day trial</strong> • Cancel anytime • 30-day money-back
      </p>

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}