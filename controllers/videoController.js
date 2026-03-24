const Post = require('../models/Post');

// All videos route
exports.dataRoute = async (req, res) => {
  const query = req.query.q;
  const categoryQuery = req.query.category;
  let allData = [];

  if(query) {
    const regex = new RegExp(query, 'i');
    allData = await Post.find({ title: { $regex: regex } });
  } else if(categoryQuery) {
    allData = await Post.find({ category: categoryQuery });
  } else {
    // নতুন 5টি উপরের দিকে
    const latestFive = await Post.find({}).sort({ createdAt: -1 }).limit(5);

    // বাকি ডাটা থেকে রেনডম সিলেক্ট
    const restData = await Post.find({ _id: { $nin: latestFive.map(d => d._id) } });
    
    // রেনডম অর্ডারিং
    restData.sort(() => Math.random() - 0.5);

    // মিলিয়ে দিচ্ছি
    allData = [...latestFive, ...restData];
  }

  // সব ক্যাটেগরি
  const categories = (await Post.find({}, { category: 1 })).map(d => d.category);

  res.render('index2', { allData, author, query, categories });
};

// Single video route with totalView + cookie logic
exports.singleData = async (req, res) => {
  try {
    const routeName = req.params.routeName.toLowerCase();

    // =========================
    // Get cookie
    // =========================
    let viewedRoutes = req.cookies.viewedRoutes || [];
    if (!Array.isArray(viewedRoutes)) viewedRoutes = [];

    // =========================
    // Find video
    // =========================
    const video = await Post.findOne({ routeName });
    const allData = await Post.find({});

    if (!video) return res.status(404).send('Video not found');

    // =========================
    // TIME & DATE CONVERT LOGIC
    // =========================
    let isoTime = null;
    let formattedDate = null;

    // ---- Duration → ISO (PT1M9S)
    if (video.duration) {
      // ধরলাম duration = "01:09"
      const timeStr = video.duration;
      const parts = timeStr.split(':');

      const minutes = Number(parts[0]) || 0;
      const seconds = Number(parts[1]) || 0;

      isoTime = `PT${minutes}M${seconds}S`;
    }

    // ---- createdAt → YYYY-MM-DD
    if (video.createdAt) {
      const dateObj = new Date(video.createdAt);

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');

      formattedDate = `${year}-${month}-${day}`;
    }

    // =========================
    // View count logic
    // =========================
    if (!viewedRoutes.includes(routeName)) {
      const updatedVideo = await Post.findOneAndUpdate(
        { routeName },
        { $inc: { totalView: 1 } },
        { new: true }
      );

      // Update cookie
      viewedRoutes.push(routeName);
      res.cookie('viewedRoutes', viewedRoutes, {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true
      });

      return res.render('videos/video', {
        oneData: updatedVideo,
        allData,
        isoTime,
        formattedDate
      });
    }

    // =========================
    // Already viewed
    // =========================
    res.render('videos/video', {
      oneData: video,
      allData,
      isoTime,
      formattedDate
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};