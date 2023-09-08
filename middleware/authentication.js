//////// AUTHENTICATES THE READER AND LETS THE ELEMENTS INSIDE THE TOKEN BE USED SERVER-SIDE //////

const jwt = require('jsonwebtoken')                                   // Makes json web token functionality available.
const { UnauthenticatedError } = require('../errors')                 // Makes the unauthenticated error available.

//////// THIS FUNCTION VERIFIES THE TOKEN FROM THE BROWSER //////// 
const authReader = async (req, res, next) => {
  
  // CHECKS HEADER FOR TOKEN //
  const authHeader = req.headers.authorization                        // Sets the const authHeader to whatever is in req.headers.authorization.
  if (!authHeader || !authHeader.startsWith('X-auth-token')) {        // If there is nothing there or if it doesn't start with 'Bearer',
    throw new UnauthenticatedError('Authentication invalid. ')        //// it throws an error. Does 'Bearer' need a space after?
  }
  const token = authHeader.split(' ')[1]                              //// Otherwise, it splits out the token (which should have 'Bearer' before it) at the empty space.
//  console.log(`authReader function, middleware/authentication.js, authHeader: ` + authHeader)     //  console.log(`server-side token: ` + JSON.stringify(token))            // This shows the clean token after the split.
                                                                      //// It does this by creating an array using authHeader.split and getting the second ([1]) value.
  try {                                                               //// Then it creates the payload that will include the token processed with the hash key in the .env file 
    const payload = jwt.verify(token, process.env.JWT_SECRET)         //// using the jwt.verify method.
//    console.log(`authReader function, middleware/authentication.js, payload: ` + JSON.stringify(payload))

// MAKES THIS DATA AVAILABLE FOR THE SUBMISSIONS ROUTE/CONTROLLER //
    req.reader = { 
      readerId: payload.readerId, 
      name: payload.name,
      role: payload.role,
    }  
//    console.log(`authReader function, middleware/authentication.js, req.reader: ` + JSON.stringify(req.reader))
    next()                                                            //// Essentially, this is just getting the payload and passing in the matching readerId based on 
  } catch (error) {                                                   //// the schema provided by models/Readers.js. 
    throw new UnauthenticatedError('Authentication invalid. ')        //// And if it isn't the right payload, it throws an error.
  }
}

module.exports = authReader

////// Note: the payload reader can also be found using .select. Look at the tutorials for how. //////

// What's supposed to happen? After you log in, it loads a specific dashboard based on your role. 
// Submissions does this already--it loads specific submission based on readerId.
// Let's just copy that functionality?

// Maybe a "getDashboard" function that mirrors getSubmissions?

// and an api that uses the middleware/authenticate in the app.js to make the role available.
// Then the frontend can look for role instead of reader. 