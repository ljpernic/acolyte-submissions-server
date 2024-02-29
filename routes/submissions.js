// Routes that connect the controller functions to api in app.js that requires the auth controller! 
// The function to create submissions is outside of that authentication, so it has its own route, not requiring the auth controller.

const express = require('express')
const router = express.Router()                                                               // Sets up the router.

const {                                                                                       // Imports controllers defined by controllers/submissions.js.
  getAllSubmissionsStatic,
  getAllSubmissions,
  getSubmission,
  updateSubmission,
  updateReader,                                                                           // Paired with verarbeiten functionality
  deleteSubmission,
} = require('../controllers/submissions')


router.route('/').get(getAllSubmissions)                                                      // the '/' is effectively the root path when it's called in app.js, i.e.,
router.route('/static').get(getAllSubmissionsStatic)                                          //// api/v1/submissions/, with /static being added onto it for this method.
router.route('/:id').get(getSubmission).patch(updateSubmission).delete(deleteSubmission)      //// Basically, these assign controller functions imported from 
router.route('/claim/:id').get(getSubmission).patch(updateReader)                             //// and use the given controller inside the given route.
router.route('/unclaim/:id').get(getSubmission).patch(updateReader)                             //// and use the given controller inside the given route.

module.exports = router                                                                       // Makes the router available for other files.