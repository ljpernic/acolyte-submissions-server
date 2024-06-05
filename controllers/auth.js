//////// SERVER-SIDE FUNCTIONS FOR REGISTERING NEW USERS AND LOGGING IN //////

const Reader = require('../models/Reader.js')                                           // Makes the schema and functions defined in /models/Reader available in const Reader.
const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes')                                    // Makes easy status codes from http-status-code package available.
const { BadRequestError, UnauthenticatedError } = require('../errors')                  // Makes these extra errors available.
const jwt = require('jsonwebtoken')                                                     // Makes jwt package available for creating json web tokens. 

// REGISTRATION FUNCTION  -- SHOULD ONLY BE AVAILABLE TO TOP LEVEL EDITOR // 
const addReader = async (req, res) => {
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
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError('Please provide an email and password!');
    }

    const reader = await Reader.findOne({ email });
    if (!reader) {
      throw new UnauthenticatedError('Reader not found.');
    }

    const isPasswordCorrect = await reader.comparePassword(password);

    if (!isPasswordCorrect) {
      console.log('Password comparison failed');
      throw new UnauthenticatedError('Invalid password.');
    }

    // If the password is correct, proceed to generate and send the JWT token
    const token = jwt.sign(
      { 
        readerId: reader._id, 
        name: reader.name,
        role: reader.role 
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    );

    res.status(StatusCodes.OK).json({ reader: { name: reader.name, readerId: reader._id }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Please check the login details and try again.' });
  }
};                                                                                      
//
//
//
//
const passwordChange = async (req, res) => {
  try {
    const { email: loggedInEmail, password: loggedInPassword, newPassword } = req.body;
    // Validate inputs
    if (!loggedInEmail || !loggedInPassword || !newPassword) {
      throw new BadRequestError('All fields are required!');
    }

    // Find the logged-in user with the provided email
    const loggedInReader = await Reader.findOne({ _id: req.reader.readerId });
    if (!loggedInReader) {
      throw new UnauthenticatedError('Reader not found.');
    }

    if (req.body.email !== loggedInReader.email) {
      // If the email addresses don't match, it means someone is trying to change another user's password
      console.log("Reader-submitted email does in fact DOES NOT equal email of loggedin reader")
      throw new UnauthenticatedError('Unauthorized attempt to change password.');
    }

    // Verify the password of the logged-in user
    const isPasswordCorrect = await loggedInReader.comparePassword(loggedInPassword);
    if (!isPasswordCorrect) {
      throw new UnauthenticatedError('The details are not correct.');
    }

    console.log("Reader-submitted email does in fact equal email of loggedin reader")

    // Change the password for the logged-in user
    loggedInReader.password = newPassword;
    await loggedInReader.save();

    // Respond with success message
    return res.status(StatusCodes.OK).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Internal Server Error:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Please check the password and email details and try again.' });
  }
};
//
//
//
//
module.exports = { 
  addReader,
  login,
  passwordChange,
}
