//////// SERVER-SIDE FUNCTIONS FOR REGISTERING NEW USERS AND LOGGING IN //////

const Reader = require('../models/Reader.js')                                           // Makes the schema and functions defined in /models/Reader available in const Reader.
const { StatusCodes } = require('http-status-codes')                                    // Makes easy status codes from http-status-code package available.
const { BadRequestError, UnauthenticatedError } = require('../errors')                  // Makes these extra errors available.
const jwt = require('jsonwebtoken')                                                     // Makes jwt package available for creating json web tokens. 

// REGISTRATION FUNCTION  -- SHOULD ONLY BE AVAILABLE TO TOP LEVEL EDITOR // 
const delegate = async (req, res) => {
  try {
    const reader = await Reader.create({ ...req.body });
    const newEmail = reader.email;
    const readerExists = await Reader.findOne({ newEmail });

    if (readerExists) {
      return res.status(StatusCodes.CONFLICT).json({
        error: 'A reader already exists with those credentials.',
      });
    }

    return res.status(StatusCodes.CREATED).json({
      reader: { name: reader.name },
    });
  } catch (error) {
    console.error(error);

    if (error.name === 'MongoError' && error.code === 11000) {
      // Duplicate key error (unique constraint violation)
      return res.status(StatusCodes.CONFLICT).json({
        error: 'A reader already exists with those credentials.',
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error',
    });
  }
};
//
//
//
//
//
//
// LOGIN FUNCTION -- SHOULD BE AVAILABLE TO ALL EDITORS AND READERS //
const login = async (req, res) => {                                                     // Function that creates 'email' and 'password' constants with the data
  const { email, password } = req.body                                                  //// passed in from req.body.
  if (!email || !password) {                                                            // If there's no email or password, 
    throw new BadRequestError('Please provide an email and password! ')                 //// it throws an error. 
  }
  const reader = await Reader.findOne({ email })                                        // Otherwise, it looks for the reader that already has the given email.
 
 if (!reader) {                                                                        //// And if there isn't one, it throws an error saying the reader wasn't found.
    throw new UnauthenticatedError('Reader not found. ')
  }
  const isPasswordCorrect = await reader.comparePassword(password)                      // Uses comparePassword function in models/Readers.js to check the password.
  if (!isPasswordCorrect) {                                                             //// If the password is not correct, 
    throw new UnauthenticatedError('Invalid password. ')                                //// it throws an error.
  }
  const token = jwt.sign(                                                               //// This function is for creating web tokens.
    { 
      readerId: reader._id, 
      name: reader.name,
      role: reader.role 
    },                                                                                  //// using reader.something to refer to the id and keypair values in the given document,
      process.env.JWT_SECRET,                                                           //// mixing those values with the token key given in the hidden .env file.
    {
      expiresIn: '7d',                                              //// It also provides an expiration period based on what's in the .env file. 
    }
  )
                                                                                      //// creates a unique JWT token based on that reader data and
  res.status(StatusCodes.OK).json({ reader: { name: reader.name, readerId: reader._id}, token })            //// responds with a statuscode based on reader/token data, the reader name and the token.
}                                                                                      
//
//
//
//
const changePassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Find the reader with the provided email
    const reader = await Reader.findOne({ email });

    // If the reader doesn't exist, return an error
    if (!reader) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: 'Reader not found.' });
    }

    // Verify the current password
    const isPasswordCorrect = await reader.comparePassword(currentPassword);

    // If the current password is incorrect, return an error
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: 'Incorrect current password.' });
    }

    // Update the password with the new one
    reader.password = newPassword;
    await reader.save();

    // Respond with a success message
    return res.status(StatusCodes.OK).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
  }
};
//
//
//
//
module.exports = { 
  delegate,
  login,
  changePassword,
}
