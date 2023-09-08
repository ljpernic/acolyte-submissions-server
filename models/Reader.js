//////// READER MODEL ////////

const mongoose = require('mongoose')                                            // Makes the mongoose package available to handle schema creation.
const bcrypt = require('bcryptjs')                                              // Makes the bcrypt package available for hashing and comparing passwords.

const ReaderSchema = new mongoose.Schema({                                      // This schema is used to add new readers. This should be internal though!
  name: {
    type: String,
    required: [true, 'Please provide a name. '],
    maxlength: 50,                                                              // 
    minlength: 1,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address. '],
    match: [                                                                    // Creates validator with regex that makes sure the email address is formatted correctly.
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email address. ',
    ],
    unique: true,                                                               // Creates a unique index based on the email address. Two readers can't have the same email.
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: [
      8,
      'Passwords must be at least eight characters in length. '
    ]
  },
  isActive: {                                                                   // This property is internal and manipulated by the reader.
    type: Boolean,
    default: true,                                                       // Sets the default value.
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,                                            //// it associates it with a reader. 
    ref: 'Role',                                                            //// This is the other model it will use as a reference. From the auth middleware?
    required: [true, 'Please provide role. '],
  },
  weekCount: {
    type: Number,
    default: 0,
    required: [true, "The count for this week isn't showing up. "],
  },
  periodCount: {
    type: Number,
    default: 0,
    required: [true, "The count for this period isn't showing up. "],
  },
  totalCount: {
    type: Number,
    default: 0,
    required: [true, "The total count for this reader isn't showing up. "],
  },
  monthCount: {
    type: String,
    default: "",
    required: [true, 'The month tracking is not working. '],
    maxlength: 10,
    minlength: 3,
  },
})

// FUNCTION TO HASH PASSWORDS //
ReaderSchema.pre('save', async function () {                                    // This function hashes passwords before the values from the schema are saved to the db. 
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// COMPARES PASSWORDS BETWEEN SUBMITTED DATA AND DOCUMENT IN THE DB //
ReaderSchema.methods.comparePassword = async function (canditatePassword) {     // Creates function called comparePassword with the methods instance using schemaName.methods.functionName.
  const isMatch = await bcrypt.compare(canditatePassword, this.password)        // Uses the compare function of the bcrypt package to compare the candidatePassword that comes with a  
  return isMatch                                                                //// request and the password from the document already saved in the database. 
}                                                                               //// Then it returns the match. 

module.exports = mongoose.model('Reader', ReaderSchema)
