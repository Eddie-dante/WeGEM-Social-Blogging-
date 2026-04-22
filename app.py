// Supabase Config - REPLACE WITH YOURS
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_KEY = 'your-anon-key'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const app = document.getElementById('app')
let currentUser = null

// Check if user is logged in
async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    currentUser = user
    
    if (user) {
        showDashboard()
    } else {
        showLogin()
    }
}

// ============ LOGIN PAGE ============
function showLogin() {
    app.innerHTML = `
        <div class="container">
            <div class="logo">by WEEM</div>
            <div class="card">
                <div class="tabs">
                    <div class="tab active" onclick="showLogin()">Login</div>
                    <div class="tab" onclick="showSignup()">Sign Up</div>
                </div>
                <h2>Welcome Back</h2>
                <div id="error" class="error"></div>
                <form onsubmit="login(event)">
                    <input type="email" id="email" placeholder="Email" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    `
}

async function login(e) {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
        document.getElementById('error').textContent = error.message
    } else {
        init()
    }
}

// ============ SIGNUP PAGE ============
function showSignup() {
    app.innerHTML = `
        <div class="container">
            <div class="logo">by WEEM</div>
            <div class="card">
                <div class="tabs">
                    <div class="tab" onclick="showLogin()">Login</div>
                    <div class="tab active" onclick="showSignup()">Sign Up</div>
                </div>
                <h2>Create Account</h2>
                <div id="error" class="error"></div>
                <form onsubmit="signup(event)">
                    <input type="text" id="username" placeholder="Username" required>
                    <input type="email" id="email" placeholder="Email" required>
                    <input type="password" id="password" placeholder="Password (min 6 chars)" required>
                    <button type="submit" class="secondary">Sign Up</button>
                </form>
                <div class="link">
                    <a href="#" onclick="showLogin()">Already have an account? Login</a>
                </div>
            </div>
        </div>
    `
}

async function signup(e) {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const username = document.getElementById('username').value
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
    })
    
    if (error) {
        document.getElementById('error').textContent = error.message
    } else {
        // Create profile
        await supabase.from('profiles').insert([
            { id: data.user.id, username, email }
        ])
        init()
    }
}

// ============ DASHBOARD (Personal Blog Page) ============
async function showDashboard() {
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
    
    const username = currentUser.user_metadata?.username || currentUser.email
    
    let postsHTML = ''
    if (posts && posts.length > 0) {
        posts.forEach(post => {
            postsHTML += `
                <div class="post">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                    <small>${new Date(post.created_at).toLocaleString()}</small>
                </div>
            `
        })
    } else {
        postsHTML = '<p style="text-align:center; color:#999; padding:40px;">📝 No posts yet. Create one below!</p>'
    }
    
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <h1><span style="color:#0066cc;">by WEEM</span> | ${escapeHtml(username)}</h1>
                <div class="btn-group">
                    <button onclick="showExplore()" style="background:#28a745;">🌍 Other</button>
                    <button onclick="logout()" class="danger" style="background:#666;">Quit</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Create Post</h3>
                <form onsubmit="createPost(event)">
                    <input type="text" id="title" placeholder="Title" required>
                    <textarea id="content" placeholder="What's on your mind?" rows="3" required></textarea>
                    <button type="submit">Publish</button>
                </form>
            </div>
            
            <h3 style="margin:20px 0 10px;">Your Posts</h3>
            ${postsHTML}
        </div>
    `
}

async function createPost(e) {
    e.preventDefault()
    const title = document.getElementById('title').value
    const content = document.getElementById('content').value
    
    await supabase.from('posts').insert([
        { user_id: currentUser.id, title, content }
    ])
    
    showDashboard()
}

// ============ EXPLORE PAGE (The "OTHER BUTTON") ============
async function showExplore() {
    const { data: posts } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id(username)
        `)
        .order('created_at', { ascending: false })
        .limit(50)
    
    let postsHTML = ''
    if (posts && posts.length > 0) {
        posts.forEach(post => {
            const author = post.profiles?.username || 'anonymous'
            postsHTML += `
                <div class="post">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong style="color:#0066cc;">@${escapeHtml(author)}</strong>
                        ${author !== currentUser.user_metadata?.username ? 
                            '<button onclick="sendFriendRequest(\'' + post.user_id + '\')" style="background:#28a745; padding:5px 12px; border:none; border-radius:20px; color:white; cursor:pointer; font-size:12px;">👋 Add Friend</button>' 
                            : ''}
                    </div>
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${escapeHtml(post.content)}</p>
                    <small>${new Date(post.created_at).toLocaleString()}</small>
                </div>
            `
        })
    } else {
        postsHTML = '<p style="text-align:center; color:#999; padding:40px;">🌱 No posts yet.</p>'
    }
    
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <h1><span style="color:#0066cc;">by WEEM</span> | 🌍 Explore</h1>
                <button onclick="showDashboard()" style="background:#666; padding:10px 16px; border:none; border-radius:8px; color:white; cursor:pointer;">← Back</button>
            </div>
            
            <div style="background:#fff3cd; padding:15px; border-radius:8px; margin-bottom:20px; color:#856404;">
                <strong>👀 Read-Only:</strong> You can see everyone's blogs but cannot edit them.
            </div>
            
            ${postsHTML}
        </div>
    `
}

function sendFriendRequest(userId) {
    alert('📨 Friend request sent! (Phase 3 - Coming soon)')
    // Phase 3: Actually store friend request in Supabase
}

// ============ LOGOUT ============
async function logout() {
    await supabase.auth.signOut()
    currentUser = null
    showLogin()
}

// Helper function
function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// Start the app
init()
