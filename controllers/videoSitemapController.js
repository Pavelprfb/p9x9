// controllers/sitemapController.js
const Post = require('../models/Post');

exports.generateVideoSitemap = async (req, res) => {
  try {
    const posts = await Post.find({});

    res.header('Content-Type', 'application/xml');

    // 🔒 XML Escape Function
    const escapeXml = (unsafe) => {
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    // 🔒 Safe CDATA (prevents breaking if ]] > exists)
    const safeCdata = (text) => {
      return String(text).replace(/]]>/g, "]]]]><![CDATA[>");
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" `;
    xml += `xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

    posts.forEach(post => {

      const safeLoc = escapeXml(
        encodeURI(`https://p9x9.com/videos/${post.routeName}`)
      );

      const safeLastMod = post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : new Date().toISOString();

      const safeDuration = Number(post.duration) || 0;

      xml += `  <url>\n`;
      xml += `    <loc>${safeLoc}</loc>\n`;
      xml += `    <lastmod>${safeLastMod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `    <video:video>\n`;
      xml += `      <video:thumbnail_loc><![CDATA[${safeCdata(post.imageLink || "")}]]></video:thumbnail_loc>\n`;
      xml += `      <video:title><![CDATA[${safeCdata(post.title || "")}]]></video:title>\n`;
      xml += `      <video:description><![CDATA[${safeCdata(post.description || "")}]]></video:description>\n`;
      xml += `      <video:content_loc><![CDATA[${safeCdata(post.videoLink || "")}]]></video:content_loc>\n`;
      xml += `    </video:video>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.send(xml);

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};