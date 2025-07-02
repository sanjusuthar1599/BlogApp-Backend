
const Post = require("../models/Post");

const createPost = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user?.id;
   const image = req.file?.filename; 

  // 🛡️ Validation
  if (!image) {
  return res.status(400).json({ message: "Image is required" });
}
  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  if (title.trim().length < 3) {
    return res.status(400).json({ message: "Title must be at least 3 characters" });
  }

  if (content.trim().length < 10) {
    return res.status(400).json({ message: "Content must be at least 10 characters" });
  }
2   
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Missing user ID" });
  }
  

    try {
    const post = await Post.create({
      title,
      content,
      author: userId,
      image: image || null,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "name email");
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const getBlogById = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id }).populate("author", "name email");
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};



const updatePost = async (req, res) => {
  const { id } = req.params;
const { title, content } = req.body;
const image = req.file?.filename;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  try {
    const updateData = { title, content };
    if (image) {
      updateData.image = image; 
    }

    const post = await Post.findByIdAndUpdate(id, updateData, { new: true });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server error" });
  }
};




const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Not authorized to delete this post." });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createPost,
  getPosts,
  getBlogById,
  updatePost,
  deletePost,
};
