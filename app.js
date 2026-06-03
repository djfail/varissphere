// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUserSession = null;
let currentProfile = null;
let isSignUpView = false;

document.addEventListener("DOMContentLoaded", () => {
    fetchPulseFeed();
    listenToFeedUpdates();

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        currentUserSession = session;
        if (session) {
            await fetchUserProfile(session.user.id);
        } else {
            currentProfile = null;
            updateUIForLoggedOut();
        }
    });
});

async function fetchUserProfile(userId) {
    try {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        currentProfile = profile;
        updateUIForLoggedIn();
    } catch (err) {
        console.error("Profile load failed:", err);
        updateUIForLoggedIn();
    }
}

function updateUIForLoggedIn() {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile-summary');
    const broadcaster = document.getElementById('player-broadcaster');
    const headerUsername = document.getElementById('header-username');

    if (loginBtn) loginBtn.classList.add('hidden');
    if (userProfile) userProfile.classList.remove('hidden');
    if (broadcaster) broadcaster.classList.remove('hidden');
    
    if (currentProfile && headerUsername) {
        headerUsername.innerText = `${currentProfile.first_name} [${currentProfile.house}]`;
    }
}

function updateUIForLoggedOut() {
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile-summary');
    const broadcaster = document.getElementById('player-broadcaster');

    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userProfile) userProfile.classList.add('hidden');
    if (broadcaster) broadcaster.classList.add('hidden');
}

// Ensure the rest of your functions (fetchPulseFeed, etc.) follow below...
