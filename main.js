const supabaseClient = supabase.createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

// 1. Initial Load: Check Auth State
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

        // Fetch profile to get image
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

// 2. Authentication Flow
window.isSignUpView = false;
window.toggleAuthModal = () => document.getElementById('auth-modal').classList.toggle('hidden');

window.handleAuthSubmit = async () => {
    const email = document.getElementById('email-input').value; // Ensure these inputs exist in your modal
    const password = document.getElementById('pass-input').value;

    if (window.isSignUpView) {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (data.user) {
            // Auto-create profile row
            await supabaseClient.from('profiles').insert([{ 
                id: data.user.id, 
                username: email.split('@')[0], 
                first_name: 'User', 
                house: 'Default' 
            }]);
            alert("Account Created!");
        }
    } else {
        await supabaseClient.auth.signInWithPassword({ email, password });
        window.location.reload();
    }
};

// 3. Profile Navigation
window.showProfile = () => {
    document.getElementById('feed-view').classList.add('hidden');
    document.getElementById('profile-editor').classList.remove('hidden');
};

// 4. Save Profile Updates
window.saveProfile = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const fileInput = document.getElementById('avatar-upload');
    const bio = document.getElementById('bio-input').value;
    
    let photo_url = null;
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const { data } = await supabaseClient.storage.from('avatars').upload(`${user.id}/avatar.png`, file, { upsert: true });
        photo_url = data.path;
    }

    await supabaseClient.from('profiles').update({ bio, photo_url }).eq('id', user.id);
    alert("Profile Updated");
    window.location.reload();
};
