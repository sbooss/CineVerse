module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { createClient } = require('@supabase/supabase-js');
        const bcrypt = require('bcryptjs');
        const jwt = require('jsonwebtoken');
        const { v4: uuidv4 } = require('uuid');

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_KEY = process.env.SUPABASE_KEY;
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!SUPABASE_URL || !SUPABASE_KEY || !JWT_SECRET) {
            return res.status(500).json({ error: 'Missing env vars', url: !!SUPABASE_URL, key: !!SUPABASE_KEY, jwt: !!JWT_SECRET });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

        if (req.method === 'GET') {
            const { data, error } = await supabase.from('users').select('id').limit(1);
            return res.status(200).json({ ok: true, env: true, supabase: !error, tables: data ? data.length : 0 });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        return res.status(500).json({ error: error.message, stack: error.stack ? error.stack.substring(0, 500) : '' });
    }
};
