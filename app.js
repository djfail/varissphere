// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isSignUpView = false;

// ====== UI HELPERS ======
window.toggleAuthModal = () => {
    document.getElementById('auth-modal')?.classList.toggle('hidden');
};

window.handleLogout = async () => {
    await supabaseClient.auth.signOut();
    location.reload();
};

window.toggleAuthView = () => {
    isSignUpView = !isSignUpView;
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('onboarding-fields');
    const submitBtn = document.getElementById('auth-submit-btn');
    
    if (title) title.innerText = isSignUpView ? "// REGISTRATION_MATRIX" : "// IDENTITY_VERIFICATION";
    if (fields) fields.classList.toggle('hidden', !isSignUpView);
    if (submitBtn) submitBtn.innerText = isSignUpView ? "CREATE_MATRIX_IDENTITY" : "INITIALIZE_SESSION";
};

// ====== AUTHENTICATION LOGIC ======
window.handleAuthSubmit = async function() {
    const email = document.getElementById('auth-email')?.value;
    const password = document.getElementById('auth-password')?.value;
    const status = document.getElementById('auth-status');

    if (!email || !password) return;

    if (isSignUpView) {
        const username = document.getElementById('auth-username')?.value;
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) status.innerText = error.message;
        else {
            await supabaseClient.from('profiles').insert([{ id: data.user.id, username }]);
            status.innerText = "SUCCESS: Profile created.";
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) status.innerText = error.message;
        else window.toggleAuthModal();
    }
};

// ====== BROADCASTING ======
window.submitPlayerPost = async function() {
    const content = document.getElementById('broadcast-content')?.value;
    if (!content) return;
    const { error } = await supabaseClient.from('posts').insert([{ content }]);
    if (!error) document.getElementById('broadcast-content').value = '';
};

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
    console.log("System Initialized.");
    
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const loggedIn = !!session;
        document.getElementById('login-btn')?.classList.toggle('hidden', loggedIn);
        document.getElementById('user-profile-summary')?.classList.toggle('hidden', !loggedIn);
        document.getElementById('player-broadcaster')?.classList.toggle('hidden', !loggedIn);
    });
});
