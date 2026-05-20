const { authenticator } = require('otplib');
const QRCode = require('qrcode');

authenticator.options = { window: 1 };

function generateSecret() {
  return authenticator.generateSecret();
}

async function generateQRCode(secret, accountLabel) {
  const otpauth = authenticator.keyuri(accountLabel, 'PaymentsSystem', secret);
  return QRCode.toDataURL(otpauth);
}

function verifyToken(secret, token) {
  return authenticator.verify({ secret, token });
}

module.exports = { generateSecret, generateQRCode, verifyToken };
