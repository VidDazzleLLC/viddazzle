import { useState, useEffect } from 'react';

export default function Landing() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date('2025-11-28T23:59:59').getTime();

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
      padding: '40px 20px'
    }}>
      {/* Header */}
      <h1 style={{
        fontSize: '6rem',
        fontWeight: '900',
        marginBottom: '20px',
        background: 'linear-gradient(to right, #60a5fa, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
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
          🔥 WOW: <span style={{ color: 'white' }}>Up to 10 Leads Per Post</span>
        </p>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
          Our AI finds hidden buyers in comments — <strong>average user gets up to 30 leads/month</strong>.<br />
          <strong>Let Autopilot promote your affiliate links while you sleep.</strong>
        </p>
      </div>

            {/* NEW PREMIUM FEATURES */}
      <div style={{
        background: 'rgba(99,102,241,0.1)',
        border: '2px solid rgba(99,102,241,0.3)',
        borderRadius: '20px',
        padding: '30px',
        margin: '40px auto',
        maxWidth: '900px'
      }}>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1', textAlign: 'center', marginBottom: '30px' }}>
          🚀 NEW: Enterprise AI Engine
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{
            background: 'rgba(16,185,129,0.1)',
            border: '2px solid rgba(16,185,129,0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚡</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>98% Cost Reduction</div>
            <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Super-efficient batch processing analyzes 50 mentions per AI call</div>
          </div>
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '2px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎯</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>Lead Quality Scoring</div>
            <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>0-100 score based on buying intent, engagement, audience & relevance</div>
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.1)',
            border: '2px solid rgba(245,158,11,0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💼</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>Industry Targeting</div>
            <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Premium scoring for Legal, Mortgage, Real Estate, Healthcare & more</div>
          </div>
        </div>
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
          BLACK FRIDAY — ONLY 50 SPOTS
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
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '12px', minWidth: '80px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{String(timeLeft.days || 0).padStart(2, '0')}</div>
          <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.7 }}>Days</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '12px', minWidth: '80px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{String(timeLeft.hours || 0).padStart(2, '0')}</div>
          <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.7 }}>Hours</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '12px', minWidth: '80px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{String(timeLeft.minutes || 0).padStart(2, '0')}</div>
          <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.7 }}>Mins</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '12px', minWidth: '80px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{String(timeLeft.seconds || 0).padStart(2, '0')}</div>
          <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', opacity: 0.7 }}>Secs</div>
        </div>
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
           display: 'inline-block'
         }}>
        CLAIM BLACK FRIDAY DEAL NOW
      </a>

      <p style={{ marginTop: '20px', fontSize: '1.1rem', opacity: 0.8 }}>
        Cancel anytime
      </p>
    </div>
  );
}
