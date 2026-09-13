// Supabase Authentication & Session Management
let globalSupabaseClient = null;
let currentAuthUser = null;

async function initAuth() {
    const sUrl = 'https://mnwvelmekcddrpdlokhx.supabase.co';
    const sKey = 'sb_publishable_cNLRLQ2Pu41v80JQDg3QTA_pcmQ6pvM';
    
    if (sUrl && sKey && typeof supabase !== 'undefined') {
        globalSupabaseClient = supabase.createClient(sUrl, sKey);
        
        // Check current session
        const { data: { session } } = await globalSupabaseClient.auth.getSession();
        
        if (session && session.user) {
            currentAuthUser = session.user;
            if (window.ThemeManager && window.ThemeManager.loadFromCloud) {
                await window.ThemeManager.loadFromCloud();
            }
            showAdmin();
        } else {
            showLogin();
        }

        // Listen for auth changes
        globalSupabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                currentAuthUser = session.user;
                if (window.ThemeManager && window.ThemeManager.loadFromCloud) {
                    await window.ThemeManager.loadFromCloud();
                }
                showAdmin();
            } else if (event === 'SIGNED_OUT') {
                currentAuthUser = null;
                showLogin();
            }
        });
    } else {
        // Fallback if Supabase is disabled/missing, just show admin
        showAdmin();
    }
}

function showLogin() {
    ['state-landing', 'state-instructions', 'state-camera', 'state-builder', 'state-results', 'state-admin'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hide');
    });
    const el = document.getElementById('state-login');
    if (el) el.classList.remove('hide');
}

function showAdmin() {
    ['state-login', 'state-instructions', 'state-camera', 'state-builder', 'state-results', 'state-landing'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hide');
    });
    const el = document.getElementById('state-admin');
    if (el) el.classList.remove('hide');
}

// Attach login logic
document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly for config to be loaded by config.js/theme.js
    setTimeout(() => {
        initAuth();
    }, 100);

    const btnLogin = document.getElementById('btnLoginSubmit');
    if (btnLogin) {
        btnLogin.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const errorEl = document.getElementById('loginError');
            
            if (!email || !password) {
                errorEl.textContent = 'Email dan Password wajib diisi';
                errorEl.classList.remove('hidden');
                return;
            }

            const origHtml = btnLogin.innerHTML;
            btnLogin.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Loading...';
            btnLogin.disabled = true;
            errorEl.classList.add('hidden');

            try {
                const { data, error } = await globalSupabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                // successful login will be handled by onAuthStateChange
            } catch (err) {
                errorEl.textContent = err.message || 'Login gagal';
                errorEl.classList.remove('hidden');
            } finally {
                btnLogin.innerHTML = origHtml;
                btnLogin.disabled = false;
            }
        });
    }

    const btnLogout = document.getElementById('btnAdminLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (globalSupabaseClient) {
                await globalSupabaseClient.auth.signOut();
            }
        });
    }

    // Toggle Login/Register
    const btnToggleRegister = document.getElementById('btnToggleRegister');
    const btnToggleLogin = document.getElementById('btnToggleLogin');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');

    if (btnToggleRegister && btnToggleLogin) {
        btnToggleRegister.addEventListener('click', () => {
            loginFormContainer.classList.add('hide');
            registerFormContainer.classList.remove('hide');
            registerFormContainer.classList.remove('absolute');
            loginFormContainer.classList.add('absolute');
        });

        btnToggleLogin.addEventListener('click', () => {
            registerFormContainer.classList.add('hide');
            loginFormContainer.classList.remove('hide');
            loginFormContainer.classList.remove('absolute');
            registerFormContainer.classList.add('absolute');
        });
    }

    // Register Submit
    const btnRegisterSubmit = document.getElementById('btnRegisterSubmit');
    if (btnRegisterSubmit) {
        btnRegisterSubmit.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const errorEl = document.getElementById('regError');
            
            if (!email || !password || password.length < 6) {
                errorEl.textContent = 'Email wajib diisi dan Password minimal 6 karakter';
                errorEl.classList.remove('hidden');
                return;
            }

            const origHtml = btnRegisterSubmit.innerHTML;
            btnRegisterSubmit.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Loading...';
            btnRegisterSubmit.disabled = true;
            errorEl.classList.add('hidden');

            try {
                const { data, error } = await globalSupabaseClient.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                // successful register will automatically sign in (if no email confirmation required)
                // and onAuthStateChange will trigger
                
                // If it didn't automatically sign in (e.g. email confirmation required but not checked by us)
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                    errorEl.textContent = 'Email sudah terdaftar.';
                    errorEl.classList.remove('hidden');
                } else if (!data.session) {
                    errorEl.textContent = 'Berhasil daftar! Namun pastikan fitur "Confirm Email" sudah dimatikan di Supabase.';
                    errorEl.classList.remove('hidden');
                    errorEl.classList.replace('text-red-600', 'text-amber-600');
                    errorEl.classList.replace('bg-red-50', 'bg-amber-50');
                    errorEl.classList.replace('border-red-100', 'border-amber-100');
                }
            } catch (err) {
                errorEl.textContent = err.message || 'Pendaftaran gagal';
                errorEl.classList.remove('hidden');
            } finally {
                btnRegisterSubmit.innerHTML = origHtml;
                btnRegisterSubmit.disabled = false;
            }
        });
    }
});
