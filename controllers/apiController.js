const Post = require('../models/Post');

exports.allData = async (req,res)=>{
  const data = await Post.find();
  res.json(data);
};

exports.singleData = async (req,res)=>{
  const data = await Post.findById(req.params.id);
  res.json(data);
};


