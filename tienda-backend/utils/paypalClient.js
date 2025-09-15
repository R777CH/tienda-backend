// utils/paypalClient.js
const paypal = require('@paypal/checkout-server-sdk');

function paypalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = (process.env.PAYPAL_MODE || 'sandbox').toLowerCase();

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL credentials not set in env');
  }

  if (mode === 'live') {
    return new paypal.core.PayPalHttpClient(new paypal.core.LiveEnvironment(clientId, clientSecret));
  }
  return new paypal.core.PayPalHttpClient(new paypal.core.SandboxEnvironment(clientId, clientSecret));
}

module.exports = paypalClient();
