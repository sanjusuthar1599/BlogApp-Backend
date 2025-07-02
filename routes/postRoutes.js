
const express = require('express');
const router = express.Router();
const upload = require ('../middlewares/upload')
const { createPost, getPosts, getBlogById, updatePost, deletePost } = require('../controllers/postController');

// Create a new post
router.post('/', upload.single("image"), createPost);

// Get all posts
router.get('/', getPosts);

// Get single post by ID
router.get('/:id', getBlogById);

// Update post by ID
router.put('/:id', upload.single("image"), updatePost);

// Delete post by ID
router.delete('/:id', deletePost);

module.exports = router;