const API_BASE = window.location.origin + '/api';

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

    async requireAuth() {
        if (!this.loggedIn) {
            this.showAuthModal();
            return false;
        }
        return true;
    }

    async requireSubscription() {
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
                <div class="auth-logo">CINE BOSS</div>
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

        const style = document.createElement('style');
        style.textContent = `
            .auth-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:99999; align-items:center; justify-content:center; }
            .auth-backdrop { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(20px); }
            .auth-container { position:relative; width:90%; max-width:420px; background:linear-gradient(145deg, #0a0a1a, #12122a); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:40px 32px; z-index:1; transform:translateY(30px); opacity:0; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); }
            .auth-modal.active .auth-container { transform:translateY(0); opacity:1; }
            .auth-close { position:absolute; top:16px; right:16px; background:none; border:none; color:#666; font-size:28px; cursor:pointer; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.3s; }
            .auth-close:hover { color:#fff; background:rgba(255,255,255,0.1); }
            .auth-logo { font-family:'Orbitron',monospace; font-size:22px; font-weight:800; text-align:center; letter-spacing:3px; background:linear-gradient(135deg,#00d4ff,#d4a853); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:28px; }
            .auth-tabs { display:flex; gap:4px; margin-bottom:28px; background:rgba(255,255,255,0.03); border-radius:12px; padding:4px; }
            .auth-tab { flex:1; padding:10px; background:none; border:none; color:#666; font-size:14px; font-weight:600; cursor:pointer; border-radius:10px; transition:all 0.3s; }
            .auth-tab.active { background:rgba(0,212,255,0.15); color:#00d4ff; }
            .auth-form { display:none; flex-direction:column; gap:16px; }
            .auth-form.active { display:flex; }
            .auth-field input { width:100%; padding:14px 16px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:#fff; font-size:14px; outline:none; transition:all 0.3s; }
            .auth-field input:focus { border-color:#00d4ff; box-shadow:0 0 20px rgba(0,212,255,0.1); }
            .auth-field input::placeholder { color:#555; }
            .auth-check { display:flex; align-items:center; gap:8px; font-size:13px; color:#888; }
            .auth-check input { accent-color:#00d4ff; }
            .auth-error { color:#ff4444; font-size:13px; min-height:18px; text-align:center; }
            .auth-btn { width:100%; padding:14px; background:linear-gradient(135deg,#00d4ff,#7b2fff); border:none; border-radius:10px; color:#fff; font-size:14px; font-weight:700; font-family:'Orbitron',monospace; letter-spacing:1px; cursor:pointer; transition:all 0.3s; }
            .auth-btn:hover { transform:translateY(-2px); box-shadow:0 8px 25px rgba(0,212,255,0.3); }
            .auth-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
            .auth-forgot { text-align:center; font-size:13px; color:#555; cursor:pointer; }
            .auth-forgot:hover { color:#00d4ff; }
        `;
        modal.appendChild(style);

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
                this.closeModal('authModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (err) {
                errEl.textContent = err.message;
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
                modal.querySelectorAll('.auth-tab')[0].click();
                document.getElementById('loginEmail').value = document.getElementById('regEmail').value;
                document.getElementById('loginPassword').value = document.getElementById('regPassword').value;
                document.getElementById('loginError').textContent = 'Conta criada! Faca login.';
                document.getElementById('loginError').style.color = '#00d4ff';
            } catch (err) {
                errEl.textContent = err.message;
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
                <p class="pw-text">Para assistir este conteudo, voce precisa de uma assinatura CINE BOSS ativa.</p>
                <div class="pw-plans">
                    <div class="pw-plan" data-plan="monthly">
                        <div class="pw-plan-name">MENSAL</div>
                        <div class="pw-plan-price">R$ 4,99<span>/mes</span></div>
                        <ul class="pw-plan-features">
                            <li>Todos os filmes e series</li>
                            <li>Qualidade ate 1080p</li>
                            <li>Sem anuncios</li>
                        </ul>
                    </div>
                    <div class="pw-plan featured" data-plan="quarterly">
                        <div class="pw-plan-badge">ECONOMIZE 25%</div>
                        <div class="pw-plan-name">TRIMESTRAL</div>
                        <div class="pw-plan-price">R$ 14,99<span>/3 meses</span></div>
                        <ul class="pw-plan-features">
                            <li>Tudo do mensal</li>
                            <li>Economia de R$ 4,98</li>
                            <li>Suporte prioritario</li>
                        </ul>
                    </div>
                </div>
                <button class="pw-pay-btn" id="pwPayBtn">ASSINAR AGORA</button>
                <div class="pw-secure"><i class="fas fa-shield-halved"></i> Pagamento 100% seguro</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .paywall-modal { display:none; position:fixed; top:0; left:0; width:100%; height:100%; z-index:99999; align-items:center; justify-content:center; }
            .pw-backdrop { position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); backdrop-filter:blur(30px); }
            .pw-container { position:relative; width:90%; max-width:500px; background:linear-gradient(145deg,#0a0a1a,#12122a); border:1px solid rgba(255,255,255,0.08); border-radius:24px; padding:40px 32px; z-index:1; text-align:center; transform:scale(0.9); opacity:0; transition:all 0.4s cubic-bezier(0.4,0,0.2,1); }
            .paywall-modal.active .pw-container { transform:scale(1); opacity:1; }
            .pw-close { position:absolute; top:16px; right:16px; background:none; border:none; color:#666; font-size:28px; cursor:pointer; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:all 0.3s; }
            .pw-close:hover { color:#fff; background:rgba(255,255,255,0.1); }
            .pw-icon { width:64px; height:64px; margin:0 auto 20px; background:linear-gradient(135deg,#00d4ff,#7b2fff); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:28px; color:#fff; }
            .pw-title { font-family:'Orbitron',monospace; font-size:22px; font-weight:700; margin-bottom:8px; }
            .pw-text { color:#888; font-size:14px; margin-bottom:28px; line-height:1.5; }
            .pw-plans { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; }
            .pw-plan { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:20px 16px; cursor:pointer; transition:all 0.3s; text-align:left; position:relative; }
            .pw-plan:hover { border-color:rgba(0,212,255,0.3); }
            .pw-plan.selected { border-color:#00d4ff; background:rgba(0,212,255,0.08); }
            .pw-plan.featured { border-color:rgba(212,168,83,0.3); }
            .pw-plan-badge { position:absolute; top:-10px; right:12px; background:linear-gradient(135deg,#d4a853,#f0d48a); color:#000; font-size:10px; font-weight:700; padding:3px 8px; border-radius:10px; }
            .pw-plan-name { font-family:'Orbitron',monospace; font-size:12px; color:#888; margin-bottom:8px; }
            .pw-plan-price { font-size:24px; font-weight:800; color:#00d4ff; margin-bottom:12px; }
            .pw-plan-price span { font-size:12px; color:#666; font-weight:400; }
            .pw-plan-features { list-style:none; }
            .pw-plan-features li { font-size:12px; color:#888; padding:4px 0; padding-left:16px; position:relative; }
            .pw-plan-features li::before { content:'✓'; position:absolute; left:0; color:#00d4ff; font-size:10px; }
            .pw-pay-btn { width:100%; padding:16px; background:linear-gradient(135deg,#00d4ff,#7b2fff); border:none; border-radius:12px; color:#fff; font-size:15px; font-weight:700; font-family:'Orbitron',monospace; letter-spacing:1px; cursor:pointer; transition:all 0.3s; }
            .pw-pay-btn:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(0,212,255,0.3); }
            .pw-secure { margin-top:16px; font-size:12px; color:#555; }
            .pw-secure i { color:#00d4ff; margin-right:4px; }
            @media(max-width:500px) { .pw-plans { grid-template-columns:1fr; } }
        `;
        modal.appendChild(style);

        let selectedPlan = 'quarterly';

        modal.querySelectorAll('.pw-plan').forEach(plan => {
            plan.addEventListener('click', () => {
                modal.querySelectorAll('.pw-plan').forEach(p => p.classList.remove('selected'));
                plan.classList.add('selected');
                selectedPlan = plan.dataset.plan;
            });
        });

        modal.querySelector('.pw-backdrop').addEventListener('click', () => this.closeModal('paywallModal'));

        document.getElementById('pwPayBtn').addEventListener('click', async () => {
            const btn = document.getElementById('pwPayBtn');
            btn.disabled = true;
            btn.textContent = 'PROCESSANDO...';
            try {
                const createRes = await fetch(`${API_BASE}/subscription/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ plan: selectedPlan })
                });
                const createData = await createRes.json();
                if (!createRes.ok) throw new Error(createData.error);

                const simRes = await fetch(`${API_BASE}/subscription/simulate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ subscription_id: createData.subscription_id })
                });
                const simData = await simRes.json();
                if (!simRes.ok) throw new Error(simData.error);

                await this.check();
                this.closeModal('paywallModal');
                if (window.playAfterAuth) { window.playAfterAuth(); window.playAfterAuth = null; }
            } catch (err) {
                btn.textContent = 'ERRO: ' + err.message;
                setTimeout(() => { btn.textContent = 'ASSINAR AGORA'; btn.disabled = false; }, 2000);
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
