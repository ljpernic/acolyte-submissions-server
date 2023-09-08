const express = require('express')                              // Makes the express functionality availability to set up the router.
const router = express.Router()                                 // Makes the router functionality within express available and set to 'router'.

const {                                                         // Makes the functions delegate and login available from controllers/auth.js.
    delegate, 
    login,
        } = require('../controllers/auth')

router.post('/delegate', delegate)                           // Lets us assign the post methods that invoke the controller function delegate.
router.post('/login', login)                                    // Lets us assign the post methods that invoke the controller function delegate.

module.exports = router                                         // Makes the router available everywhere.
