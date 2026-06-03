// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let isSignUpView = false;

// ====== HOUSE THEME DEFINITIONS ======
const houseThemes = {
    "Celestial House Balance": { background: "linear-gradient(to right, #000, #FFF)" },
    "House Niros": { color: "#A52A2A" },
    "House Iorke": { color: "#800080" },
    "House Thorngrave": { color: "#00CED1" },
    "Celestial House Vantal": { background: "linear-gradient(to right, #FF0000, #FFD700)" },
    "House Varis": { background: "linear-gradient(to right, #FF0000, #0000FF)" },
    "House Dreyser": { color: "#800080" },
    "Celestial House Auradrakon": { background: "linear-gradient(to right, #FFC0CB, #87CEEB)" },
    "House Kraxin": { background: "linear-gradient(to right, #C0C0C0, #FF0000, #FFD700)" },
    "House Pardon": { background: "linear-gradient(to right, #FFC0CB, #0000FF, #C0C0C0)" },
    "Celestial House Materferox": { background: "linear-gradient(to right, #008000, #A52A2A)" },
    "House Ashgrip": { background: "linear-gradient(to right, #FFA500, #A52A2A)" },
    "House Glass": { background: "linear-gradient(to right, #FF0000, #008000, #FFFF00)" },
    "The House of R": { background: "linear-gradient(to right, #800080, #808080)" }
};

// ====== THEME & UI HELPERS ======
window.applyHouseTheme = function(houseName) {
    const theme = houseThemes[houseName] || { color: "#6b21a8" };
    const root = document.documentElement.style;
    if (theme.background) {
        root.setProperty('--primary-accent', theme.background);
    } else {
        root.setProperty('--primary-accent', theme.color);
    }
};

window.updateHouseBadge = function(houseName) {
    const badge = document.getElementById('user-house-badge');
    const nameDisplay = document.getElementById('display-house-name');
    if (badge && nameDisplay) {
        badge.classList.remove('hidden');
        nameDisplay.innerText = houseName;
        badge.style.borderColor = 'var(--primary-accent)';
    }
};

// ====== GLOBAL UI FUNCTIONS ======
window.toggleAuthModal = () => document.getElementById('auth-modal')?.classList.toggle('hidden');

window.toggleAuthView = () => {
    isSignUpView = !isSignUpView;
    document.getElementById('onboarding-fields')?.classList.toggle('hidden', !isSignUpView);
    document.getElementById('modal-title').innerText = isSignUpView ? "REGISTRATION_MATRIX" : "IDENTITY_VERIFICATION";
};

// ====== AUTH LOGIC ======
window.handleAuthSubmit = async function() {
    const handle = document.getElementById('auth-username')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const house = document.getElementById('auth-house')?.value;
    const email = `${handle.toLowerCase().replace(/\s/g, '')}@varissphere.auth`;

    if (!handle || !password) return;

    if (isSignUpView) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (!error) {
            await supabaseClient.from('profiles').insert([{ 
                id: data.user.id, 
                username: handle, 
                house: house,
                first_name: document.getElementById('auth-first').value,
                last_name: document.getElementById('auth-last').value
            }]);
            applyHouseTheme(house);
            updateHouseBadge(house);
            window.toggleAuthModal();
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (!error) {
            window.toggleAuthModal();
            location.reload();
        }
    }
};

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            supabaseClient.from('profiles').select('house').eq('id', session.user.id).single()
                .then(({ data }) => { 
                    if (data) {
                        applyHouseTheme(data.house);
                        updateHouseBadge(data.house);
                    } 
                });
        }
    });
});
