const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const webhookRoutes = require('./routes/webhook');
const emailService = require('./services/email');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cineboss_secret_key_2026_ultra_secure';

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhook', webhookRoutes);

app.use(express.static(path.join(__dirname, '..')));

app.use((req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`CINE BOSS server running on port ${PORT}`);
});

module.exports = app;
