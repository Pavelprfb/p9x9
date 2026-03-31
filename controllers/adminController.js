const Post = require('../models/Post');
const Admin = require('../models/Admin');

/* =======================
   POST MANAGEMENT (UNCHANGED)
======================= */

exports.addPage = (req,res)=>{
  res.render('admin/add');
};

exports.createPost = async (req, res) => {
  const data = req.body;

  if (data.routeName) {
    data.routeName = data.routeName.toLowerCase();
  }

  if (data.category) {
    data.category = data.category.split(',').map(c => c.trim());
  }

  await Post.create(data);
  res.redirect('/admin/update');
};



exports.listPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // প্রতি page এ কয়টা post
    const skip = (page - 1) * limit;

    const query = req.query.q || '';

    let filter = {};
    if (query) {
      filter.title = { $regex: query, $options: 'i' };
    }

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    const posts = await Post.find(filter)
      
      .sort({ _id: -1 });

    res.render('admin/list', {
      posts,
      currentPage: page,
      totalPages,
      query
    });

  } catch (err) {
    console.error(err);
    res.render('admin/list', {
      posts: [],
      currentPage: 1,
      totalPages: 1,
      query: ''
    });
  }
};

exports.editPage = async (req,res)=>{
  const post = await Post.findById(req.params.id);
  res.render('admin/update', { post });
};

exports.updatePost = async (req,res)=>{
  const data = req.body;
  data.category = data.category.split(',');
  await Post.findByIdAndUpdate(req.params.id, data);
  res.redirect('/admin/update');
};

exports.updateView = async (req, res) => {
  try {
    const { routeName } = req.body;

    if (!routeName) {
      return res.status(400).json({
        success: false,
        message: 'routeName is required'
      });
    }

    const updated = await Post.findOneAndUpdate(
      { routeName: routeName.toLowerCase() },
      { $inc: { totalView: 1 } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      totalView: updated.totalView
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/* =======================
   ADMIN AUTH
======================= */

// 👉 Login Page
exports.adminLoginPage = (req, res) => {
  res.render('admin/login', {
    error: null
  });
};

// 👉 Login Post
exports.adminLoginPost = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin || admin.password !== password) {
      return res.render('admin/login', {
        error: 'Username or Password is incorrect.'
      });
    }

    res.cookie('adminAuth', admin._id.toString(), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.redirect('/admin/dashboard');

  } catch (err) {
    console.log(err);
    res.send('Server Error');
  }
};

// 👉 Dashboard
exports.adminDashboardGet = (req, res) => {
  res.render('admin/dashboard', {
    admin: req.admin
  });
};

// 👉 Logout
exports.adminLogout = (req, res) => {
  res.clearCookie('adminAuth');
  res.redirect('/admin');
};

exports.dataDelete = async (req,res)=>{
  const allData = await Post.find({}).sort({ _id: -1 });
  res.render('admin/delete', {allData});
};

exports.dataDeletePost = async (req, res) => {
  try {
    const { routeName } = req.body;

    if (!routeName) {
      return res.status(400).send("Route name is required");
    }

    // Check if post exists
    const post = await Post.findOne({ routeName });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Delete the post
    await Post.findOneAndDelete({ routeName });

    res.redirect('/admin/delete');

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).send("Something went wrong");
  }
};

exports.linksP9X9 = async (req,res)=>{
  const myAllData = await Post.find({});
  res.render('admin/linksP9X9', {myAllData});
};