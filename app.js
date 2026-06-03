// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ====== GLOBAL UI FUNCTIONS ======
window.toggleAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.toggle('hidden');
};

window.handleLogout = async function() {
    await supabaseClient.auth.signOut();
    location.reload();
};

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
    console.log("System Initialized.");
    
    // Check if the script is actually running
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        console.log("Connect button found and linked.");
    } else {
        console.error("Connect button NOT found. Check your HTML IDs.");
    }

    // Set up Auth listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        const userProfile = document.getElementById('user-profile-summary');
        const loginBtn = document.getElementById('login-btn');
        
        if (session) {
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userProfile) userProfile.classList.remove('hidden');
        } else {
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (userProfile) userProfile.classList.add('hidden');
        }
    });
});
