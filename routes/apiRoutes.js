const router = require('express').Router();
const c = require('../controllers/apiController');

router.get('/all', c.allData);
router.get('/videos/:id', c.singleData);

module.exports = router;