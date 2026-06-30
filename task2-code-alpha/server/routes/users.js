const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// GET /api/users/:id – public profile
router.get('/:id', authMiddleware, (req, res) => {
    const user = db.prepare(
        'SELECT id, username, bio, avatar_url, created_at FROM users WHERE id = ?'
    ).get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(req.params.id).c;
    const followerCount = db.prepare('SELECT COUNT(*) as c FROM followers WHERE following_id = ?').get(req.params.id).c;
    const followingCount = db.prepare('SELECT COUNT(*) as c FROM followers WHERE follower_id = ?').get(req.params.id).c;
    const isFollowing = db.prepare('SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?').get(req.user.id, req.params.id);

    res.json({ ...user, postCount, followerCount, followingCount, isFollowing: !!isFollowing });
});

// PUT /api/users/:id – update profile
router.put('/:id', authMiddleware, (req, res) => {
    if (parseInt(req.params.id) !== req.user.id)
        return res.status(403).json({ error: 'Forbidden' });

    const { bio, avatar_url } = req.body;
    db.prepare('UPDATE users SET bio = COALESCE(?, bio), avatar_url = COALESCE(?, avatar_url) WHERE id = ?')
        .run(bio || null, avatar_url || null, req.user.id);

    const user = db.prepare('SELECT id, username, bio, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
});

// GET /api/users/:id/followers
router.get('/:id/followers', authMiddleware, (req, res) => {
    const rows = db.prepare(`
    SELECT u.id, u.username, u.avatar_url FROM followers f
    JOIN users u ON u.id = f.follower_id
    WHERE f.following_id = ?
  `).all(req.params.id);
    res.json(rows);
});

// GET /api/users/:id/following
router.get('/:id/following', authMiddleware, (req, res) => {
    const rows = db.prepare(`
    SELECT u.id, u.username, u.avatar_url FROM followers f
    JOIN users u ON u.id = f.following_id
    WHERE f.follower_id = ?
  `).all(req.params.id);
    res.json(rows);
});

// POST /api/users/:id/follow
router.post('/:id/follow', authMiddleware, (req, res) => {
    const targetId = parseInt(req.params.id);
    if (targetId === req.user.id) return res.status(400).json({ error: "Can't follow yourself" });
    try {
        db.prepare('INSERT INTO followers (follower_id, following_id) VALUES (?, ?)').run(req.user.id, targetId);
        res.json({ following: true });
    } catch {
        res.status(409).json({ error: 'Already following' });
    }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run(req.user.id, req.params.id);
    res.json({ following: false });
});

// GET /api/users/search?q=...
router.get('/', authMiddleware, (req, res) => {
    const q = `%${req.query.q || ''}%`;
    const rows = db.prepare('SELECT id, username, avatar_url, bio FROM users WHERE username LIKE ? LIMIT 20').all(q);
    res.json(rows);
});

module.exports = router;
