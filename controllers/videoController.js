const Post = require('../models/Post');

// All videos route
exports.dataRoute = async (req, res) => {
  
  try {
    const query = req.query.q;
    const categoryQuery = req.query.category;

    const limit = 20;
    const page = 1;

    let allData = [];

    if (query) {
      // ✅ safe regex
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeQuery, "i");

      allData = await Post.find({ title: { $regex: regex } })
        .sort({ _id: -1 }) // 🔥 newest first fix
        .limit(limit)
        .lean();

    } else if (categoryQuery) {

      allData = await Post.find({ category: categoryQuery })
        .sort({ _id: -1 }) // 🔥 newest first fix
        .limit(limit)
        .lean();

    } else {
      // ✅ latest 5 (FIXED)
      const latestFive = await Post.find({})
        .sort({ _id: -1 }) // 🔥 createdAt issue fix
        .limit(5)
        .lean();

      // ✅ random rest (optimized)
      const restData = await Post.aggregate([
        {
          $match: {
            _id: { $nin: latestFive.map(d => d._id) }
          }
        },
        { $sample: { size: limit } }
      ]);

      // ✅ merge + limit
      allData = [...latestFive, ...restData].slice(0, limit);
    }

    // ✅ safe date format
    allData.forEach(p => {
      if (p.createdAt) {
        p.formattedDate = new Date(p.createdAt).toLocaleDateString();
      } else {
        p.formattedDate = "";
      }
    });

    // ✅ category optimize (no duplicate)
    const categories = await Post.distinct("category");

    res.render("index", {
      allData,
      author: "P9X9",
      query,
      categories
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Single video route with totalView + cookie logic
exports.singleData = async (req, res) => {
  try {
    const routeName = req.params.routeName.toLowerCase();

    let viewedRoutes = req.cookies.viewedRoutes || [];
    if (!Array.isArray(viewedRoutes)) viewedRoutes = [];

    // ✅ only required fields (VERY IMPORTANT)
    const video = await Post.findOne({ routeName })
      .select("title description imageLink videoLink duration totalView createdAt category routeName")
      .lean();

    if (!video) return res.status(404).send('Video not found');

    // ❌ REMOVE: allData = await Post.find({});

    // 👉 instead lightweight suggested query
    const suggested = await Post.find(
      { routeName: { $ne: routeName } }
    )
    .select("title imageLink duration totalView routeName category createdAt")
    .sort({ _id: -1 })
    .limit(30)
    .lean();

    // ================= TIME FORMAT =================
    let isoTime = null;
    let formattedDate = null;

    if (video.duration) {
      const parts = video.duration.split(':');
      const m = Number(parts[0]) || 0;
      const s = Number(parts[1]) || 0;
      isoTime = `PT${m}M${s}S`;
    }

    if (video.createdAt) {
      const d = new Date(video.createdAt);
      formattedDate = d.toISOString().split('T')[0];
    }

    // ================= VIEW COUNT =================
    let updatedVideo = video;

    if (!viewedRoutes.includes(routeName)) {
      updatedVideo = await Post.findOneAndUpdate(
        { routeName },
        { $inc: { totalView: 1 } },
        { new: true }
      ).lean();

      viewedRoutes.push(routeName);
      res.cookie('viewedRoutes', viewedRoutes, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true
      });
    }

    res.render('videos/video', {
      oneData: updatedVideo,
      suggested,
      isoTime,
      formattedDate
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};