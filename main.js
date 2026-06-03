console.log("main.js loading...");

const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; 
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.isSignUpView = false;

window.toggleAuthView = function() {
    console.log("Toggle Auth View clicked");
    window.isSignUpView = !window.isSignUpView;
    const fields = document.getElementById('onboarding-fields');
    const title = document.getElementById('modal-title');
    if (fields) fields.classList.toggle('hidden', !window.isSignUpView);
    if (title) title.innerText = window.isSignUpView ? "REGISTRATION_MATRIX" : "IDENTITY_VERIFICATION";
};

window.toggleAuthModal = function() {
    console.log("Toggle Modal clicked");
    document.getElementById('auth-modal')?.classList.toggle('hidden');
};

window.handleAuthSubmit = async function() {
    console.log("Submit clicked");
    const handle = document.getElementById('auth-username')?.value.trim();
    const password = document.getElementById('auth-password')?.value;
    const house = document.getElementById('auth-house')?.value;
    const email = `${handle.toLowerCase().replace(/\s/g, '')}@varissphere.example.com`;

    if (!handle || !password) return;

    if (window.isSignUpView) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            console.error("Signup Error:", error);
            alert("Error: " + error.message);
        } else {
            await supabaseClient.from('profiles').insert([{ 
                id: data.user.id, username: handle, house: house,
                first_name: document.getElementById('auth-first')?.value,
                last_name: document.getElementById('auth-last')?.value
            }]);
            location.reload();
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) alert("Login Error: " + error.message);
        else location.reload();
    }
};

console.log("main.js loaded successfully.");
