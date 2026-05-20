import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function MfaSetup() {
  const [qrCode, setQrCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    client.post('/auth/mfa/setup')
      .then(res => setQrCode(res.data.qr_code))
      .catch(() => alert('Failed to set up MFA'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md text-center">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">SAIINT BANK INC</p>
        <h1 className="text-2xl font-bold mb-4">Set Up Two-Factor Authentication</h1>
        <p className="text-gray-600 mb-6">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then verify below.
        </p>
        {qrCode ? (
          <img src={qrCode} alt="MFA QR Code" className="mx-auto mb-6 rounded border" />
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">Generating…</div>
        )}
        <button
          onClick={() => navigate('/mfa/verify')}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          I've scanned it — Verify OTP
        </button>
      </div>
    </div>
  );
}
