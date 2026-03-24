const Post = require('../models/Post');

exports.generateSitemap = async (req, res) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 });

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Home page
    xml += `  <url>\n`;
    xml += `    <loc>https://p9x9.com</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;
    
    
    xml += `  <url>\n`;
    xml += `    <loc>https://p9x9.com/terms</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;
    
    xml += `  <url>\n`;
    xml += `    <loc>https://p9x9.com/privacy</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;
    
    // Video pages
    posts.forEach(post => {
      xml += `  <url>\n`;
      xml += `    <loc>https://p9x9.com/videos/${encodeURIComponent(post.routeName)}</loc>\n`;
      xml += `    <lastmod>${post.updatedAt.toISOString()}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`; // <-- সব daily
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};