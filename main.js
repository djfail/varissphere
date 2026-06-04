// 1. Initialize Supabase
const supabaseClient = supabase.createClient('https://rwhoiqssmveztuspywpg.supabase.co', 'sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q');

// 2. Initial Load
window.addEventListener('DOMContentLoaded', async () => {
    await checkUserStatus();
});

window.checkUserStatus = async function() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const loginBtn = document.getElementById('login-btn');
    const avatar = document.getElementById('user-avatar');

    if (session) {
        loginBtn.classList.add('hidden');
        avatar.classList.remove('hidden');

        // Fetch profile
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('photo_url')
            .eq('id', session.user.id)
            .single();

        if (profile?.photo_url) {
            avatar.src = supabaseClient.storage.from('avatars').getPublicUrl(profile.photo_url).data.publicUrl;
        }
    }
};

// 3. Auth Flow
window.isSignUpView = false;
window.toggleAuthModal = () => document.getElementById('auth-modal').classList.toggle('hidden');

window.toggleAuthView = () => {
    window.isSignUpView = !window.isSignUpView;
    const title = document.getElementById('modal-title');
    title.innerText = window.isSignUpView ? "CREATE_NODE" : "WELCOME TO VARIS SPHERE";
};

window.handleAuthSubmit = async () => {
    const email = document.getElementById('email-input')?.value.toLowerCase();
    const password = document.getElementById('pass-input')?.value;

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (window.isSignUpView) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) { alert(error.message); return; }
        
        if (data.user) {
            await supabaseClient.from('profiles').insert([{ 
                id: data.user.id, 
                username: email.split('@')[0], 
                first_name: 'User', 
                house: 'Neutral' 
            }]);
            alert("Node initialized! Please log in.");
            window.toggleAuthView();
        }
    } else {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { alert(error.message); return; }
        window.location.reload();
    }
};

// 4. Profile Interaction
window.showProfile = () => {
    document.getElementById('feed-view').classList.add('hidden');
    document.getElementById('profile-editor').classList.remove('hidden');
};

window.saveProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const fileInput = document.getElementById('avatar-upload');
    const bio = document.getElementById('bio-input').value;
    
    let photo_url = null;
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const { data, error } = await supabaseClient.storage.from('avatars').upload(`${user.id}/avatar.png`, file, { upsert: true });
        if (error) { alert("Upload failed"); return; }
        photo_url = data.path;
    }

    await supabaseClient.from('profiles').update({ bio, photo_url }).eq('id', user.id);
    alert("Profile Updated");
    window.location.reload();
};
