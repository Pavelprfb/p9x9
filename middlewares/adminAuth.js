const Admin = require('../models/Admin');

module.exports = async (req, res, next) => {
  const adminId = req.cookies.adminAuth;

  if (!adminId) {
    return res.redirect('/admin');
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    res.clearCookie('adminAuth');
    return res.redirect('/admin');
  }

  req.admin = admin;
  next();
};