const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  routeName: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageLink: { type: String, required: true },
  videoLink: { type: String, required: true },
  totalView: { type: Number, default: 0 },
  duration: { type: String, default: 0 },
  category: { type: [String], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);