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
    </div>
  );
}