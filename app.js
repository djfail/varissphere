// ====== CONFIGURATION ======
const SUPABASE_URL = "https://rwhoiqssmveztuspywpg.supabase.co"; // This is already set to your URL!
const SUPABASE_ANON_KEY = "sb_publishable_khPW-u-jip8x0E2P7SH5NA_f-kzfN4Q"; // <-- REPLACE THIS ENTIRE STRING WITH YOUR SB_PUBLISHABLE KEY

// Initialize the connection to your database
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", () => {
    fetchPulseFeed();
    listenToFeedUpdates();
});

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
                <div class="text-center text-gray-500 font-mono text-sm py-12">
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

// Generate the beautiful HTML structure for each post card
function renderPostCard(post) {
    const author = post.profiles || { first_name: 'Unknown', username: 'unknown', house: 'Unknown', photo_url: '' };
    const defaultAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + author.username;
    const avatar = author.photo_url || defaultAvatar;
    
    // Format the date/time cleanly
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

// Live updating wizardry! Automatically shows new posts without needing to reload the tab.
function listenToFeedUpdates() {
    supabaseClient
        .channel('public:posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            fetchPulseFeed();
        })
        .subscribe();
}
