// This route is separated from the others to stop it from needing the auth controller to work.
// The app.js file uses this separate route to separate it from the auth controller.

const express = require('express')
const router = express.Router()                                                               // Sets up the router.

const {                                                                                       // Imports controllers defined by controllers/submissions.js.
  createSubmitted,
} = require('../controllers/submitted')

router.route('/').post(createSubmitted)                               // the '/' is effectively the root path when it's called in app.js, i.e.,
                                                                                              //// controllers/submissions.js to the routes defined in app.js ('/'), 
                                                                                              //// and use the given controller inside the given route.

module.exports = router                                                                       // Makes the router available for other files.