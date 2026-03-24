const router = require('express').Router();
const c = require('../controllers/videoController.js');

// Video listing route
router.get('/', c.dataRoute);

// Single video route
router.get('/:routeName', c.singleData);


module.exports = router;