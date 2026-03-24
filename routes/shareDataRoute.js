const router = require('express').Router();
const cshareDataController = require('../controllers/shareDataController.js');

router.get('/data-to-bd-p9x9', cshareDataController.dataPage);
router.post('/add-bd-p9x9-data', cshareDataController.createPostDesi);


module.exports = router;