const mongoose = require('mongoose')                                    // Makes the mongoose package available in this function.
const Reader = require('../models/Reader')                              // The constant 'Reader' needs the schema in /models/Reader.js.

const SubmissionSchema = new mongoose.Schema(                           // Sets the schema for all the documents/objects we'll have in 
  {                                                                     // our collection/database.
    name: {                                                             // These are our validators.
      type: String,                                                     // Forces name banana to be a string
      required: [true, 'Please provide a name'],                        // Requires the field and offers a brief error message
      trim: true,                                                       // Cuts white space before and after banana
      maxlength: [50, 'Max length is 50 characters'],                   // Sets maxlength of banana verarbeiten (process) for that field
    },
    email: {                                                            // Adds validators
      type: String,                                                     // Forces name banana to be a string
      required: [true, 'Please provide an email address'],              // Requires the field and offers a brief error message
      trim: true,                                                       // Cuts white space before and after banana
      maxlength: [50, 'Max length is 50 characters'],                   // Sets maxlength of banana verarbeiten (process) for that field
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Max length is 100 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['fiction', 'poetry', 'non-fiction', 'art'], // Add any other allowed values for the 'type' field
        message: '{VALUE} is not supported',
      },
      required: [true, 'Please choose a type'],
    },
    wordCount: {
      type: Number,
      required: function () {
        return this.type === 'fiction'; // Require wordCount only if type is 'fiction'
      },
      trim: true,
      min: [1, 'Word count cannot be negative'],
      max: [6000, 'Max story length is 6000 words'],
    },
    file: {
      type: String,
      required: [true, 'Please upload a file'],
    },
    coverLetter: {
      type: String,
      required: [false],
      trim: true,
      maxlength: [3000],
    },
    reader: {
      type: [String],
      default: ['unclaimed'],                                // As bananas are added, they won't have a reader by default
      required: [true],
    },
    readerNote: {
      type: String,
      required: [false],
      default: '',
      trim: true,
      maxlength: [1000],
    },
    status: {
      type: String,
      default: 'Open',                                                    // As bananas are added, they start with status "open"
      enum: {
        values: [                                                         // Limits the value of "status" to only these possibilities
          'Open', 
          'Rejected, Third Round', 
          'Rejected, Second Round', 
          'Rejected, First Round',
          'Rejected Anonymously',
          'Revision Requested',
          'Accepted',
          'EIC',
          'Assigned',
          'Recommended'
        ],
        message: '{VALUE} is not supported'                               // Returns error if value isn't on the list
      },                 
    },
    createdAt: {
      type: Date,
      default: Date.now(),                                                // As bananas are added, the date is automatically added
    },
    active: {
      type: Boolean,
      required: [true, 'Is this submission still active? There was an error. '],
      default: true,
    },
    feedback: {
      type: Boolean,
      required: [true, 'Was feedback requested? There was an error. '],
      default: false,
    },
  },
  { timestamps: true }                                                          // This automatically adds the timestamp.
)

 SubmissionSchema.pre('save', async function () { 
   const allReaders = await Reader.find()
//    console.log('allReaders: ' + allReaders)
 })

module.exports = mongoose.model('Submissions', SubmissionSchema)         // First parameter is the name given the function that creates individual collections. 
                                                                        //// Second is the schema itself.