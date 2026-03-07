const express = require('express');
const { Post, User } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function sanitizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function findPostWithAuthor(postId) {
  return Post.findByPk(postId, {
    include: [
      {
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'email'],
      },
    ],
  });
}

router.get('/', async (req, res) => {
  try {
    const where = {};

    if (req.query.category) {
      where.category = sanitizeText(req.query.category);
    }

    const posts = await Post.findAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load posts.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const posts = await Post.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
    });

    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load your posts.' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const title = sanitizeText(req.body.title);
    const content = sanitizeText(req.body.content);
    const category = sanitizeText(req.body.category).toLowerCase();

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required.' });
    }

    const post = await Post.create({
      title,
      content,
      category,
      userId: req.user.id,
    });

    const createdPost = await findPostWithAuthor(post.id);

    return res.status(201).json(createdPost);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create post.' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const title = sanitizeText(req.body.title);
    const content = sanitizeText(req.body.content);
    const category = sanitizeText(req.body.category).toLowerCase();
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Only the author can update this post.' });
    }

    await post.update({
      title: title || post.title,
      content: content || post.content,
      category: category || post.category,
    });

    const updatedPost = await findPostWithAuthor(post.id);

    return res.json(updatedPost);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update post.' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ message: 'Only the author can delete this post.' });
    }

    await post.destroy();

    return res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete post.' });
  }
});

module.exports = router;
