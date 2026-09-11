const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dofzztjpqedsaazbvzfg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_kMdmYXAFE_gxGiCZHHwrzQ_E3JlEV1l';
const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getToken(req) {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/token=([^;]+)/);
    if (match) return match[1];
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const token = getToken(req);
        if (token) {
            await supabase.from('sessions').delete().eq('token', token);
        }
        res.setHeader('Set-Cookie', 'token=; Path=/; HttpOnly; Max-Age=0');
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(200).json({ success: true });
    }
};
