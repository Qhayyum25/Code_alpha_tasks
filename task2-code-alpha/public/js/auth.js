// ── Helpers ──────────────────────────────────────────────────────
const API = '';
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

async function api(method, path, body) {
    const res = await fetch(API + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Tab Switch ────────────────────────────────────────────────────
function switchTab(tab) {
    document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

// ── Login ─────────────────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.textContent = 'Signing in…';
    document.getElementById('login-error').textContent = '';
    try {
        const data = await api('POST', '/api/auth/login', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/feed.html';
    } catch (err) {
        document.getElementById('login-error').textContent = err.message;
        btn.disabled = false; btn.textContent = 'Sign In';
    }
}

// ── Register ──────────────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('reg-btn');
    btn.disabled = true; btn.textContent = 'Creating account…';
    document.getElementById('reg-error').textContent = '';
    try {
        const data = await api('POST', '/api/auth/register', {
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/feed.html';
    } catch (err) {
        document.getElementById('reg-error').textContent = err.message;
        btn.disabled = false; btn.textContent = 'Create Account';
    }
}

// Redirect if already logged in
if (getToken()) window.location.href = '/feed.html';
