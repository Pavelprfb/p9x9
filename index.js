require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cors = require("cors");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 }); // 60 sec cache
const Post = require('./models/Post');
const cookieParser = require('cookie-parser');
const setUrlMiddleware = require('./middleware');
const sitemapController = require('./controllers/sitemapController.js');
const videoSitemapController = require('./controllers/videoSitemapController.js');

const app = express();
app.use(cors())

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(cookieParser());
app.use(setUrlMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/admin', require('./routes/adminRoutes'));
app.use('/data', require('./routes/apiRoutes'));
app.use('/videos', require('./routes/videoRoutes'));
app.use('/api', require('./routes/shareDataRoute'));

// Homepage
app.get("/", async (req, res) => {
  try {
    const cacheKey = "homepage";
    if (cache.has(cacheKey)) {
      return res.render("index", cache.get(cacheKey));
    }

    const query = req.query.q;
    const categoryQuery = req.query.category;
    const limit = 20;

    let allData = [];

    if (query) {
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(safeQuery, "i");

      allData = await Post.find({ title: { $regex: regex } })
        .sort({ _id: -1 })
        .limit(limit)
        .lean();

    } else if (categoryQuery) {

      allData = await Post.find({ category: categoryQuery })
        .sort({ _id: -1 })
        .limit(limit)
        .lean();

    } else {

      const latestFive = await Post.find({})
        .sort({ _id: -1 })
        .limit(10)
        .lean();

      const restData = await Post.aggregate([
        { $match: { _id: { $nin: latestFive.map(d => d._id) } } },
        { $sample: { size: limit } }
      ]);

      allData = [...latestFive, ...restData].slice(0, limit);
    }

    allData.forEach(p => {
      p.formattedDate = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString()
        : "";
    });

    // ✅ categories cache
    let categories = cache.get("categories");
    if (!categories) {
      categories = await Post.distinct("category");
      cache.set("categories", categories, 600);
    }

    const data = {
      allData,
      author: "P9X9",
      query,
      categories
    };

    cache.set(cacheKey, data);

    res.render("index", data);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// API for AJAX pagination

// API endpoint for AJAX pagination
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const cacheKey = `posts_${page}`;
    if (cache.has(cacheKey)) {
      return res.json(cache.get(cacheKey));
    }

    const data = await Post.find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    data.forEach(p => {
      p.formattedDate = new Date(p.createdAt).toLocaleDateString();
    });

    cache.set(cacheKey, data, 60);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});


app.get('/terms', (req, res) => {
    res.render('partials/terms');
});
app.get('/privacy', (req, res) => {
    res.render('partials/privacy');
});

// Dynamic Paginated Video Sitemap
// Example usage: /sitemap.xml?page=1
app.get('/sitemap.xml', sitemapController.generateSitemap);
app.get('/sitemap2.xml', videoSitemapController.generateVideoSitemap);



app.get("/download", (req, res) => {
  const fileUrl = req.query.url;

  const fileName = "image.jpg";

  fetch(fileUrl)
    .then(r => r.arrayBuffer())
    .then(buffer => {
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "image/jpeg");

      res.send(Buffer.from(buffer));
    });
});

// 404 page
app.use((req, res) => {
  res.status(404).render("404");
});

// Start server
app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log(`Server running on ${process.env.PORT}`);
});