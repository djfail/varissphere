// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isSignUpView = false;

// ====== GLOBAL UI FUNCTIONS ======
window.toggleAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.toggle('hidden');
};

window.handleLogout = async function() {
    await supabaseClient.auth.signOut();
    location.reload();
};

window.toggleAuthView = function() {
    isSignUpView = !isSignUpView;
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('onboarding-fields');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleLink = document.getElementById('auth-toggle-view');
    
    if (title) title.innerText = isSignUpView ? "// REGISTRATION_MATRIX" : "// IDENTITY_VERIFICATION";
    if (fields) fields.classList.toggle('hidden', !isSignUpView);
    if (submitBtn) submitBtn.innerText = isSignUpView ? "CREATE_MATRIX_IDENTITY" : "INITIALIZE_SESSION";
    if (toggleLink) toggleLink.innerText = isSignUpView ? "Return to secure node login" : "Need to create a new matrix profile? Sign up";
};

// ====== AUTH LOGIC ======
window.handleAuthSubmit = async function() {
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const status = document.getElementById('auth-status');

    if (!email || !password) {
        if (status) status.innerText = "ERROR: Credentials missing.";
        return;
    }

    if (isSignUpView) {
        const username = document.getElementById('auth-username')?.value.trim();
        const first_name = document.getElementById('auth-firstname')?.value.trim();
        const house = document.getElementById('auth-house')?.value.trim();

        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            if (status) status.innerText = "FAIL: " + error.message;
        } else {
            // Create the profile
            await supabaseClient.from('profiles').insert([{ id: data.user.id, username, first_name, house }]);
            if (status) status.innerText = "SUCCESS: Identity initialized.";
            setTimeout(() => window.toggleAuthModal(), 1500);
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            if (status) status.innerText = "FAIL: " + error.message;
        } else {
            if (status) status.innerText = "SUCCESS: Session established.";
            setTimeout(() => window.toggleAuthModal(), 1000);
        }
    }
};

// ====== BROADCASTING ======
window.submitPlayerPost = async function() {
    const content = document.getElementById('broadcast-content')?.value.trim();
    const status = document.getElementById('broadcast-status');
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user || !content) return;

    const { error } = await supabaseClient.from('posts').insert([{
        author_id: user.id,
        content: content
    }]);

    if (error) {
        if (status) status.innerText = "ERROR: Transmission failed.";
    } else {
        if (status) status.innerText = "TRANSMISSION SENT.";
        document.getElementById('broadcast-content').value = '';
    }
};

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile-summary');
        const broadcaster = document.getElementById('player-broadcaster');
        
        if (session) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userProfile) userProfile.classList.remove('hidden');
            if (broadcaster) broadcaster.classList.remove('hidden');
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userProfile) userProfile.classList.add('hidden');
            if (broadcaster) broadcaster.classList.add('hidden');
        }
    });
});
