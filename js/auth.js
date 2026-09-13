// Supabase Authentication & Session Management
let globalSupabaseClient = null;
let currentAuthUser = null;

async function initAuth() {
    const sUrl = (activeWorkingConfig.supabaseUrl || 'https://mnwvelmekcddrpdlokhx.supabase.co').trim();
    const sKey = (activeWorkingConfig.supabaseKey || 'sb_publishable_cNLRLQ2Pu41v80JQDg3QTA_pcmQ6pvM').trim();
    
    if (sUrl && sKey && typeof supabase !== 'undefined') {
        globalSupabaseClient = supabase.createClient(sUrl, sKey);
        
        // Check current session
        const { data: { session } } = await globalSupabaseClient.auth.getSession();
        
        if (session && session.user) {
            currentAuthUser = session.user;
            showLanding();
        } else {
            showLogin();
        }

        // Listen for auth changes
        globalSupabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                currentAuthUser = session.user;
                showLanding();
            } else if (event === 'SIGNED_OUT') {
                currentAuthUser = null;
                showLogin();
            }
        });
    } else {
        // Fallback if Supabase is disabled/missing, just show landing
        showLanding();
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

function showLanding() {
    ['state-login', 'state-instructions', 'state-camera', 'state-builder', 'state-results', 'state-admin'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hide');
    });
    const el = document.getElementById('state-landing');
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
});
