import { useNavigate, Link } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Nav */}
      <header className="px-8 py-5 flex justify-between items-center border-b border-white/10">
        <div>
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block">SAIINT BANK INC</span>
        </div>
        <nav className="flex gap-6 items-center text-sm">
          <Link to="/employee/login" className="text-gray-400 hover:text-white transition-colors">
            Staff Portal
          </Link>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-gray-950 px-4 py-1.5 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            Log In
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4">
          International Banking
        </p>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 max-w-2xl">
          Move money<br />
          <span className="text-blue-400">across borders.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-md mb-10">
          Secure, fast international payments for individuals and businesses worldwide.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded font-medium text-base transition-colors"
          >
            Log In to Online Banking
          </button>
          <button
            onClick={() => navigate('/register')}
            className="border border-white/20 hover:border-white/40 text-white px-8 py-3 rounded font-medium text-base transition-colors"
          >
            Open an Account
          </button>
        </div>
      </main>

      {/* Features strip */}
      <section className="border-t border-white/10 px-8 py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Bank-grade security</h3>
            <p className="text-gray-500 text-sm">AES-256 encryption and MFA on every account.</p>
          </div>
          <div>
            <div className="text-2xl mb-2">🌍</div>
            <h3 className="font-semibold mb-1">Global reach</h3>
            <p className="text-gray-500 text-sm">Send payments to 25+ countries with live exchange rates.</p>
          </div>
          <div>
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-semibold mb-1">Fast processing</h3>
            <p className="text-gray-500 text-sm">Transactions reviewed and submitted within 24 hours.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-white/10 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} SAIINT BANK INC. All rights reserved.
        <span className="mx-3">·</span>
        <Link to="/employee/login" className="hover:text-gray-400 transition-colors">Staff Login</Link>
      </footer>

    </div>
  );
}
