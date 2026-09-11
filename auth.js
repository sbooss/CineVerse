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
    showLogin() { window.location.href = '/login.html'; }
    showRegister() { window.location.href = '/login.html'; }

    _showAuth(tab) {
        let m = document.getElementById('authModal');
        if (!m) { m = this._createAuthModal(); document.body.appendChild(m); }
        m.style.display = 'flex';
        setTimeout(() => m.classList.add('active'), 10);
        const target = tab === 'register' ? 0 : 1;
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
        m.id = 'authModal'; m.className = 'cb-modal';
        m.innerHTML = `
        <div class="cb-modal-bg"></div>
        <div class="cb-modal-card">
            <div class="cb-modal-inner">
                <div class="cb-modal-logo"><div class="cb-modal-logo-icon"><i class="fas fa-play"></i></div><span>CINE <b>BOSS</b></span></div>
                <div class="auth-tabs" style="display:flex;gap:2px;margin-bottom:20px;background:rgba(255,255,255,0.03);border-radius:8px;padding:3px">
                    <button class="auth-tab active" data-f="cbRegF" style="flex:1;padding:10px;background:none;border:none;color:#4a4a60;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;transition:all .2s;font-family:Inter,sans-serif">Criar conta</button>
                    <button class="auth-tab" data-f="cbLogF" style="flex:1;padding:10px;background:none;border:none;color:#4a4a60;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;transition:all .2s;font-family:Inter,sans-serif">Entrar</button>
                </div>
                <form class="cb-form active" id="cbRegF" style="display:flex;flex-direction:column;gap:12px">
                    <div class="cb-field"><label>Nome</label><input type="text" id="cbRName" placeholder="Seu nome" required></div>
                    <div class="cb-field"><label>Email</label><input type="email" id="cbREmail" placeholder="seu@email.com" required></div>
                    <div class="cb-field"><label>Senha</label><input type="password" id="cbRPass" placeholder="Minimo 6 caracteres" required></div>
                    <div class="cb-error" id="cbRErr"></div>
                    <button type="submit" class="cb-btn gold">CRIAR MINHA CONTA</button>
                    <p class="cb-switch">Ja tem conta? <span data-tab="1">Entrar</span></p>
                </form>
                <form class="cb-form" id="cbLogF" style="display:none;flex-direction:column;gap:12px">
                    <div class="cb-field"><label>Email</label><input type="email" id="cbLEmail" placeholder="seu@email.com" required></div>
                    <div class="cb-field"><label>Senha</label><input type="password" id="cbLPass" placeholder="Sua senha" required></div>
                    <div class="cb-error" id="cbLErr"></div>
                    <button type="submit" class="cb-btn blue">ENTRAR</button>
                    <p class="cb-switch">Nao tem conta? <span data-tab="0">Cadastre-se</span></p>
                </form>
            </div>
        </div>`;

        const style = document.createElement('style');
        style.textContent = `
        .cb-modal{display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;padding:16px}
        .cb-modal-bg{position:absolute;inset:0;background:rgba(0,0,0,0.92);backdrop-filter:blur(20px)}
        .cb-modal-card{position:relative;z-index:1;width:100%;max-width:420px;background:rgba(10,10,20,0.9);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;transform:translateY(20px) scale(0.97);opacity:0;transition:all .35s cubic-bezier(.4,0,.2,1)}
        .cb-modal.active .cb-modal-card{transform:translateY(0) scale(1);opacity:1}
        .cb-modal-card::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,rgba(0,168,224,0.4),transparent)}
        .cb-modal-inner{padding:32px 28px}
        .cb-modal-logo{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;font-family:Sora,sans-serif;font-size:16px;font-weight:800;letter-spacing:2px}
        .cb-modal-logo b{color:#00a8e0}
        .cb-modal-logo-icon{width:30px;height:30px;background:#00a8e0;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff}
        .cb-field{display:flex;flex-direction:column;gap:4px}
        .cb-field label{font-size:11px;font-weight:600;color:#8a8aa0;letter-spacing:.3px}
        .cb-field input{width:100%;padding:11px 13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;color:#e8e8f0;font-size:13px;outline:none;transition:all .2s;font-family:Inter,sans-serif}
        .cb-field input:focus{border-color:rgba(0,168,224,0.4);background:rgba(255,255,255,0.06)}
        .cb-field input::placeholder{color:#2a2a40}
        .cb-error{color:#ff4466;font-size:11px;min-height:14px;text-align:center}
        .cb-btn{width:100%;padding:12px;border:none;border-radius:8px;font-size:13px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:all .25s;font-family:Inter,sans-serif}
        .cb-btn.blue{background:#00a8e0;color:#fff}
        .cb-btn.blue:hover{background:#0090c0;box-shadow:0 4px 20px rgba(0,168,224,0.3);transform:translateY(-1px)}
        .cb-btn.gold{background:linear-gradient(135deg,#c9a54e,#e0be6a);color:#0a0a12}
        .cb-btn.gold:hover{box-shadow:0 4px 20px rgba(201,165,78,0.3);transform:translateY(-1px)}
        .cb-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .cb-switch{text-align:center;font-size:11px;color:#4a4a60;margin-top:4px}
        .cb-switch span{color:#00a8e0;cursor:pointer;font-weight:600}
        .cb-switch span:hover{text-decoration:underline}
        @media(max-width:500px){.cb-modal-card{max-width:380px}.cb-modal-inner{padding:28px 22px}}
        `;
        m.appendChild(style);

        m.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                sounds.click();
                m.querySelectorAll('.auth-tab').forEach(t => { t.classList.remove('active'); t.style.background = 'none'; t.style.color = '#4a4a60'; });
                m.querySelectorAll('.cb-form').forEach(f => { f.classList.remove('active'); f.style.display = 'none'; });
                tab.classList.add('active'); tab.style.background = 'rgba(0,168,224,0.12)'; tab.style.color = '#00a8e0';
                const form = document.getElementById(tab.dataset.f);
                form.classList.add('active'); form.style.display = 'flex';
            });
        });

        m.querySelectorAll('.cb-switch span').forEach(s => {
            s.addEventListener('click', () => {
                const i = parseInt(s.dataset.tab);
                m.querySelectorAll('.auth-tab')[i].click();
            });
        });

        m.querySelector('.cb-modal-bg').addEventListener('click', () => this.closeModal('authModal'));

        document.getElementById('cbLogF').addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('cbLErr');
            const btn = e.target.querySelector('.cb-btn');
            err.textContent = ''; btn.disabled = true; btn.textContent = 'ENTRANDO...';
            try {
                await this.login(document.getElementById('cbLEmail').value, document.getElementById('cbLPass').value, false);
                sounds.success(); this.closeModal('authModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (e) { err.textContent = e.message; sounds.error(); }
            btn.disabled = false; btn.textContent = 'ENTRAR';
        });

        document.getElementById('cbRegF').addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('cbRErr');
            const btn = e.target.querySelector('.cb-btn');
            err.textContent = ''; btn.disabled = true; btn.textContent = 'CRIANDO...';
            try {
                await this.register(document.getElementById('cbRName').value, document.getElementById('cbREmail').value, document.getElementById('cbRPass').value);
                sounds.success(); this.closeModal('authModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (e) { err.textContent = e.message; sounds.error(); }
            btn.disabled = false; btn.textContent = 'CRIAR MINHA CONTA';
        });

        return m;
    }

    _createPaywallModal() {
        const m = document.createElement('div');
        m.id = 'paywallModal'; m.className = 'cb-modal';
        m.innerHTML = `
        <div class="cb-modal-bg"></div>
        <div class="cb-modal-card" style="max-width:600px">
            <div class="cb-modal-inner" style="padding:0">
                <div style="padding:32px 28px 20px;text-align:center;background:linear-gradient(180deg,rgba(0,168,224,0.06) 0%,transparent 100%);position:relative">
                    <div style="position:absolute;top:-40px;left:50%;transform:translateX(-50%);width:180px;height:180px;background:radial-gradient(circle,rgba(0,168,224,0.15),transparent 70%);pointer-events:none"></div>
                    <i class="fas fa-play" style="font-size:28px;color:#00a8e0;margin-bottom:14px;position:relative;z-index:1"></i>
                    <h2 style="font-family:Sora,sans-serif;font-size:20px;font-weight:800;color:#fff;margin-bottom:6px;position:relative;z-index:1">Seu proximo filme esta pronto.</h2>
                    <p style="font-size:13px;color:#8a8aa0;position:relative;z-index:1">Ative seu acesso CINE BOSS para comecar a assistir.</p>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 24px 24px">
                    <div style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:22px 18px;position:relative">
                        <div style="font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:#e8e8f0;letter-spacing:1px;margin-bottom:2px">CINE BOSS</div>
                        <div style="font-size:10px;color:#4a4a60;margin-bottom:10px">30 dias</div>
                        <div style="font-family:Sora,sans-serif;font-size:28px;font-weight:800;color:#fff;margin-bottom:12px">R$ 6,99</div>
                        <ul style="list-style:none;margin:0 0 16px">
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>Todos os filmes e series</li>
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>Qualidade ate 1080p</li>
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>Sem anuncios</li>
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>TV ao vivo</li>
                        </ul>
                        <button class="pw-select-btn" onclick="auth._selectPlan('monthly')" style="width:100%;padding:11px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:#e8e8f0;font-size:12px;font-weight:600;cursor:pointer;transition:all .25s;font-family:Inter,sans-serif">Assinar</button>
                    </div>
                    <div style="background:rgba(0,168,224,0.04);border:1px solid rgba(0,168,224,0.3);border-radius:12px;padding:22px 18px;position:relative">
                        <div style="position:absolute;top:-9px;right:14px;background:#00a8e0;color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:8px;letter-spacing:.5px">MAIS POPULAR</div>
                        <div style="font-family:Sora,sans-serif;font-size:11px;font-weight:700;color:#e8e8f0;letter-spacing:1px;margin-bottom:2px">CINE BOSS</div>
                        <div style="font-size:10px;color:#4a4a60;margin-bottom:10px">90 dias</div>
                        <div style="font-family:Sora,sans-serif;font-size:28px;font-weight:800;color:#fff;margin-bottom:2px">R$ 15,99</div>
                        <div style="font-size:11px;color:#c9a54e;font-weight:600;margin-bottom:12px">Economize 25%</div>
                        <ul style="list-style:none;margin:0 0 16px">
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>Tudo do plano mensal</li>
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>3 meses de acesso</li>
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>Suporte prioritario</li>
                            <li style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8a8aa0;padding:4px 0"><i class="fas fa-check" style="color:#00a8e0;font-size:9px;width:12px"></i>R$ 5,02 de economia</li>
                        </ul>
                        <button class="pw-select-btn gold" onclick="auth._selectPlan('quarterly')" style="width:100%;padding:11px;background:linear-gradient(135deg,#c9a54e,#e0be6a);border:none;border-radius:8px;color:#0a0a12;font-size:12px;font-weight:700;cursor:pointer;transition:all .25s;font-family:Inter,sans-serif">Assinar agora</button>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:14px 24px;border-top:1px solid rgba(255,255,255,0.04);font-size:10px;color:#4a4a60">
                    <i class="fas fa-shield-halved" style="color:#00a8e0"></i>
                    Pagamento unico via Stripe. Sem renovacao automatica.
                </div>
            </div>
        </div>`;
        m.querySelector('.cb-modal-bg').addEventListener('click', () => this.closeModal('paywallModal'));
        return m;
    }

    async _selectPlan(plan) {
        sounds.click();
        const btn = document.querySelector('.pw-select-btn, #planMonthBtn, #planQtrBtn');
        if(btn){btn.disabled=true;btn.textContent='PROCESSANDO...';}
        try {
            const r = await fetch(`${API_BASE}/subscription/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ plan }) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            if (d.url) {
                const subId = d.subscriptionId || d.subscription_id;
                if (subId) {
                    setTimeout(async function(){
                        try { await fetch(`${API_BASE}/subscription/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ subscription_id: subId }) }); } catch {}
                    }, 1000);
                }
                window.location.href = d.url;
            } else {
                sounds.ok();
                if(btn){btn.textContent='PAGO!';}
                setTimeout(function(){window.location.href='/'},1500);
            }
        } catch (e) {
            if(btn){btn.disabled=false;btn.textContent='ASSINAR';}
            alert(e.message || 'Erro ao processar pagamento');
        }
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
