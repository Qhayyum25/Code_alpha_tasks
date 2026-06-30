const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Helper to enrich a post with author, like count, comment count, and liked status
function enrichPost(post, userId) {
    const author = db.prepare('SELECT id, username, avatar_url FROM users WHERE id = ?').get(post.user_id);
    const likeCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(post.id).c;
    const commentCount = db.prepare('SELECT COUNT(*) as c FROM comments WHERE post_id = ?').get(post.id).c;
    const liked = db.prepare('SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, userId);
    return { ...post, author, likeCount, commentCount, liked: !!liked };
}

// GET /api/posts/feed – posts from self + followed users
router.get('/feed', authMiddleware, (req, res) => {
    const posts = db.prepare(`
    SELECT p.* FROM posts p
    WHERE p.user_id = ?
      OR p.user_id IN (SELECT following_id FROM followers WHERE follower_id = ?)
    ORDER BY p.created_at DESC
    LIMIT 50
  `).all(req.user.id, req.user.id);
    res.json(posts.map(p => enrichPost(p, req.user.id)));
});

// GET /api/posts – all posts (explore)
router.get('/', authMiddleware, (req, res) => {
    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50').all();
    res.json(posts.map(p => enrichPost(p, req.user.id)));
});

// GET /api/posts/user/:userId – posts by a specific user
router.get('/user/:userId', authMiddleware, (req, res) => {
    const posts = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(posts.map(p => enrichPost(p, req.user.id)));
});

// POST /api/posts – create post
router.post('/', authMiddleware, (req, res) => {
    const { content, image_url } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const info = db.prepare('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)').run(req.user.id, content, image_url || '');
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(enrichPost(post, req.user.id));
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, (req, res) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
});

// POST /api/posts/:id/like
router.post('/:id/like', authMiddleware, (req, res) => {
    try {
        db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id);
        const likeCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(req.params.id).c;
        res.json({ liked: true, likeCount });
    } catch {
        res.status(409).json({ error: 'Already liked' });
    }
});

// DELETE /api/posts/:id/like
router.delete('/:id/like', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.user.id);
    const likeCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(req.params.id).c;
    res.json({ liked: false, likeCount });
});

// GET /api/posts/:id/comments
router.get('/:id/comments', authMiddleware, (req, res) => {
    const comments = db.prepare(`
    SELECT c.*, u.username, u.avatar_url FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);
    res.json(comments);
});

// POST /api/posts/:id/comments
router.post('/:id/comments', authMiddleware, (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });
    const info = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)').run(req.params.id, req.user.id, content);
    const comment = db.prepare(`
    SELECT c.*, u.username, u.avatar_url FROM comments c
    JOIN users u ON u.id = c.user_id WHERE c.id = ?
  `).get(info.lastInsertRowid);
    res.status(201).json(comment);
});

// DELETE /api/comments/:id
router.delete('/comments/:id', authMiddleware, (req, res) => {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Not found' });
    if (comment.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ deleted: true });
});

module.exports = router;
