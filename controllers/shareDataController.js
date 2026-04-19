const Post = require('../models/Post');
const axios = require('axios');

exports.dataPage = async (req, res) => {
  try {
    const allData = await Post.find({}).sort({ _id: -1 });

    // 🔥 Cache disable
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.render("allData", { allData });
  } catch (err) {
    res.send("Server Error");
  }
};

exports.createPostDesi = async (req, res) => {
  try {
    const data = req.body;

    // title lowercase করে check করলে safer হবে (optional)
    if (data.title) {
      data.title = data.title.toLowerCase();
    }

    // category কে array তে রূপান্তর
    if (data.category) {
      data.category = data.category.split(',').map(c => c.trim());
    }

    // Check যদি title database এ থাকে
    const existingPost = await Post.findOne({ title: data.title });

    if (existingPost) {
      // যদি থাকে, বাকি data update করো
      Object.keys(data).forEach(key => {
        if (key !== 'title') { // title change করা যাবে না
          existingPost[key] = data[key];
        }
      });
      await existingPost.save();
    } else {
      // না থাকলে create করো
      await Post.create(data);
    }

    res.redirect('/admin/update');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};