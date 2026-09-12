const {
    supabase, setCors, handleOptions,
    jsonError, jsonSuccess
} = require('../_lib/security');

module.exports = async function handler(req, res) {
    setCors(req, res);
    if (req.method === 'OPTIONS') return handleOptions(res);
    if (req.method !== 'POST') return jsonError(res, 405, 'Method not allowed');

    try {
        const { email } = req.body || {};
        if (!email) return jsonError(res, 400, 'Email obrigatorio');

        const normalizedEmail = email.toLowerCase().trim();

        const { data: user } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', normalizedEmail)
            .single();

        if (!user) return jsonSuccess(res, { message: 'Se o email estiver cadastrado, voce recebera um link de redefinicao.' });

        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const { error } = await supabase.from('password_resets').insert({
            user_id: user.id,
            token: resetToken,
            expires_at: expires,
            created_at: new Date().toISOString()
        });

        if (error) console.error('Password reset insert error:', error);

        return jsonSuccess(res, { message: 'Se o email estiver cadastrado, voce recebera um link de redefinicao.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return jsonSuccess(res, { message: 'Se o email estiver cadastrado, voce recebera um link de redefinicao.' });
    }
};
