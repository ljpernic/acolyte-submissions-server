//////// AUTHENTICATES THE READER AND LETS THE ELEMENTS INSIDE THE TOKEN BE USED SERVER-SIDE //////

const jwt = require('jsonwebtoken')                                   // Makes json web token functionality available.
const { UnauthenticatedError } = require('../errors')                 // Makes the unauthenticated error available.

//////// THIS FUNCTION VERIFIES THE TOKEN FROM THE BROWSER //////// 
const authReader = async (req, res, next) => {
  
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ error: 'Authentication invalid.' });
  }

  const token = authHeader.split(' ')[1] 

  try { 
    const payload = jwt.verify(token, process.env.JWT_SECRET)  

    req.reader = { 
      readerId: payload.readerId, 
      name: payload.name,
      role: payload.role,
    }  
//  
    next()   
  } catch (error) { 
    if (error instanceof jwt.TokenExpiredError) {
      // Handle token expiration
      return res.status(401).json({ message: 'Token has expired. Please log in again.' });
    }  
    return res.status(401).json({ error: 'Authentication invalid.' });
  }
}

module.exports = authReader

