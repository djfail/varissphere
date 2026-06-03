// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserSession = null;
let currentProfile = null;
let isSignUpView = false;

// ====== GLOBAL UI FUNCTIONS (Accessible by index.html buttons) ======

window.toggleAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.toggle('hidden');
    const status = document.getElementById('auth-status');
    if (status) status.innerText = '';
};

window.handleLogout = async function() {
    await supabaseClient.auth.signOut();
    location.reload();
};

window.toggleAuthView = function() {
    const SECRET_INVITE_CODE = "MAGESTICA2026"; 
    const urlParams = new URLSearchParams(window.location.search);
    const playerInviteInput = urlParams.get('invite');

    if (!isSignUpView) {
        if (playerInviteInput !== SECRET_INVITE_CODE) {
            const status = document.getElementById('auth-status');
            if (status) {
                status.className = "text-red-400 text-xs mt-2 font-mono";
                status.innerText = "ACCESS_DENIED: Secure invitation token invalid or missing.";
            }
            return;
        }
    }

    isSignUpView = !isSignUpView;
    const title = document.getElementById('modal-title');
    const toggleLink = document.getElementById('auth-toggle-view');
    const submitBtn = document.getElementById('auth-submit-btn');
    const onboarding = document.getElementById('onboarding-fields');

    if (isSignUpView) {
        if (title) title.innerText = "// REGISTRATION_MATRIX";
        if (toggleLink) toggleLink.innerText = "Return to secure node login";
        if (submitBtn) submitBtn.innerText = "CREATE_MATRIX_IDENTITY";
        if (onboarding) onboarding.classList.remove('hidden');
    } else {
        if (title) title.innerText = "// IDENTITY_VERIFICATION";
        if (toggleLink) toggleLink.innerText = "Need to create a new matrix profile? Sign up";
        if (submitBtn) submitBtn.innerText = "INITIALIZE_SESSION";
        if (onboarding) onboarding.classList.add('hidden');
    }
};

window.handleAuthSubmit = async function() {
    const status = document.getElementById('auth-status');
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value;

    if (!email || !password) {
        if (status) status.innerText = "ERROR: Credentials missing.";
        return;
    }

    if (isSignUpView) {
        const username = document.getElementById('auth-username')?.value.trim();
        const first_name = document.getElementById('auth-firstname')?.value.trim();
        const house = document.getElementById('auth-house')?.value.trim();

        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) { if (status) status.innerText = "FAIL: " + error.message; return; }
        
        if (data.user) {
            await supabaseClient.from('profiles').insert([{ id: data.user.id, username, first_name, house }]);
            if (status) status.innerText = "SUCCESS: Profile initialized!";
            setTimeout(() => window.toggleAuthModal(), 1500);
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { if (status) status.innerText = "FAIL: " + error.message; }
        else { if (status) status.innerText = "SUCCESS: Identity Verified."; setTimeout(() => window.toggleAuthModal(), 1000); }
    }
};

window.submitPlayerPost = async function() {
    const content = document.getElementById('broadcast-content')?.value.trim();
    const photo_url = document.getElementById('broadcast-photo')?.value.trim();
    const status = document.getElementById('broadcast-status');

    if (!content || !currentUserSession) return;

    const { error } = await supabaseClient.from('posts').insert([{
        author_id: currentUserSession.user.id,
        content,
        photo_url: photo_url || null,
        is_published: true
    }]);

    if (!error) {
        if (status) status.innerText = "TRANSMISSION SENT.";
        document.getElementById('broadcast-content').value = '';
    }
};

// ====== INITIALIZATION ======

document.addEventListener("DOMContentLoaded", () => {
    fetchPulseFeed();
    listenToFeedUpdates();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        currentUserSession = session;
        const loginBtn = document.getElementById('login-btn');
        const userProfile = document.getElementById('user-profile-summary');
        const broadcaster = document.getElementById('player-broadcaster');

        if (session) {
            const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
            if (profile) document.getElementById('header-username').innerText = `${profile.first_name} [${profile.house}]`;
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

async function fetchPulseFeed() {
    const container = document.getElementById('feed-container');
    const { data: posts } = await supabaseClient.from('posts').select(`*, profiles(username, first_name, house)`).eq('is_published', true).order('created_at', { ascending: false });
    if (container && posts) {
        document.getElementById('loading')?.remove();
        container.innerHTML = posts.map(p => `
            <div class="p-4 border border-gray-800 rounded bg-gray-900/50">
                <p class="text-xs text-purple-400 font-mono">@${p.profiles.username} [${p.profiles.house}]</p>
                <p class="text-sm mt-2">${p.content}</p>
            </div>
        `).join('');
    }
}

function listenToFeedUpdates() {
    supabaseClient.channel('public:posts').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, fetchPulseFeed).subscribe();
}
