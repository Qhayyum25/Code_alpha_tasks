// ── Shared Helpers ─────────────────────────────────────────────────
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
function goToMyProfile() { window.location.href = `/profile.html?id=${getUser().id}`; }

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

// ── Theme Toggle ───────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  document.getElementById('theme-btn').textContent = isLight ? '☀️' : '🌙';
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
  document.addEventListener('DOMContentLoaded', () => {
    const tb = document.getElementById('theme-btn');
    if (tb) tb.textContent = '☀️';
  });
}

// User dropdown
function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu-wrap')) {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.remove('open');
  }
});

// ── State ──────────────────────────────────────────────────────────
const me = getUser();
const profileId = parseInt(new URLSearchParams(location.search).get('id')) || me.id;
const isOwn = profileId === me.id;

const navAv = document.getElementById('nav-avatar');
if (navAv) navAv.textContent = (me?.username || '?')[0].toUpperCase();

let profileData = null;
let editVisible = false;

// ── Profile Tab Switching ──────────────────────────────────────────
function switchProfileTab(tab, el) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  if (tab === 'posts') {
    document.getElementById('posts-section').style.display = 'block';
    loadUserPosts();
  } else {
    document.getElementById('posts-section').innerHTML = `
      <div class="empty">
        <div class="icon">${tab === 'likes' ? '❤️' : tab === 'media' ? '🖼️' : tab === 'saved' ? '🔖' : '💬'}</div>
        <p>${tab.charAt(0).toUpperCase() + tab.slice(1)} coming soon</p>
        <small>This feature is in development</small>
      </div>`;
  }
}

// ── Load Profile ───────────────────────────────────────────────────
async function loadProfile() {
  try {
    const user = await api('GET', `/api/users/${profileId}`);
    profileData = user;

    document.title = `Pulse — @${user.username}`;
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-handle').textContent = `@${user.username}`;
    document.getElementById('profile-bio').textContent = user.bio || 'No bio yet.';
    document.getElementById('stat-posts').textContent = user.postCount;
    document.getElementById('stat-followers').textContent = user.followerCount;
    document.getElementById('stat-following').textContent = user.followingCount;

    // Meta info
    const meta = document.getElementById('profile-meta');
    if (meta) {
      meta.innerHTML = `
        <span class="profile-meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Joined Pulse
        </span>`;
    }

    // Avatar
    const avEl = document.getElementById('profile-avatar');
    if (user.avatar_url) {
      avEl.innerHTML = `<img src="${user.avatar_url}" onerror="this.parentElement.textContent='${user.username[0].toUpperCase()}'"/>`;
    } else {
      avEl.textContent = user.username[0].toUpperCase();
    }

    // Actions
    const actionsEl = document.getElementById('profile-actions');
    if (isOwn) {
      actionsEl.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="toggleEdit(true)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Profile
        </button>`;
      document.getElementById('edit-bio').value = user.bio || '';
      document.getElementById('edit-avatar').value = user.avatar_url || '';
    } else {
      const following = user.isFollowing;
      actionsEl.innerHTML = `
        <button class="btn ${following ? 'btn-ghost' : 'btn-primary'} btn-sm" id="follow-action-btn" onclick="toggleFollow()">
          ${following ? '✓ Following' : '+ Follow'}
        </button>
        <button class="btn btn-ghost btn-sm" onclick="showToast('Message feature coming soon!')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Message
        </button>`;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Follow / Unfollow ──────────────────────────────────────────────
async function toggleFollow() {
  const btn = document.getElementById('follow-action-btn');
  const isFollowing = profileData?.isFollowing;
  try {
    if (isFollowing) {
      await api('DELETE', `/api/users/${profileId}/follow`);
      profileData.isFollowing = false;
      btn.textContent = '+ Follow';
      btn.className = 'btn btn-primary btn-sm';
      const el = document.getElementById('stat-followers');
      el.textContent = parseInt(el.textContent) - 1;
    } else {
      await api('POST', `/api/users/${profileId}/follow`);
      profileData.isFollowing = true;
      btn.textContent = '✓ Following';
      btn.className = 'btn btn-ghost btn-sm';
      const el = document.getElementById('stat-followers');
      el.textContent = parseInt(el.textContent) + 1;
    }
    showToast(isFollowing ? 'Unfollowed' : 'Followed! 🎉');
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Edit Profile ───────────────────────────────────────────────────
function toggleEdit(visible) {
  editVisible = visible;
  document.getElementById('edit-form').style.display = visible ? 'block' : 'none';
}

async function saveProfile() {
  const bio = document.getElementById('edit-bio').value;
  const avatar_url = document.getElementById('edit-avatar').value;
  try {
    const updated = await api('PUT', `/api/users/${me.id}`, { bio, avatar_url });
    localStorage.setItem('user', JSON.stringify({ ...me, bio: updated.bio, avatar_url: updated.avatar_url }));
    document.getElementById('profile-bio').textContent = updated.bio || 'No bio yet.';
    const avEl = document.getElementById('profile-avatar');
    if (updated.avatar_url) {
      avEl.innerHTML = `<img src="${updated.avatar_url}" onerror="this.parentElement.textContent='${updated.username[0].toUpperCase()}'"/>`;
    }
    toggleEdit(false);
    showToast('Profile updated! ✦');
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Load Posts ─────────────────────────────────────────────────────
async function loadUserPosts() {
  const container = document.getElementById('user-posts');
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const posts = await api('GET', `/api/posts/user/${profileId}`);
    if (!posts.length) {
      container.innerHTML = '<div class="empty"><div class="icon">📝</div><p>No posts yet.</p></div>';
      return;
    }
    container.innerHTML = '';
    posts.forEach(p => container.appendChild(buildPostCard(p)));
  } catch (err) {
    container.innerHTML = `<div class="empty"><p>${err.message}</p></div>`;
  }
}

function buildPostCard(post) {
  const div = document.createElement('div');
  div.className = 'card post-card fade-in';
  div.id = `post-${post.id}`;
  const author = post.author || { username: 'Unknown', avatar_url: '' };
  const init = author.username[0].toUpperCase();
  const avtag = author.avatar_url
    ? `<div class="avatar"><img src="${author.avatar_url}" onerror="this.parentElement.textContent='${init}'"/></div>`
    : `<div class="avatar">${init}</div>`;
  const content = escHtml(post.content).replace(/#(\w+)/g, '<span style="color:var(--accent-light);">#$1</span>');

  div.innerHTML = `
    <div class="post-header">
      ${avtag}
      <div class="post-author">
        <div class="name">${author.username}</div>
        <div class="time">${formatTime(post.created_at)}</div>
      </div>
      ${isOwn ? `<button class="post-menu-btn del-btn" onclick="deletePost(${post.id})" title="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>` : ''}
    </div>
    <div class="post-content">${content}</div>
    ${post.image_url ? `<img class="post-image" src="${post.image_url}" loading="lazy" onerror="this.remove()"/>` : ''}
    <div class="post-actions">
      <button class="action-btn ${post.liked ? 'liked' : ''}" id="like-btn-${post.id}" onclick="toggleLike(${post.id}, ${post.liked})">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span id="like-count-${post.id}">${post.likeCount}</span>
      </button>
      <button class="action-btn" onclick="toggleComments(${post.id})">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span id="comment-count-${post.id}">${post.commentCount}</span>
      </button>
      <button class="action-btn" onclick="showToast('Saved! 🔖')">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
    </div>
    <div class="comments-section" id="comments-${post.id}">
      <div id="comment-list-${post.id}"></div>
      <div class="comment-form">
        <div class="avatar" style="width:30px;height:30px;font-size:11px">${me.username[0].toUpperCase()}</div>
        <input type="text" id="comment-input-${post.id}" class="input" placeholder="Add a comment…" onkeydown="if(event.key==='Enter')submitComment(${post.id})"/>
        <button class="btn btn-primary btn-sm" onclick="submitComment(${post.id})">Post</button>
      </div>
    </div>`;
  return div;
}

async function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  try {
    await api('DELETE', `/api/posts/${id}`);
    const card = document.getElementById(`post-${id}`);
    if (card) { card.style.opacity = '0'; card.style.transition = 'opacity 0.2s'; setTimeout(() => card.remove(), 200); }
    const el = document.getElementById('stat-posts');
    el.textContent = Math.max(0, parseInt(el.textContent) - 1);
    showToast('Post deleted');
  } catch (err) { showToast(err.message, 'error'); }
}

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
    list.innerHTML = comments.length ? '' : '<div style="color:var(--text3);font-size:13px;margin-bottom:8px">No comments yet.</div>';
    comments.forEach(c => {
      const el = document.createElement('div');
      el.className = 'comment';
      const ci = (c.username || '?')[0].toUpperCase();
      const cav = c.avatar_url
        ? `<div class="avatar" style="width:30px;height:30px"><img src="${c.avatar_url}" onerror="this.parentElement.textContent='${ci}'"/></div>`
        : `<div class="avatar" style="width:30px;height:30px;font-size:11px">${ci}</div>`;
      el.innerHTML = `${cav}<div class="body"><div class="author">${c.username}</div><div class="text">${escHtml(c.content)}</div></div>`;
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

// ── Boot ───────────────────────────────────────────────────────────
loadProfile();
loadUserPosts();
