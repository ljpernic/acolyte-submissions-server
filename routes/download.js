// Routes that connect the controller functions to api in app.js that requires the auth controller! 

const express = require('express')
const router = express.Router()                                                               // Sets up the router.

const {                                                                                       // Imports controllers defined by controllers/submissions.js.
  downloadSubmission,
} = require('../controllers/download')

router.route('/:id').get(downloadSubmission)

module.exports = router                                                                       // Makes the router available for other files.