/**
 * seed.js – populate the Pulse database with realistic mock data.
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'social.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Helpers ───────────────────────────────────────────────────────
const PASS_HASH = bcrypt.hashSync('password123', 10);

// ── Mock Users ────────────────────────────────────────────────────
const users = [
    {
        username: 'alex_dev',
        email: 'alex@pulse.com',
        bio: 'Full-stack developer. Building things that matter. ☕',
        avatar_url: 'https://i.pravatar.cc/150?img=11',
    },
    {
        username: 'sara_designs',
        email: 'sara@pulse.com',
        bio: 'UI/UX designer & coffee enthusiast. Making the web beautiful 🎨',
        avatar_url: 'https://i.pravatar.cc/150?img=5',
    },
    {
        username: 'miles_photo',
        email: 'miles@pulse.com',
        bio: 'Travel photographer. 43 countries and counting 📷✈️',
        avatar_url: 'https://i.pravatar.cc/150?img=68',
    },
    {
        username: 'jane_codes',
        email: 'jane@pulse.com',
        bio: 'ML engineer. Python over everything 🐍',
        avatar_url: 'https://i.pravatar.cc/150?img=47',
    },
    {
        username: 'tom_fitness',
        email: 'tom@pulse.com',
        bio: 'Personal trainer & nutrition coach. Lift heavy, eat clean 💪',
        avatar_url: 'https://i.pravatar.cc/150?img=12',
    },
    {
        username: 'priya_writes',
        email: 'priya@pulse.com',
        bio: 'Author, blogger & storyteller. Words change worlds 📖',
        avatar_url: 'https://i.pravatar.cc/150?img=9',
    },
];

const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (username, email, password_hash, bio, avatar_url) VALUES (?, ?, ?, ?, ?)'
);

const userIds = {};
for (const u of users) {
    insertUser.run(u.username, u.email, PASS_HASH, u.bio, u.avatar_url);
    userIds[u.username] = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username).id;
}

// ── Mock Posts ────────────────────────────────────────────────────
const insertPost = db.prepare(
    'INSERT OR IGNORE INTO posts (user_id, content, image_url, created_at) VALUES (?, ?, ?, ?)'
);

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().replace('T', ' ').slice(0, 19);
}

const posts = [
    {
        author: 'alex_dev',
        content: 'Just finished setting up my new desk setup. Minimalist, ergonomic, and plenty of screen real estate. Let the coding begin! 💻✨',
        image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
        created_at: daysAgo(0),
    },
    {
        author: 'sara_designs',
        content: 'Exploring the beauty of brutalist architecture today. The raw textures and bold geometric shapes are so inspiring for digital layout systems. 🏛️📐',
        image_url: 'https://images.unsplash.com/photo-1518005020951-ecc8493664ac?w=800&q=80',
        created_at: daysAgo(0),
    },
    {
        author: 'miles_photo',
        content: 'The Northern Lights in Iceland. Standing under this dancing sky makes every hour of travel worth it. Pure cosmic energy. 🌌🇮🇸',
        image_url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&q=80',
        created_at: daysAgo(1),
    },
    {
        author: 'jane_codes',
        content: 'Neural networks are fascinating. Training a new transformer model today for sentiment analysis. The architecture is getting complex! 🧠🤖',
        image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
        created_at: daysAgo(1),
    },
    {
        author: 'tom_fitness',
        content: 'Hiking at dawn. Nature is the best gym. The air is crisp, the incline is real, and the view is the ultimate reward. Get outside! 🏔️👟',
        image_url: 'https://images.unsplash.com/photo-1551632432-c735e8399527?w=800&q=80',
        created_at: daysAgo(1),
    },
    {
        author: 'priya_writes',
        content: 'Coffee and a fresh notebook. My favorite way to start a Sunday morning. There is something magical about a blank page. ☕📝',
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
        created_at: daysAgo(1),
    },
    {
        author: 'alex_dev',
        content: 'Just deployed my first microservice to production. Zero downtime, all metrics green. The feeling is unmatched 🚀',
        image_url: '',
        created_at: daysAgo(1),
    },
    {
        author: 'sara_designs',
        content: 'Design is passion. Design is life. 🎨',
        image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
        created_at: daysAgo(2),
    },
    {
        author: 'miles_photo',
        content: 'Golden hour in Santorini. 🌅',
        image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
        created_at: daysAgo(2),
    },
];

for (const p of posts) {
    insertPost.run(userIds[p.author], p.content, p.image_url, p.created_at);
}

// ── Mock Comments, Likes, Follows ─────────────────────────────────
// (Simplified for rerunning)

const allPostIds = db.prepare('SELECT id FROM posts').all().map(r => r.id);
const allUserIds = db.prepare('SELECT id FROM users').all().map(r => r.id);

for (const pid of allPostIds) {
    // Random likes
    const shuffled = [...allUserIds].sort(() => Math.random() - 0.5);
    for (const uid of shuffled.slice(0, 3)) {
        db.prepare('INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)').run(pid, uid);
    }
}

console.log('✅ Mock data updated with images.');
db.close();
