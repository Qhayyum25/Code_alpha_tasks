// ── Shared API Helpers ─────────────────────────────────────────────
const API = '';
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

if (!getToken()) window.location.href = '/';

async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function logout() { localStorage.clear(); window.location.href = '/'; }

function goToProfile(id) {
  const uid = id || getUser().id;
  window.location.href = `/profile.html?id=${uid}`;
}

function avatarHTML(user, size = 36) {
  const initials = (user.username || '?')[0].toUpperCase();
  const s = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px`;
  if (user.avatar_url) {
    return `<div class="avatar" style="${s}"><img src="${user.avatar_url}" loading="lazy" onerror="this.parentElement.textContent='${initials}'"/></div>`;
  }
  return `<div class="avatar" style="${s}">${initials}</div>`;
}

// ── Theme Toggle ───────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  document.getElementById('theme-btn').textContent = isLight ? '☀️' : '🌙';
  const settingsDark = document.getElementById('settings-dark');
  if (settingsDark) settingsDark.checked = !isLight;
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
function toggleThemeFromSettings(el) {
  const isLight = !el.checked;
  document.body.classList.toggle('light', isLight);
  document.getElementById('theme-btn').textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
// Restore theme
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.addEventListener('DOMContentLoaded', () => {
    const tb = document.getElementById('theme-btn');
    if (tb) tb.textContent = '☀️';
    const sd = document.getElementById('settings-dark');
    if (sd) sd.checked = false;
  });
}

// ── Section Routing ────────────────────────────────────────────────
const SECTIONS = ['feed','messages','notifications','bookmarks','explore','analytics','settings'];

function showSection(name) {
  SECTIONS.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = (s === name) ? (s === 'messages' ? 'grid' : 'block') : 'none';
  });
  // Update left nav active state
  document.querySelectorAll('.left-nav-item').forEach(b => b.classList.remove('active'));
  const lnav = document.getElementById(`lnav-${name}`);
  if (lnav) lnav.classList.add('active');
  // Update top nav center
  document.querySelectorAll('.navbar-center .nav-link').forEach(b => b.classList.remove('active'));
  const tnav = document.getElementById(`nav-${name}`);
  if (tnav) tnav.classList.add('active');
  // Mobile nav
  document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));

  if (name === 'explore') loadExplorePosts();
  if (name === 'analytics') loadAnalytics();
}

function focusCreatePost() {
  showSection('feed');
  setTimeout(() => {
    const ta = document.getElementById('post-content');
    ta.focus();
    ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// ── Init ───────────────────────────────────────────────────────────
const me = getUser();
const navAv = document.getElementById('nav-avatar');
if (navAv) navAv.textContent = (me?.username || '?')[0].toUpperCase();
const createAv = document.getElementById('create-avatar');
if (createAv) createAv.textContent = (me?.username || '?')[0].toUpperCase();
const sbAv = document.getElementById('sidebar-avatar');
if (sbAv) sbAv.textContent = (me?.username || '?')[0].toUpperCase();
const sbUser = document.getElementById('sidebar-username');
if (sbUser) sbUser.textContent = me?.username || '';
const sbBio = document.getElementById('sidebar-bio');
if (sbBio) sbBio.textContent = me?.bio || 'No bio yet';
const storyMeInner = document.getElementById('story-me-inner');
if (storyMeInner) storyMeInner.textContent = (me?.username || '?')[0].toUpperCase();

// Load sidebar profile stats
loadProfileMiniStats();

async function loadProfileMiniStats() {
  try {
    const user = await api('GET', `/api/users/${me.id}`);
    const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    el('mini-posts', user.postCount || 0);
    el('mini-followers', user.followerCount || 0);
    el('mini-following', user.followingCount || 0);
    el('an-posts', user.postCount || 0);
    el('an-followers', user.followerCount || 0);
  } catch {}
}

// Stories
function buildStories(suggestions) {
  const wrap = document.getElementById('stories-wrap');
  if (!wrap) return;
  suggestions.slice(0, 6).forEach(u => {
    const div = document.createElement('div');
    div.className = 'story';
    const init = u.username[0].toUpperCase();
    div.innerHTML = `
      <div class="story-ring" style="position:relative">
        <div class="story-inner">${u.avatar_url ? `<img src="${u.avatar_url}" onerror="this.parentElement.textContent='${init}'"/>` : init}</div>
        ${Math.random() > 0.5 ? '<div class="online-dot"></div>' : ''}
      </div>
      <div class="story-label">${u.username}</div>`;
    div.onclick = () => showToast(`${u.username}'s story — coming soon!`);
    wrap.appendChild(div);
  });
}

// ── Notification Bell ──────────────────────────────────────────────
function toggleNotif() {
  const dd = document.getElementById('notif-dropdown');
  dd.classList.toggle('open');
}
function markAllRead() {
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  const dot = document.getElementById('notif-dot');
  if (dot) dot.style.display = 'none';
  showToast('All notifications marked as read');
}

// ── User Dropdown ──────────────────────────────────────────────────
function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu-wrap')) {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.remove('open');
  }
  if (!e.target.closest('[onclick="toggleNotif()"]') && !e.target.closest('.notif-dropdown')) {
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.classList.remove('open');
  }
  if (!e.target.closest('.search-wrap')) {
    const sr = document.getElementById('search-results');
    if (sr) sr.style.display = 'none';
  }
});

// ── Image input toggle ─────────────────────────────────────────────
function toggleImageInput() {
  const wrap = document.getElementById('image-input-wrap');
  wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
  if (wrap.style.display !== 'none') document.getElementById('post-image').focus();
}

function insertHashtag() {
  const ta = document.getElementById('post-content');
  ta.focus();
  const val = ta.value;
  const pos = ta.selectionStart;
  ta.value = val.slice(0, pos) + '#' + val.slice(pos);
  ta.selectionStart = ta.selectionEnd = pos + 1;
  updateCharCount();
}

// ── Char Count ─────────────────────────────────────────────────────
function updateCharCount() {
  const ta = document.getElementById('post-content');
  const cc = document.getElementById('char-count');
  if (!cc) return;
  const left = 280 - ta.value.length;
  cc.textContent = left;
  cc.style.color = left < 20 ? 'var(--danger)' : left < 50 ? 'var(--warning)' : 'var(--text3)';
}

// ── Tab State ──────────────────────────────────────────────────────
let currentTab = 'feed';

function showTab(tab) {
  currentTab = tab;
  document.getElementById('tab-feed').className = tab === 'feed' ? 'feed-tab active' : 'feed-tab';
  document.getElementById('tab-explore').className = tab === 'explore' ? 'feed-tab active' : 'feed-tab';
  loadPosts();
}

// ── Posts ──────────────────────────────────────────────────────────
async function loadPosts() {
  const container = document.getElementById('posts-list');
  container.innerHTML = `
    <div class="card skeleton-post" style="margin-bottom:14px">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:14px">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex:1"><div class="skeleton skeleton-line" style="width:40%"></div><div class="skeleton skeleton-line" style="width:25%;margin-top:6px;height:10px"></div></div>
      </div>
      <div class="skeleton skeleton-line" style="width:90%"></div>
      <div class="skeleton skeleton-line" style="width:70%"></div>
    </div>`;
  try {
    const endpoint = currentTab === 'feed' ? '/api/posts/feed' : '/api/posts';
    const posts = await api('GET', endpoint);
    if (!posts.length) {
      container.innerHTML = `<div class="empty"><div class="icon">📭</div><p>${currentTab === 'feed' ? 'Follow people to see their posts here.' : 'No posts yet. Be the first!'}</p><small>Try switching to Explore</small></div>`;
      return;
    }
    container.innerHTML = '';
    posts.forEach(p => container.appendChild(buildPostCard(p)));
  } catch (err) {
    container.innerHTML = `<div class="empty"><p>Could not load posts</p><small>${err.message}</small></div>`;
  }
}

async function loadExplorePosts() {
  const container = document.getElementById('explore-posts');
  if (!container) return;
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const posts = await api('GET', '/api/posts');
    container.innerHTML = '';
    posts.slice(0, 8).forEach(p => container.appendChild(buildPostCard(p)));
    if (!posts.length) container.innerHTML = '<div class="empty"><div class="icon">🌐</div><p>Nothing here yet</p></div>';
  } catch { container.innerHTML = ''; }
}

function loadAnalytics() {
  // Analytics are loaded from profile mini stats already
}

function buildPostCard(post) {
  const div = document.createElement('div');
  div.className = 'card post-card fade-in';
  div.id = `post-${post.id}`;
  const author = post.author || { username: 'Unknown', avatar_url: '' };
  const initials = (author.username || '?')[0].toUpperCase();
  const avatarTag = author.avatar_url
    ? `<div class="avatar"><img src="${author.avatar_url}" onerror="this.parentElement.textContent='${initials}'"/></div>`
    : `<div class="avatar">${initials}</div>`;
  const timeAgo = formatTime(post.created_at);
  const isOwn = author.id === me.id;
  const content = escHtml(post.content).replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');

  div.innerHTML = `
    <div class="post-header">
      ${avatarTag}
      <div class="post-author">
        <div class="name" onclick="goToProfile(${author.id})">${author.username}</div>
        <div class="time">${timeAgo}</div>
      </div>
      ${isOwn ? `<button class="post-menu-btn del-btn" onclick="deletePost(${post.id})" title="Delete post">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>` : `<button class="post-menu-btn" title="More options" style="color:var(--text3)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>`}
    </div>
    <div class="post-content">${content}</div>
    ${post.image_url ? `<img class="post-image" src="${post.image_url}" loading="lazy" onerror="this.remove()" ondblclick="toggleLike(${post.id}, ${post.liked})"/>` : ''}
    <div class="post-actions">
      <button class="action-btn ${post.liked ? 'liked' : ''}" id="like-btn-${post.id}" onclick="toggleLike(${post.id}, ${post.liked})" style="position:relative">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span id="like-count-${post.id}">${post.likeCount}</span>
      </button>
      <button class="action-btn" onclick="toggleComments(${post.id})">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span id="comment-count-${post.id}">${post.commentCount}</span>
      </button>
      <button class="action-btn" onclick="showToast('Reposted! 🔁')" title="Repost">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
      </button>
      <button class="action-btn" onclick="showToast('Saved! 🔖')" title="Save">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
    </div>
    <div class="comments-section" id="comments-${post.id}">
      <div id="comment-list-${post.id}"></div>
      <div class="comment-form">
        <div class="avatar" style="width:30px;height:30px;font-size:11px">${initials}</div>
        <input type="text" id="comment-input-${post.id}" class="input" placeholder="Add a comment…" onkeydown="if(event.key==='Enter')submitComment(${post.id})"/>
        <button class="btn btn-primary btn-sm" onclick="submitComment(${post.id})">Post</button>
      </div>
    </div>`;
  return div;
}

// ── Submit Post ────────────────────────────────────────────────────
async function submitPost() {
  const content = document.getElementById('post-content').value.trim();
  const imageWrap = document.getElementById('image-input-wrap');
  const image_url = document.getElementById('post-image')?.value.trim() || '';
  if (!content) return showToast('Write something first!', 'error');
  try {
    const post = await api('POST', '/api/posts', { content, image_url });
    document.getElementById('post-content').value = '';
    document.getElementById('post-image').value = '';
    if (imageWrap) imageWrap.style.display = 'none';
    updateCharCount();
    if (currentTab !== 'feed') showTab('feed');
    const container = document.getElementById('posts-list');
    const empty = container.querySelector('.empty');
    if (empty || container.querySelector('.skeleton-post')) container.innerHTML = '';
    container.prepend(buildPostCard(post));
    showToast('Post published! ✦');
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Delete Post ────────────────────────────────────────────────────
async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    await api('DELETE', `/api/posts/${id}`);
    const card = document.getElementById(`post-${id}`);
    if (card) { card.style.opacity = '0'; card.style.transform = 'scale(0.95)'; card.style.transition = 'all 0.2s'; setTimeout(() => card.remove(), 200); }
    showToast('Post deleted');
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Likes ──────────────────────────────────────────────────────────
async function toggleLike(postId, isLiked) {
  try {
    const data = isLiked
      ? await api('DELETE', `/api/posts/${postId}/like`)
      : await api('POST', `/api/posts/${postId}/like`);
    const btn = document.getElementById(`like-btn-${postId}`);
    btn.className = `action-btn${data.liked ? ' liked' : ''}`;
    btn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="${data.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> <span id="like-count-${postId}">${data.likeCount}</span>`;
    btn.onclick = () => toggleLike(postId, data.liked);
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Comments ───────────────────────────────────────────────────────
const commentsOpen = {};

async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  if (commentsOpen[postId]) {
    section.classList.remove('open'); commentsOpen[postId] = false;
  } else {
    section.classList.add('open'); commentsOpen[postId] = true;
    await loadComments(postId);
  }
}

async function loadComments(postId) {
  const list = document.getElementById(`comment-list-${postId}`);
  list.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:8px auto;border-width:2px"></div>';
  try {
    const comments = await api('GET', `/api/posts/${postId}/comments`);
    list.innerHTML = comments.length ? '' : '<div style="color:var(--text3);font-size:13px;margin-bottom:8px">No comments yet. Be the first!</div>';
    comments.forEach(c => {
      const el = document.createElement('div');
      el.className = 'comment';
      const init = (c.username || '?')[0].toUpperCase();
      const av = c.avatar_url
        ? `<div class="avatar" style="width:30px;height:30px"><img src="${c.avatar_url}" onerror="this.parentElement.textContent='${init}'"/></div>`
        : `<div class="avatar" style="width:30px;height:30px;font-size:11px">${init}</div>`;
      el.innerHTML = `${av}<div class="body"><div class="author">${c.username}</div><div class="text">${escHtml(c.content)}</div><div class="comment-time">just now</div></div>`;
      list.appendChild(el);
    });
    const countEl = document.getElementById(`comment-count-${postId}`);
    if (countEl) countEl.textContent = comments.length;
  } catch (err) {
    list.innerHTML = `<div style="color:var(--danger);font-size:13px">${err.message}</div>`;
  }
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const content = input.value.trim();
  if (!content) return;
  try {
    await api('POST', `/api/posts/${postId}/comments`, { content });
    input.value = '';
    await loadComments(postId);
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Suggestions ────────────────────────────────────────────────────
async function loadSuggestions() {
  const list = document.getElementById('suggestions-list');
  try {
    const users = await api('GET', '/api/users?q=');
    const others = users.filter(u => u.id !== me.id).slice(0, 5);
    if (!others.length) { list.innerHTML = '<div style="color:var(--text3);font-size:13px">No suggestions yet.</div>'; return; }
    list.innerHTML = '';
    buildStories(others);
    others.forEach(u => {
      const div = document.createElement('div');
      div.className = 'user-suggestion';
      const init = u.username[0].toUpperCase();
      const av = u.avatar_url
        ? `<div class="avatar" style="width:36px;height:36px"><img src="${u.avatar_url}" onerror="this.parentElement.textContent='${init}'"/></div>`
        : `<div class="avatar" style="width:36px;height:36px;font-size:13px">${init}</div>`;
      div.innerHTML = `
        ${av}
        <div class="info">
          <div class="uname" onclick="goToProfile(${u.id})">${u.username}</div>
          <div class="ubio">${u.bio || 'New to Pulse'}</div>
        </div>
        <button class="btn btn-outline btn-sm" id="follow-btn-${u.id}" onclick="quickFollow(${u.id})">Follow</button>`;
      list.appendChild(div);
    });
  } catch {
    list.innerHTML = '<div style="color:var(--text3);font-size:13px">Could not load suggestions.</div>';
  }
}

async function quickFollow(userId) {
  const btn = document.getElementById(`follow-btn-${userId}`);
  try {
    await api('POST', `/api/users/${userId}/follow`);
    btn.textContent = '✓ Following';
    btn.className = 'btn btn-ghost btn-sm';
    showToast('Followed! 🎉');
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Messages mock ──────────────────────────────────────────────────
function openChat(el, username, name) {
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('chat-name').textContent = username;
  const av = document.getElementById('chat-avatar');
  if (av) av.textContent = name[0].toUpperCase();
  const typing = document.getElementById('typing-indicator');
  if (typing) typing.textContent = Math.random() > 0.5 ? '● online' : 'Last seen recently';
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  const list = document.getElementById('messages-list');
  const div = document.createElement('div');
  div.className = 'msg mine fade-in';
  div.innerHTML = `<div class="msg-bubble">${escHtml(text)}</div><div class="msg-time">${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>`;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
  input.value = '';
  // Mock typing indicator
  const typing = document.getElementById('typing-indicator');
  if (typing) { typing.textContent = 'typing…'; setTimeout(() => { typing.textContent = '● online'; }, 2000); }
}

// ── Search ─────────────────────────────────────────────────────────
let searchTimeout;
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

if (searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = searchInput.value.trim();
    if (!q) { searchResults.style.display = 'none'; return; }
    searchTimeout = setTimeout(() => doSearch(q), 280);
  });
}

async function doSearch(q) {
  try {
    const users = await api('GET', `/api/users?q=${encodeURIComponent(q)}`);
    searchResults.innerHTML = '';
    if (!users.length) {
      searchResults.innerHTML = '<div class="search-result-item" style="color:var(--text3)">No users found</div>';
    } else {
      users.forEach(u => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        const init = u.username[0].toUpperCase();
        const av = u.avatar_url
          ? `<div class="avatar" style="width:32px;height:32px"><img src="${u.avatar_url}" onerror="this.parentElement.textContent='${init}'"/></div>`
          : `<div class="avatar" style="width:32px;height:32px;font-size:12px">${init}</div>`;
        div.innerHTML = `${av}<div><div style="font-weight:600;font-size:14px">${u.username}</div><div style="font-size:12px;color:var(--text3)">${u.bio || ''}</div></div>`;
        div.onclick = () => goToProfile(u.id);
        searchResults.appendChild(div);
      });
    }
    searchResults.style.display = 'block';
  } catch {}
}

// ── Utils ──────────────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function formatTime(dt) {
  const diff = Math.floor((Date.now() - new Date(dt + 'Z')) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ── Boot ───────────────────────────────────────────────────────────
loadPosts();
loadSuggestions();
