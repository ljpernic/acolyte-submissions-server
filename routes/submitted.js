// This route is separated from the others to stop it from needing the auth controller to work.
// The app.js file uses this separate route to separate it from the auth controller.

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createSubmitted } = require('../controllers/submitted');
const upload = multer({ dest: 'uploads/' });

// Ensure that 'file' matches the field name used in FormData
router.post('/', upload.single('file'), createSubmitted);

module.exports = router;