import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Landing() {
  const handleCheckout = async () => {
    window.location.href = 'https://buy.stripe.com/7sYcN4dL96YF3SgfbE3Ru0h';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <section className="py-24 text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Autopilot
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          AI reads social posts → scores leads → replies → syncs to CRM
        </p>
        <p className="text-3xl font-bold mb-12 text-green-400">
          Turn $1 in ads into $10 in revenue
        </p>
        <button
          onClick={handleCheckout}
          className="bg-white text-purple-900 px-10 py-5 rounded-full text-xl font-bold hover:scale-105 transition transform"
        >
          Start Free Trial — $49/month
        </button>
        <p className="mt-4 text-sm opacity-75">No credit card required</p>
      </section>

      <section className="py-16 bg-white/10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-12">How You Make Money</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-3 text-green-400">$0 → $490</h3>
              <p>10 customers × $49 = <strong>$490/month</strong></p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-3 text-cyan-400">1 Post = 5 Leads</h3>
              <p>AI finds hidden buyers in comments</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6">
              <h3 className="text-2xl font-bold mb-3 text-purple-400">Close 2x Faster</h3>
              <p>AI replies instantly while they’re hot</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <button
          onClick={handleCheckout}
          className="bg-gradient-to-r from-green-400 to-cyan-500 text-purple-900 px-12 py-6 rounded-full text-2xl font-bold hover:scale-110 transition transform"
        >
          Get Autopilot — $49/month
        </button>
      </section>
    </div>
  );
}