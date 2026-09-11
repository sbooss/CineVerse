const API_BASE = window.location.origin + '/api';

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
    }
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    playTone(freq, dur, type, vol) {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + dur);
    }
    success() {
        this.init();
        this.playTone(523.25, 0.15, 'sine', 0.12);
        setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.12), 100);
        setTimeout(() => this.playTone(783.99, 0.25, 'sine', 0.15), 200);
    }
    error() {
        this.init();
        this.playTone(200, 0.2, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(150, 0.3, 'sawtooth', 0.08), 150);
    }
    click() {
        this.init();
        this.playTone(800, 0.05, 'sine', 0.08);
    }
    hover() {
        this.init();
        this.playTone(600, 0.03, 'sine', 0.05);
    }
    toggle() {
        this.muted = !this.muted;
    }
}

const sounds = new SoundManager();

class AuthManager {
    constructor() {
        this.user = null;
        this.subscription = null;
        this.loggedIn = false;
        this.listeners = [];
        this.checking = false;
    }

    onAuthChange(cb) { this.listeners.push(cb); }
    notify() { this.listeners.forEach(cb => cb(this.user, this.subscription, this.loggedIn)); }

    async check() {
        if (this.checking) return;
        this.checking = true;
        try {
            const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
            const data = await r.json();
            this.loggedIn = data.loggedIn || false;
            this.user = data.user || null;
            this.subscription = data.subscription || null;
        } catch {
            this.loggedIn = false;
            this.user = null;
            this.subscription = null;
        }
        this.checking = false;
        this.notify();
    }

    async login(email, password, remember) {
        const r = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password, remember })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        this.loggedIn = true;
        this.user = data.user;
        this.subscription = data.subscription;
        this.notify();
        return data;
    }

    async register(name, email, password) {
        const r = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        this.loggedIn = true;
        this.user = data.user;
        this.subscription = null;
        this.notify();
        return data;
    }

    async logout() {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        this.loggedIn = false;
        this.user = null;
        this.subscription = null;
        this.notify();
    }

    hasActiveSubscription() {
        return !!this.subscription && this.subscription.status === 'active';
    }

    requireAuth() {
        if (!this.loggedIn) {
            this.showAuthModal();
            return false;
        }
        return true;
    }

    requireSubscription() {
        if (!this.loggedIn) {
            this.showAuthModal();
            return false;
        }
        if (!this.hasActiveSubscription()) {
            this.showPaywall();
            return false;
        }
        return true;
    }

    showAuthModal() {
        let modal = document.getElementById('authModal');
        if (!modal) {
            modal = this.createAuthModal();
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }

    showPaywall() {
        let modal = document.getElementById('paywallModal');
        if (!modal) {
            modal = this.createPaywallModal();
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    createAuthModal() {
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-backdrop"></div>
            <div class="auth-container">
                <button class="auth-close" onclick="auth.closeModal('authModal')">&times;</button>
                <div class="auth-logo">CINE <span class="accent">BOSS</span></div>
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Entrar</button>
                    <button class="auth-tab" data-tab="register">Cadastrar</button>
                </div>
                <div class="auth-form-container">
                    <form class="auth-form active" id="loginForm">
                        <div class="auth-field">
                            <input type="email" id="loginEmail" placeholder="Email" required>
                        </div>
                        <div class="auth-field">
                            <input type="password" id="loginPassword" placeholder="Senha" required>
                        </div>
                        <div class="auth-check">
                            <input type="checkbox" id="rememberMe">
                            <label for="rememberMe">Lembrar sessao</label>
                        </div>
                        <div class="auth-error" id="loginError"></div>
                        <button type="submit" class="auth-btn">ENTRAR</button>
                        <div class="auth-forgot" onclick="auth.forgotPassword()">Esqueci minha senha</div>
                    </form>
                    <form class="auth-form" id="registerForm">
                        <div class="auth-field">
                            <input type="text" id="regName" placeholder="Nome" required>
                        </div>
                        <div class="auth-field">
                            <input type="email" id="regEmail" placeholder="Email" required>
                        </div>
                        <div class="auth-field">
                            <input type="password" id="regPassword" placeholder="Senha (min. 6 caracteres)" required>
                        </div>
                        <div class="auth-error" id="regError"></div>
                        <button type="submit" class="auth-btn">CADASTRAR</button>
                    </form>
                </div>
            </div>
        `;

        modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab + 'Form').classList.add('active');
            });
        });

        modal.querySelector('.auth-backdrop').addEventListener('click', () => this.closeModal('authModal'));

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('loginError');
            const btn = e.target.querySelector('.auth-btn');
            errEl.textContent = '';
            btn.disabled = true;
            btn.textContent = 'ENTRANDO...';
            try {
                await this.login(
                    document.getElementById('loginEmail').value,
                    document.getElementById('loginPassword').value,
                    document.getElementById('rememberMe').checked
                );
                sounds.success();
                this.closeModal('authModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (err) {
                errEl.textContent = err.message;
                sounds.error();
            }
            btn.disabled = false;
            btn.textContent = 'ENTRAR';
        });

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('regError');
            const btn = e.target.querySelector('.auth-btn');
            errEl.textContent = '';
            btn.disabled = true;
            btn.textContent = 'CADASTRANDO...';
            try {
                await this.register(
                    document.getElementById('regName').value,
                    document.getElementById('regEmail').value,
                    document.getElementById('regPassword').value
                );
                sounds.success();
                modal.querySelectorAll('.auth-tab')[0].click();
                document.getElementById('loginEmail').value = document.getElementById('regEmail').value;
                document.getElementById('loginPassword').value = document.getElementById('regPassword').value;
                document.getElementById('loginError').textContent = 'Conta criada! Faca login.';
                document.getElementById('loginError').style.color = 'var(--accent-blue)';
            } catch (err) {
                errEl.textContent = err.message;
                sounds.error();
            }
            btn.disabled = false;
            btn.textContent = 'CADASTRAR';
        });

        return modal;
    }

    createPaywallModal() {
        const modal = document.createElement('div');
        modal.id = 'paywallModal';
        modal.className = 'paywall-modal';
        modal.innerHTML = `
            <div class="pw-backdrop"></div>
            <div class="pw-container">
                <button class="pw-close" onclick="auth.closeModal('paywallModal')">&times;</button>
                <div class="pw-icon"><i class="fas fa-lock"></i></div>
                <h2 class="pw-title">Assinatura Necessaria</h2>
                <p class="pw-text">Seu proximo filme esta pronto. Ative seu acesso CINE BOSS para comecar a assistir.</p>
                <div class="pw-plans">
                    <div class="pw-plan" data-plan="monthly">
                        <div class="pw-plan-name">CINE BOSS</div>
                        <div class="pw-plan-price">R$ 4,99<span>/30 dias</span></div>
                        <ul class="pw-plan-features">
                            <li>Todos os filmes e series</li>
                            <li>Qualidade ate 1080p</li>
                            <li>Sem anuncios</li>
                        </ul>
                    </div>
                    <div class="pw-plan featured" data-plan="quarterly">
                        <div class="pw-plan-badge">ECONOMIZE 25%</div>
                        <div class="pw-plan-name">CINE BOSS</div>
                        <div class="pw-plan-price">R$ 14,99<span>/90 dias</span></div>
                        <ul class="pw-plan-features">
                            <li>Tudo do mensal</li>
                            <li>Economia de R$ 4,98</li>
                            <li>Suporte prioritario</li>
                        </ul>
                    </div>
                </div>
                <button class="pw-pay-btn" id="pwPayBtn">ASSINAR AGORA</button>
                <div class="pw-secure"><i class="fas fa-shield-halved"></i> Pagamento 100% seguro via Stripe</div>
            </div>
        `;

        let selectedPlan = 'quarterly';

        modal.querySelectorAll('.pw-plan').forEach(plan => {
            plan.addEventListener('click', () => {
                modal.querySelectorAll('.pw-plan').forEach(p => p.classList.remove('selected'));
                plan.classList.add('selected');
                selectedPlan = plan.dataset.plan;
                sounds.click();
            });
        });

        modal.querySelector('.pw-backdrop').addEventListener('click', () => this.closeModal('paywallModal'));

        document.getElementById('pwPayBtn').addEventListener('click', async () => {
            const btn = document.getElementById('pwPayBtn');
            btn.disabled = true;
            btn.textContent = 'REDIRECIONANDO...';
            sounds.click();
            try {
                const res = await fetch(`${API_BASE}/subscription/checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ plan: selectedPlan })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                if (data.url) {
                    window.location.href = data.url;
                }
            } catch (err) {
                btn.textContent = 'ERRO: ' + err.message;
                sounds.error();
                setTimeout(() => { btn.textContent = 'ASSINAR AGORA'; btn.disabled = false; }, 2500);
            }
        });

        modal.querySelector('.pw-plan.featured').classList.add('selected');

        return modal;
    }

    async forgotPassword() {
        const email = prompt('Digite seu email para recuperar a senha:');
        if (!email) return;
        try {
            await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            alert('Se o email existir, voce recebera as instrucoes.');
        } catch {
            alert('Erro ao enviar email.');
        }
    }
}

const auth = new AuthManager();
auth.check();
