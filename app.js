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

    // Check if a player is already logged into this browser tab
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

// Fetch current logged-in character details
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
        console.error("Profile missing or failed:", err);
        updateUIForLoggedIn();
    }
}

// UI State Alterations
function toggleAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.toggle('hidden');
    document.getElementById('auth-status').innerText = '';
}

function toggleAuthView() {
    // === CHOOSE YOUR SECRET INVITE CODE HERE ===
    const SECRET_INVITE_CODE = "MAGESTICA2026"; 

    // Read the link to see if "?invite=YOURCODE" is attached
    const urlParams = new URLSearchParams(window.location.search);
    const playerInviteInput = urlParams.get('invite');

    if (!isSignUpView) {
        // Player is trying to switch from Login to Sign Up view
        if (playerInviteInput !== SECRET_INVITE_CODE) {
            const status = document.getElementById('auth-status');
            status.className = "text-red-400 text-xs mt-2 font-mono";
            status.innerText = "ACCESS_DENIED: Secure invitation token invalid or missing.";
            return;
        }
    }

    // If code matches, proceed with opening the matrix fields
    isSignUpView = !isSignUpView;
    const title = document.getElementById('modal-title');
    const toggleLink = document.getElementById('auth-toggle-view');
    const submitBtn = document.getElementById('auth-submit-btn');
    const onboarding = document.getElementById('onboarding-fields');

    if (isSignUpView) {
        title.innerText = "// REGISTRATION_MATRIX";
        toggleLink.innerText = "Return to secure node login";
        submitBtn.innerText = "CREATE_MATRIX_IDENTITY";
        onboarding.classList.remove('hidden');
    } else {
        title.innerText = "// IDENTITY_VERIFICATION";
        toggleLink.innerText = "Need to create a new matrix profile? Sign up";
        submitBtn.innerText = "INITIALIZE_SESSION";
        onboarding.classList.add('hidden');
    }
}

function updateUIForLoggedIn() {
    document.getElementById('login-btn').classList.add('hidden');
    document.getElementById('user-profile-summary').classList.remove('hidden');
    document.getElementById('player-broadcaster').classList.remove('hidden');
    
    if (currentProfile) {
        document.getElementById('header-username').innerText = `${currentProfile.first_name} [${currentProfile.house}]`;
    } else {
        document.getElementById('header-username').innerText = "Connected Profile";
    }
}

function updateUIForLoggedOut() {
    document.getElementById('login-btn').classList.remove('hidden');
    document.getElementById('user-profile-summary').classList.add('hidden');
    document.getElementById('player-broadcaster').classList.add('hidden');
}

// Handle Authentication Forms
async function handleAuthSubmit() {
    const status = document.getElementById('auth-status');
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    if (!email || !password) {
        status.className = "text-red-400 text-xs mt-2";
        status.innerText = "ERROR: Credentials parameter missing.";
        return;
    }

    status.className = "text-yellow-400 text-xs mt-2 animate-pulse";
    status.innerText = "TRANSMITTING DATA PACKETS...";

    if (isSignUpView) {
        // Handle User Sign Up
        const username = document.getElementById('auth-username').value.trim();
        const first_name = document.getElementById('auth-firstname').value.trim();
        const house = document.getElementById('auth-house').value.trim();

        if (!username || !first_name || !house) {
            status.className = "text-red-400 text-xs mt-2";
            status.innerText = "ERROR: Core character identity metrics missing.";
            return;
        }

        const { data, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        
        if (signUpError) {
            status.className = "text-red-400 text-xs mt-2";
            status.innerText = "FAIL: " + signUpError.message;
            return;
        }

        if (data.user) {
            // Write to our custom Profiles table using their exact login Auth account ID
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([{ 
                    id: data.user.id, 
                    username, 
                    first_name, 
                    house,
                    bio: 'Registered player portal node.'
                }]);

            if (profileError) {
                status.className = "text-red-400 text-xs mt-2";
                status.innerText = "AUTH SUCCESSFUL, PROFILE CRASH: " + profileError.message;
                return;
            }
        }
        
        status.className = "text-green-400 text-xs mt-2";
        status.innerText = "SUCCESS: Profile matrix initialized!";
        setTimeout(() => toggleAuthModal(), 1500);

    } else {
        // Handle User Log In
        const { error: loginError } = await supabaseClient.auth.signInWithPassword({ email, password });
        
        if (loginError) {
            status.className = "text-red-400 text-xs mt-2";
            status.innerText = "FAIL: Access Denied. " + loginError.message;
        } else {
            status.className = "text-green-400 text-xs mt-2";
            status.innerText = "SUCCESS: Identity Verified.";
            setTimeout(() => toggleAuthModal(), 1000);
        }
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
}

// Player Post Broadcaster
async function submitPlayerPost() {
    const status = document.getElementById('broadcast-status');
    const content = document.getElementById('broadcast-content').value.trim();
    const photo_url = document.getElementById('broadcast-photo').value.trim();

    if (!content) {
        status.className = "text-red-400";
        status.innerText = "TRANSMISSION BLOCKED: Content vector empty.";
        return;
    }

    if (!currentUserSession) return;

    try {
        const { error } = await supabaseClient
            .from('posts')
            .insert([{
                author_id: currentUserSession.user.id,
                content,
                photo_url: photo_url || null,
                scheduled_time: new Date().toISOString(),
                is_published: true
            }]);

        if (error) throw error;

        status.className = "text-emerald-400";
        status.innerText = "TRANSMISSION SENT SUCCESSFULLY.";
        document.getElementById('broadcast-content').value = '';
        document.getElementById('broadcast-photo').value = '';
    } catch (err) {
        status.className = "text-red-400";
        status.innerText = "TRANSMISSION ERROR: " + err.message;
    }
}

// Fetch all published posts from the database
async function fetchPulseFeed() {
    const container = document.getElementById('feed-container');
    const loading = document.getElementById('loading');

    try {
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select(`
                id,
                content,
                photo_url,
                scheduled_time,
                profiles (
                    username,
                    first_name,
                    house,
                    photo_url
                )
            `)
            .eq('is_published', true)
            .order('scheduled_time', { ascending: false });

        if (error) throw error;

        if (loading) loading.remove();
        
        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div id="loading" class="text-center text-gray-500 font-mono text-sm py-12">
                    [ NO ACTIVE TRANSMISSIONS FOUND ON THE FEED ]
                </div>`;
            return;
        }

        container.innerHTML = posts.map(post => renderPostCard(post)).join('');

    } catch (err) {
        console.error("Error loading feed:", err);
        if (loading) loading.innerHTML = `<span class="text-red-400 font-mono">[ STATIC INTERFERENCE: CONNECTION FAILED ]</span>`;
    }
}

function renderPostCard(post) {
    const author = post.profiles || { first_name: 'Unknown Identity', username: 'unknown', house: 'Faction Outcast', photo_url: '' };
    const defaultAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + author.username;
    const avatar = author.photo_url || defaultAvatar;
    const postTime = new Date(post.scheduled_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    let imageTag = '';
    if (post.photo_url) {
        imageTag = `<img src="${post.photo_url}" class="mt-4 rounded-lg w-full max-h-96 object-cover border border-gray-800" alt="Transmission Attachment">`;
    }

    return `
        <div class="feed-card p-5 rounded-xl transition duration-300 hover:border-purple-500/30">
            <div class="flex items-start space-x-4">
                <img src="${avatar}" class="w-11 h-11 rounded-full border border-purple-500/20 bg-gray-800 object-cover" alt="Profile Vector">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-bold text-gray-100 hover:text-purple-400 cursor-pointer">${author.first_name}</span>
                            <span class="text-xs text-purple-400 font-mono ml-2">[${author.house}]</span>
                        </div>
                        <span class="text-xs text-gray-500 font-mono">${postTime}</span>
                    </div>
                    <p class="text-xs text-gray-400 font-mono mt-0.5">@${author.username}</p>
                    <p class="mt-3 text-gray-300 leading-relaxed whitespace-pre-line text-sm">${post.content}</p>
                    ${imageTag}
                </div>
            </div>
        </div>
    `;
}

function listenToFeedUpdates() {
    supabaseClient
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            fetchPulseFeed();
        })
        .subscribe();
}
