// =============================================
// 🔑 REPLACE THESE WITH YOUR SUPABASE DETAILS
// =============================================
const SUPABASE_URL = 'https://fghuggfaipwdtwpjsaon.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Hgb_4yGVSkCSSkKf4bN1lQ_Ndsz1yD-'

// Create Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

const app = document.getElementById('app')
let currentUser = null

// =============================================
// 🚀 START THE APP
// =============================================
async function startApp() {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (user) {
        currentUser = user
        showDashboard()
    } else {
        showLoginPage()
    }
}

// =============================================
// 📱 LOGIN PAGE (From your flowchart)
// =============================================
function showLoginPage() {
    app.innerHTML = `
        <div class="container">
            <div class="logo"><span>by</span> WEEM</div>
            
            <div class="card">
                <div id="loginError" class="error"></div>
                
                <h2>Login</h2>
                <input type="email" id="loginEmail" placeholder="Email">
                <input type="password" id="loginPassword" placeholder="Password">
                <button class="btn btn-blue" onclick="handleLogin()">Login</button>
                
                <div class="link">
                    No account? <a href="#" onclick="showSignupPage()">Sign up here</a>
                </div>
            </div>
        </div>
    `
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value
    const password = document.getElementById('loginPassword').value
    const errorDiv = document.getElementById('loginError')
    
    if (!email || !password) {
        errorDiv.textContent = 'Please fill in all fields'
        errorDiv.style.display = 'block'
        return
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    
    if (error) {
        errorDiv.textContent = error.message
        errorDiv.style.display = 'block'
    } else {
        currentUser = data.user
        showDashboard()
    }
}

// =============================================
// 📝 SIGNUP PAGE (From your flowchart)
// =============================================
function showSignupPage() {
    app.innerHTML = `
        <div class="container">
            <div class="logo"><span>by</span> WEEM</div>
            
            <div class="card">
                <div id="signupError" class="error"></div>
                
                <h2>Sign Up</h2>
                <input type="text" id="signupUsername" placeholder="Username">
                <input type="email" id="signupEmail" placeholder="Email">
                <input type="password" id="signupPassword" placeholder="Password (6+ characters)">
                <button class="btn btn-green" onclick="handleSignup()">Sign Up</button>
                
                <div class="link">
                    Already have an account? <a href="#" onclick="showLoginPage()">Login</a>
                </div>
            </div>
        </div>
    `
}

async function handleSignup() {
    const username = document.getElementById('signupUsername').value
    const email = document.getElementById('signupEmail').value
    const password = document.getElementById('signupPassword').value
    const errorDiv = document.getElementById('signupError')
    
    if (!username || !email || !password) {
        errorDiv.textContent = 'Please fill in all fields'
        errorDiv.style.display = 'block'
        return
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters'
        errorDiv.style.display = 'block'
        return
    }
    
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { username: username }
        }
    })
    
    if (error) {
        errorDiv.textContent = error.message
        errorDiv.style.display = 'block'
    } else {
        // Create profile in profiles table
        await supabase.from('profiles').insert({
            id: data.user.id,
            username: username,
            email: email
        })
        
        currentUser = data.user
        showDashboard()
    }
}

// =============================================
// 📋 DASHBOARD - Personal Blog Page
// =============================================
async function showDashboard() {
    const username = currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User'
    
    // Fetch user's posts
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
    
    let postsHTML = ''
    if (posts && posts.length > 0) {
        posts.forEach(post => {
            postsHTML += `
                <div class="post">
                    <h3>${escapeText(post.title)}</h3>
                    <p>${escapeText(post.content)}</p>
                    <small>${new Date(post.created_at).toLocaleDateString()}</small>
                </div>
            `
        })
    } else {
        postsHTML = '<div class="empty">📝 No posts yet. Create your first one below!</div>'
    }
    
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <h1><span style="color:#0066cc;">by WEEM</span> | ${escapeText(username)}</h1>
                <div class="btn-group">
                    <button class="btn-sm btn-green" onclick="showExplore()">🌍 Other</button>
                    <button class="btn-sm btn-gray" onclick="handleLogout()">Quit</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Create New Post</h3>
                <input type="text" id="postTitle" placeholder="Post title">
                <textarea id="postContent" placeholder="What's on your mind?"></textarea>
                <button class="btn btn-blue" onclick="createPost()">Publish</button>
            </div>
            
            <h3 style="margin: 20px 0 10px;">Your Posts</h3>
            ${postsHTML}
        </div>
    `
}

async function createPost() {
    const title = document.getElementById('postTitle').value
    const content = document.getElementById('postContent').value
    
    if (!title || !content) {
        alert('Please fill in both title and content')
        return
    }
    
    await supabase.from('posts').insert({
        user_id: currentUser.id,
        title: title,
        content: content
    })
    
    showDashboard()
}

// =============================================
// 🌍 EXPLORE PAGE - The "OTHER BUTTON"
// =============================================
async function showExplore() {
    const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
    
    // Get all profiles for usernames
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
    
    const profileMap = {}
    if (profiles) {
        profiles.forEach(p => {
            profileMap[p.id] = p.username
        })
    }
    
    let postsHTML = ''
    if (posts && posts.length > 0) {
        posts.forEach(post => {
            const authorName = profileMap[post.user_id] || 'anonymous'
            const isOwnPost = post.user_id === currentUser.id
            
            postsHTML += `
                <div class="post">
                    <div class="author">@${escapeText(authorName)}</div>
                    <h3>${escapeText(post.title)}</h3>
                    <p>${escapeText(post.content)}</p>
                    <small>${new Date(post.created_at).toLocaleDateString()}</small>
                    ${!isOwnPost ? '<button class="btn-sm btn-green" style="margin-top:10px;" onclick="alert(\'Friend request sent!\')">👋 Add Friend</button>' : ''}
                </div>
            `
        })
    } else {
        postsHTML = '<div class="empty">🌱 No posts yet. Be the first!</div>'
    }
    
    app.innerHTML = `
        <div class="container">
            <div class="header">
                <h1><span style="color:#0066cc;">by WEEM</span> | 🌍 Explore</h1>
                <button class="btn-sm btn-gray" onclick="showDashboard()">← Back</button>
            </div>
            
            <div class="notice">
                👀 <strong>Read-Only:</strong> You can see everyone's blogs but cannot edit them.
                Send a friend request to chat!
            </div>
            
            ${postsHTML}
        </div>
    `
}

// =============================================
// 🚪 LOGOUT (QUIT BUTTON)
// =============================================
async function handleLogout() {
    await supabase.auth.signOut()
    currentUser = null
    showLoginPage()
}

// =============================================
// 🛡️ HELPER FUNCTION
// =============================================
function escapeText(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

// =============================================
// 🚀 START!
// =============================================
startApp()
