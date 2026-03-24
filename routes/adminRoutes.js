const router = require('express').Router();
const c = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

/* 🔓 PUBLIC ROUTES */
router.get('/', c.adminLoginPage);
router.post('/', c.adminLoginPost);

/* 🔒 PROTECTED ROUTES (cookie check হবে) */
router.get('/dashboard', adminAuth, c.adminDashboardGet);

router.get('/add', adminAuth, c.addPage);
router.post('/add', adminAuth, c.createPost);

router.get('/update', adminAuth, c.listPage);
router.get('/update/:id', adminAuth, c.editPage);
router.post('/update/:id', adminAuth, c.updatePost);

router.post('/view/update', adminAuth, c.updateView);

router.get('/logout', adminAuth, c.adminLogout);
router.get('/delete', adminAuth, c.dataDelete);
router.post('/delete', adminAuth, c.dataDeletePost);
router.get('/p9x9-to-links_p9x9', adminAuth, c.linksP9X9);

module.exports = router;