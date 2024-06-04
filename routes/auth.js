const express = require('express')                              // Makes the express functionality availability to set up the router.
const router = express.Router()                                 // Makes the router functionality within express available and set to 'router'.

// Makes the functions delegate and login available from controllers/auth.js.
const {
    delegate, 
    login,
    passwordChange,
        } = require('../controllers/auth')

// Lets us assign the post methods that invoke the controller function delegate.
router.post('/delegate', delegate)                           
router.post('/login', login)
router.post('/change-password', passwordChange);

module.exports = router                                         // Makes the router available everywhere.
