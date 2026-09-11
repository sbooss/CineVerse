const API_BASE = window.location.origin + '/api';

class SoundManager {
    constructor() { this.ctx = null; this.muted = false; }
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    tone(f, d, t, v) {
        if (this.muted || !this.ctx) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = t || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(v || 0.12, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
        o.connect(g).connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + d);
    }
    success() { this.init(); this.tone(523, 0.12, 'sine', 0.1); setTimeout(() => this.tone(659, 0.12, 'sine', 0.1), 80); setTimeout(() => this.tone(784, 0.2, 'sine', 0.13), 160); }
    error() { this.init(); this.tone(200, 0.2, 'sawtooth', 0.08); setTimeout(() => this.tone(150, 0.25, 'sawtooth', 0.06), 120); }
    click() { this.init(); this.tone(800, 0.04, 'sine', 0.06); }
    toggle() { this.muted = !this.muted; }
}
const sounds = new SoundManager();

class AuthManager {
    constructor() {
        this.user = null; this.subscription = null; this.loggedIn = false;
        this.listeners = []; this.checking = false;
    }
    onAuthChange(cb) { this.listeners.push(cb); }
    notify() { this.listeners.forEach(cb => cb(this.user, this.subscription, this.loggedIn)); }

    async check() {
        if (this.checking) return;
        this.checking = true;
        try {
            const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
            const d = await r.json();
            this.loggedIn = d.loggedIn || false; this.user = d.user || null; this.subscription = d.subscription || null;
        } catch { this.loggedIn = false; this.user = null; this.subscription = null; }
        this.checking = false; this.notify();
    }

    async login(email, password, remember) {
        const r = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password, remember }) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
        this.loggedIn = true; this.user = d.user; this.subscription = d.subscription; this.notify(); return d;
    }

    async register(name, email, password) {
        const r = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name, email, password }) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
        this.loggedIn = true; this.user = d.user; this.subscription = null; this.notify(); return d;
    }

    async logout() {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        this.loggedIn = false; this.user = null; this.subscription = null; this.notify();
    }

    hasActiveSubscription() { return !!this.subscription && this.subscription.status === 'active'; }

    requireAuth() { if (!this.loggedIn) { this.showRegister(); return false; } return true; }

    requireSubscription() {
        if (!this.loggedIn) { this.showRegister(); return false; }
        if (!this.hasActiveSubscription()) { this.showPaywall(); return false; }
        return true;
    }

    showAuthModal() { this._showAuth('register'); }
    showLogin() { this._showAuth('login'); }
    showRegister() { this._showAuth('register'); }

    _showAuth(tab) {
        let m = document.getElementById('authModal');
        if (!m) { m = this._createAuthModal(); document.body.appendChild(m); }
        m.style.display = 'flex';
        setTimeout(() => m.classList.add('active'), 10);
        const target = tab === 'register' ? 1 : 0;
        m.querySelectorAll('.auth-tab')[target].click();
    }

    showPaywall() {
        let m = document.getElementById('paywallModal');
        if (!m) { m = this._createPaywallModal(); document.body.appendChild(m); }
        m.style.display = 'flex';
        setTimeout(() => m.classList.add('active'), 10);
    }

    closeModal(id) {
        const m = document.getElementById(id);
        if (m) { m.classList.remove('active'); setTimeout(() => m.style.display = 'none', 300); }
    }

    _createAuthModal() {
        const m = document.createElement('div');
        m.id = 'authModal'; m.className = 'auth-modal';
        m.innerHTML = `
        <div class="auth-backdrop"></div>
        <div class="auth-modal-wrap">
            <div class="auth-left">
                <div class="auth-left-content">
                    <div class="auth-brand">CINE <span>BOSS</span></div>
                    <h2 class="auth-headline">Seu cinema personalizado.</h2>
                    <p class="auth-sub">Milhares de filmes, series e animes. Tudo em portugues. Sem anuncios. Qualidade premium.</p>
                    <div class="auth-perks">
                        <div class="auth-perk"><i class="fas fa-film"></i><span>Filmes e series exclusivos</span></div>
                        <div class="auth-perk"><i class="fas fa-language"></i><span>Dublado e legendado em PT-BR</span></div>
                        <div class="auth-perk"><i class="fas fa-tv"></i><span>TV ao vivo e conteudo internacional</span></div>
                        <div class="auth-perk"><i class="fas fa-mobile-screen"></i><span>Assista em qualquer dispositivo</span></div>
                    </div>
                </div>
            </div>
            <div class="auth-right">
                <button class="auth-close-x" onclick="auth.closeModal('authModal')"><i class="fas fa-xmark"></i></button>
                <div class="auth-form-area">
                    <div class="auth-tabs-row">
                        <button class="auth-tab" data-tab="login">Ja tenho conta</button>
                        <button class="auth-tab active" data-tab="register">Criar conta</button>
                    </div>
                    <form class="auth-form" id="loginForm" style="display:none">
                        <div class="auth-input-group">
                            <label>Email</label>
                            <input type="email" id="loginEmail" placeholder="seu@email.com" required autocomplete="email">
                        </div>
                        <div class="auth-input-group">
                            <label>Senha</label>
                            <input type="password" id="loginPassword" placeholder="Sua senha" required autocomplete="current-password">
                        </div>
                        <div class="auth-row-between">
                            <label class="auth-remember"><input type="checkbox" id="rememberMe"> Lembrar</label>
                            <span class="auth-link" onclick="auth.forgotPassword()">Esqueci a senha</span>
                        </div>
                        <div class="auth-error" id="loginError"></div>
                        <button type="submit" class="auth-submit-btn" id="loginBtn">ENTRAR</button>
                        <p class="auth-switch">Nao tem conta? <span onclick="document.querySelectorAll('.auth-tab')[1].click()">Cadastre-se</span></p>
                    </form>
                    <form class="auth-form active" id="registerForm">
                        <div class="auth-input-group">
                            <label>Nome</label>
                            <input type="text" id="regName" placeholder="Seu nome" required autocomplete="name">
                        </div>
                        <div class="auth-input-group">
                            <label>Email</label>
                            <input type="email" id="regEmail" placeholder="seu@email.com" required autocomplete="email">
                        </div>
                        <div class="auth-input-group">
                            <label>Senha</label>
                            <input type="password" id="regPassword" placeholder="Minimo 6 caracteres" required autocomplete="new-password">
                        </div>
                        <div class="auth-error" id="regError"></div>
                        <button type="submit" class="auth-submit-btn gold" id="regBtn">CRIAR MINHA CONTA</button>
                        <p class="auth-switch">Ja tem conta? <span onclick="document.querySelectorAll('.auth-tab')[0].click()">Entrar</span></p>
                    </form>
                </div>
            </div>
        </div>`;

        const style = document.createElement('style');
        style.textContent = `
        .auth-modal{display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:16px}
        .auth-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(20px)}
        .auth-modal-wrap{position:relative;z-index:1;display:flex;width:100%;max-width:820px;min-height:520px;background:#0c0c18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;transform:translateY(20px) scale(0.97);opacity:0;transition:all .35s cubic-bezier(.4,0,.2,1)}
        .auth-modal.active .auth-modal-wrap{transform:translateY(0) scale(1);opacity:1}
        .auth-left{flex:1;background:linear-gradient(135deg,#0a1628,#0c1a30,#0a1020);padding:40px 32px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(255,255,255,0.04)}
        .auth-brand{font-family:'Sora',sans-serif;font-size:20px;font-weight:800;letter-spacing:2px;color:#e8e8f0;margin-bottom:20px}
        .auth-brand span{color:#00a8e0}
        .auth-headline{font-family:'Sora',sans-serif;font-size:26px;font-weight:800;line-height:1.2;color:#fff;margin-bottom:10px}
        .auth-sub{font-size:13px;color:#8a8aa0;line-height:1.6;margin-bottom:28px}
        .auth-perks{display:flex;flex-direction:column;gap:14px}
        .auth-perk{display:flex;align-items:center;gap:12px;font-size:13px;color:#b0b0c8}
        .auth-perk i{width:32px;height:32px;background:rgba(0,168,224,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#00a8e0;font-size:13px;flex-shrink:0}
        .auth-right{width:380px;padding:32px 28px;position:relative;display:flex;flex-direction:column}
        .auth-close-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;color:#4a4a60;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;z-index:2}
        .auth-close-x:hover{color:#fff;background:rgba(255,255,255,0.06)}
        .auth-tabs-row{display:flex;gap:2px;margin-bottom:24px;background:rgba(255,255,255,0.03);border-radius:8px;padding:3px}
        .auth-tab{flex:1;padding:10px;background:none;border:none;color:#4a4a60;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;transition:all .2s;font-family:'Inter',sans-serif}
        .auth-tab.active{background:rgba(0,168,224,0.12);color:#00a8e0}
        .auth-tab:hover:not(.active){color:#8a8aa0}
        .auth-form{display:none;flex-direction:column;gap:16px}
        .auth-form.active{display:flex}
        .auth-input-group label{display:block;font-size:12px;font-weight:600;color:#8a8aa0;margin-bottom:6px;letter-spacing:0.3px}
        .auth-input-group input{width:100%;padding:12px 14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;color:#e8e8f0;font-size:14px;outline:none;transition:all .2s;font-family:'Inter',sans-serif}
        .auth-input-group input:focus{border-color:rgba(0,168,224,0.4);background:rgba(255,255,255,0.06)}
        .auth-input-group input::placeholder{color:#3a3a50}
        .auth-row-between{display:flex;align-items:center;justify-content:space-between}
        .auth-remember{display:flex;align-items:center;gap:6px;font-size:12px;color:#6a6a80;cursor:pointer}
        .auth-remember input{accent-color:#00a8e0}
        .auth-link{font-size:12px;color:#00a8e0;cursor:pointer;transition:color .2s}
        .auth-link:hover{color:#00c8ff}
        .auth-error{color:#ff4466;font-size:12px;min-height:16px;text-align:center}
        .auth-submit-btn{width:100%;padding:14px;background:#00a8e0;border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:700;letter-spacing:0.5px;cursor:pointer;transition:all .25s;font-family:'Inter',sans-serif}
        .auth-submit-btn:hover{background:#0090c0;box-shadow:0 4px 20px rgba(0,168,224,0.3);transform:translateY(-1px)}
        .auth-submit-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .auth-submit-btn.gold{background:linear-gradient(135deg,#c9a54e,#e0be6a);color:#0a0a12}
        .auth-submit-btn.gold:hover{background:linear-gradient(135deg,#d4b05a,#eac876);box-shadow:0 4px 20px rgba(201,165,78,0.3)}
        .auth-switch{text-align:center;font-size:12px;color:#4a4a60;margin-top:4px}
        .auth-switch span{color:#00a8e0;cursor:pointer;font-weight:600}
        .auth-switch span:hover{text-decoration:underline}
        @media(max-width:700px){.auth-modal-wrap{flex-direction:column;max-width:400px;min-height:auto}.auth-left{display:none}.auth-right{width:100%;padding:28px 24px}}
        `;
        m.appendChild(style);

        m.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                sounds.click();
                m.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                m.querySelectorAll('.auth-form').forEach(f => { f.classList.remove('active'); f.style.display = 'none'; });
                tab.classList.add('active');
                const form = document.getElementById(tab.dataset.tab + 'Form');
                form.classList.add('active'); form.style.display = 'flex';
            });
        });

        m.querySelector('.auth-backdrop').addEventListener('click', () => this.closeModal('authModal'));

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('loginError');
            const btn = document.getElementById('loginBtn');
            err.textContent = ''; btn.disabled = true; btn.textContent = 'ENTRANDO...';
            try {
                await this.login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value, document.getElementById('rememberMe').checked);
                sounds.success(); this.closeModal('authModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (e) { err.textContent = e.message; sounds.error(); }
            btn.disabled = false; btn.textContent = 'ENTRAR';
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('regError');
            const btn = document.getElementById('regBtn');
            err.textContent = ''; btn.disabled = true; btn.textContent = 'CRIANDO...';
            try {
                await this.register(document.getElementById('regName').value, document.getElementById('regEmail').value, document.getElementById('regPassword').value);
                sounds.success(); this.closeModal('authModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (e) { err.textContent = e.message; sounds.error(); }
            btn.disabled = false; btn.textContent = 'CRIAR MINHA CONTA';
        });

        return m;
    }

    _createPaywallModal() {
        const m = document.createElement('div');
        m.id = 'paywallModal'; m.className = 'paywall-modal';
        m.innerHTML = `
        <div class="pw-backdrop"></div>
        <div class="pw-wrap">
            <button class="pw-close-x" onclick="auth.closeModal('paywallModal')"><i class="fas fa-xmark"></i></button>
            <div class="pw-hero">
                <div class="pw-glow"></div>
                <i class="fas fa-play pw-hero-icon"></i>
                <h2 class="pw-hero-title">Seu proximo filme esta pronto.</h2>
                <p class="pw-hero-sub">Ative seu acesso CINE BOSS para comecar a assistir agora mesmo.</p>
            </div>
            <div class="pw-plans-row">
                <div class="pw-plan" data-plan="monthly">
                    <div class="pw-plan-header">
                        <div class="pw-plan-name">CINE BOSS</div>
                        <div class="pw-plan-period">30 dias</div>
                    </div>
                    <div class="pw-plan-price">R$ 4,99</div>
                    <ul class="pw-plan-list">
                        <li><i class="fas fa-check"></i> Todos os filmes e series</li>
                        <li><i class="fas fa-check"></i> Qualidade ate 1080p</li>
                        <li><i class="fas fa-check"></i> Sem anuncios</li>
                        <li><i class="fas fa-check"></i> TV ao vivo</li>
                    </ul>
                    <button class="pw-plan-btn" onclick="auth._selectPlan('monthly')">Assinar</button>
                </div>
                <div class="pw-plan best" data-plan="quarterly">
                    <div class="pw-plan-badge">MAIS POPULAR</div>
                    <div class="pw-plan-header">
                        <div class="pw-plan-name">CINE BOSS</div>
                        <div class="pw-plan-period">90 dias</div>
                    </div>
                    <div class="pw-plan-price">R$ 14,99</div>
                    <div class="pw-plan-save">Economize 25%</div>
                    <ul class="pw-plan-list">
                        <li><i class="fas fa-check"></i> Tudo do plano mensal</li>
                        <li><i class="fas fa-check"></i> 3 meses de acesso</li>
                        <li><i class="fas fa-check"></i> Suporte prioritario</li>
                        <li><i class="fas fa-check"></i> R$ 4,98 de economia</li>
                    </ul>
                    <button class="pw-plan-btn gold" onclick="auth._selectPlan('quarterly')">Assinar agora</button>
                </div>
            </div>
            <div class="pw-trust">
                <i class="fas fa-shield-halved"></i>
                <span>Pagamento unico via Stripe. Sem renovacao automatica.</span>
            </div>
        </div>`;

        const style = document.createElement('style');
        style.textContent = `
        .paywall-modal{display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:16px}
        .pw-backdrop{position:absolute;inset:0;background:rgba(0,0,0,0.94);backdrop-filter:blur(24px)}
        .pw-wrap{position:relative;z-index:1;width:100%;max-width:700px;background:#0c0c18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;transform:scale(0.95);opacity:0;transition:all .35s cubic-bezier(.4,0,.2,1)}
        .paywall-modal.active .pw-wrap{transform:scale(1);opacity:1}
        .pw-close-x{position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;color:#6a6a80;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;z-index:3;background:rgba(0,0,0,0.3);backdrop-filter:blur(8px)}
        .pw-close-x:hover{color:#fff;background:rgba(255,255,255,0.1)}
        .pw-hero{position:relative;padding:40px 32px 32px;text-align:center;background:linear-gradient(180deg,rgba(0,168,224,0.06) 0%,transparent 100%);overflow:hidden}
        .pw-glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:200px;height:200px;background:radial-gradient(circle,rgba(0,168,224,0.15),transparent 70%);pointer-events:none}
        .pw-hero-icon{font-size:32px;color:#00a8e0;margin-bottom:16px;position:relative;z-index:1}
        .pw-hero-title{font-family:'Sora',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;position:relative;z-index:1}
        .pw-hero-sub{font-size:14px;color:#8a8aa0;position:relative;z-index:1}
        .pw-plans-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:0 24px 24px}
        .pw-plan{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:24px 20px;position:relative;transition:all .25s}
        .pw-plan:hover{border-color:rgba(255,255,255,0.1)}
        .pw-plan.best{border-color:rgba(0,168,224,0.3);background:rgba(0,168,224,0.04)}
        .pw-plan-badge{position:absolute;top:-10px;right:16px;background:#00a8e0;color:#fff;font-size:10px;font-weight:700;padding:3px 10px;border-radius:10px;letter-spacing:0.5px}
        .pw-plan-header{margin-bottom:12px}
        .pw-plan-name{font-family:'Sora',sans-serif;font-size:13px;font-weight:700;color:#e8e8f0;letter-spacing:1px}
        .pw-plan-period{font-size:11px;color:#4a4a60;margin-top:2px}
        .pw-plan-price{font-family:'Sora',sans-serif;font-size:32px;font-weight:800;color:#fff;margin-bottom:4px}
        .pw-plan-save{font-size:12px;color:#c9a54e;font-weight:600;margin-bottom:12px}
        .pw-plan-list{list-style:none;margin:16px 0}
        .pw-plan-list li{display:flex;align-items:center;gap:8px;font-size:12px;color:#8a8aa0;padding:5px 0}
        .pw-plan-list li i{color:#00a8e0;font-size:10px;width:14px}
        .pw-plan-btn{width:100%;padding:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e8e8f0;font-size:13px;font-weight:600;cursor:pointer;transition:all .25s;font-family:'Inter',sans-serif}
        .pw-plan-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15)}
        .pw-plan-btn.gold{background:linear-gradient(135deg,#c9a54e,#e0be6a);border:none;color:#0a0a12;font-weight:700}
        .pw-plan-btn.gold:hover{box-shadow:0 4px 20px rgba(201,165,78,0.3);transform:translateY(-1px)}
        .pw-trust{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 24px;border-top:1px solid rgba(255,255,255,0.04);font-size:11px;color:#4a4a60}
        .pw-trust i{color:#00a8e0}
        @media(max-width:600px){.pw-plans-row{grid-template-columns:1fr}.pw-hero{padding:32px 20px 24px}.pw-wrap{max-width:400px}}
        `;
        m.appendChild(style);

        m.querySelector('.pw-backdrop').addEventListener('click', () => this.closeModal('paywallModal'));
        return m;
    }

    async _selectPlan(plan) {
        sounds.click();
        try {
            const r = await fetch(`${API_BASE}/subscription/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ plan }) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            if (d.url) window.location.href = d.url;
        } catch (e) { alert(e.message || 'Erro ao processar pagamento'); }
    }

    async forgotPassword() {
        const email = prompt('Digite seu email para recuperar a senha:');
        if (!email) return;
        try {
            await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
            alert('Se o email existir, voce recebera as instrucoes.');
        } catch { alert('Erro ao enviar email.'); }
    }
}

const auth = new AuthManager();
auth.check();
