const { cleanupExpiredSessions, cleanupRateLimits } = require('../_lib/security');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.CLEANUP_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await cleanupExpiredSessions();
        await cleanupRateLimits();
        return res.status(200).json({ success: true, message: 'Cleanup completed' });
    } catch (error) {
        console.error('Cleanup error:', error);
        return res.status(500).json({ error: 'Cleanup failed' });
    }
};
