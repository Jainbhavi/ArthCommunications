// netlify/functions/submit-contact.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Simple honeypot (ignore obvious bots)
  if (data.company) {
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const { name, email, organization = '', service = '', message } = data;

  if (!name || !email || !message) {
    return {
      statusCode: 422,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  const ip =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for'] ||
    '';
  const user_agent = event.headers['user-agent'] || '';

  const { error } = await supabase.from('contacts').insert({
    name,
    email,
    organization,
    service,
    message,
    ip,
    user_agent
  });

  if (error) {
    console.error('Supabase insert error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database insert failed' })
    };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
}
