/**
 * Meta Conversions API Proxy Server
 * For: Holly The Locator (hollythelocator.com)
 *
 * This server receives tracking events from the Squarespace website
 * and forwards them securely to Meta's Conversions API.
 * This keeps the Meta Access Token secret (never exposed in browser code).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Configuration ───────────────────────────────────────────────────────
const META_PIXEL_ID = process.env.META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_API_URL = `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events`;

if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
  console.error('❌ ERROR: META_PIXEL_ID and META_ACCESS_TOKEN must be set in .env');
  process.exit(1);
}

// ── Middleware ───────────────────────────────────────────────────────────

// CORS: Allow requests from Holly's Squarespace site
const allowedOrigins = [
  'https://hollythelocator.com',
  'https://www.hollythelocator.com',
  'http://localhost:3000', // for local testing
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin === allowed)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// ── Logging helper ──────────────────────────────────────────────────────
function log(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

// ── Health check endpoint ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Holly The Locator - Meta Conversions API Proxy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Main tracking endpoint ──────────────────────────────────────────────
app.post('/api/track-event', async (req, res) => {
  try {
    const {
      event_name,
      event_time,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
    } = req.body;

    // Validate required fields
    if (!event_name) {
      return res.status(400).json({ error: 'event_name is required' });
    }

    // Build the event data for Meta Conversions API
    const eventData = {
      event_name,
      event_time: event_time || Math.floor(Date.now() / 1000),
      event_id: event_id || crypto.randomUUID(),
      event_source_url: event_source_url || '',
      action_source: 'website',
      user_data: {
        // Use client IP from the request if not provided
        client_ip_address: user_data.client_ip_address
          || req.headers['x-forwarded-for']?.split(',')[0]?.trim()
          || req.ip,
        client_user_agent: user_data.client_user_agent
          || req.headers['user-agent'],
        // Facebook click ID and browser ID cookies
        fbp: user_data.fbp || undefined,
        fbc: user_data.fbc || undefined,
        // Hashed PII fields (if provided, they should already be SHA256)
        em: user_data.em || undefined,   // hashed email
        ph: user_data.ph || undefined,   // hashed phone
        fn: user_data.fn || undefined,   // hashed first name
        ln: user_data.ln || undefined,   // hashed last name
      },
      custom_data: custom_data || {},
    };

    // Remove undefined values from user_data
    Object.keys(eventData.user_data).forEach(key => {
      if (eventData.user_data[key] === undefined) {
        delete eventData.user_data[key];
      }
    });

    log(`📡 Sending ${event_name} event to Meta`, {
      event_name,
      event_id: eventData.event_id,
      event_source_url: eventData.event_source_url,
    });

    // Send to Meta Conversions API
    const response = await axios.post(META_API_URL, {
      data: [eventData],
      access_token: META_ACCESS_TOKEN,
    });

    log(`✅ Meta API response for ${event_name}`, response.data);

    res.json({
      success: true,
      event_name,
      event_id: eventData.event_id,
      meta_response: response.data,
    });

  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    log(`❌ Error sending event to Meta`, errorDetails);

    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to send event to Meta',
      details: errorDetails,
    });
  }
});

// ── Test endpoint (for verifying setup) ─────────────────────────────────
app.post('/api/test', async (req, res) => {
  try {
    const testEvent = {
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `test_${crypto.randomUUID()}`,
      event_source_url: 'https://hollythelocator.com',
      action_source: 'website',
      user_data: {
        client_ip_address: req.ip,
        client_user_agent: req.headers['user-agent'],
      },
    };

    const response = await axios.post(META_API_URL, {
      data: [testEvent],
      access_token: META_ACCESS_TOKEN,
      // Use test_event_code for testing without affecting real data
      // test_event_code: 'TEST12345',  // Uncomment and set your test code from Events Manager
    });

    log('✅ Test event sent successfully', response.data);
    res.json({
      success: true,
      message: 'Test event sent to Meta successfully!',
      meta_response: response.data,
    });
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    log('❌ Test event failed', errorDetails);
    res.status(500).json({
      success: false,
      error: 'Test event failed',
      details: errorDetails,
    });
  }
});

// ── Start server ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Meta Conversions API Proxy Server`);
  console.log(`   Running on port ${PORT}`);
  console.log(`   Pixel ID: ${META_PIXEL_ID}`);
  console.log(`   Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Ready to receive events!\n`);
});
