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
      type: String,
      default: 'unclaimed',                                // As bananas are added, they won't have a reader by default
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
  },
  { timestamps: true }                                                          // This automatically adds the timestamp.
)

 SubmissionSchema.pre('save', async function () { 
   const allReaders = await Reader.find()
//    console.log('allReaders: ' + allReaders)
 })

// // ////// FUNCTION TO GET AND ASSIGN ACTIVE READERS //////

// // // Gets all readers, active or not //
//  SubmissionSchema.pre('save', async function () { 
//    const allReaders = await Reader.find()

// // // Filters those readers to only active readers // 
//    var eligibleReaders = allReaders.filter(function(readerData) {                // Filters all readers by isActive and current story counts.
//      return readerData.isActive === true && 
//        readerData.weekCount < 10 && 
//        readerData.periodCount < 80;                                              // Creates a new array with only the eligible readers.
//    });

//    if ( eligibleReaders.length < 1 ) {
//      return
//      }
// // // Finds the lowest current weekCount among eligibleReaders //
//    var lowestWeekCountReaders = eligibleReaders.reduce(function(res, obj) { 
//      return (obj.weekCount < res.weekCount) ? obj : res;
//    });

// // // Creates an array of readers with lowest current weekCount //
//    var lowestWeekCount = lowestWeekCountReaders.weekCount                        // Assigned the numerical value to a var to use for filter params.
//    var assignedReaders = eligibleReaders.filter(function(assignedReaderData) {   // Filters all readers by those with lowest week count.
//      return assignedReaderData.weekCount === lowestWeekCount                     // Creates array assignedReaders, who should have lowest week count.
//    });
// //console.log(`server/models/Submissions.js, assignedReaders before the if: ` + assignedReaders)
//    if ( assignedReaders.length === 1 ) {
//     var individualReader = assignedReaders; 
//  //   console.log(`server/models/Submissions.js, assignedReaders for 1 reader: ` + assignedReaders)
//  //   console.log(`server/models/Submissions.js, individualReader for 1 reader: ` + individualReader)
//    } 
//    else {
// // mini-function to randomize the assignedReaders array //
//      var readerIndex = assignedReaders.length, randomIndex;
//        while (readerIndex != 0) {                                              // While there remain elements to shuffle...
//          randomIndex = Math.floor(Math.random() * readerIndex);                // Pick one of the remaining elements...
//          readerIndex--;
//        [assignedReaders[readerIndex], assignedReaders[randomIndex]] = [                // And swap it with the current element.
//          assignedReaders[randomIndex], assignedReaders[readerIndex]];
//        }
//      }
//    var individualReader = assignedReaders[0]
//    var readerId = individualReader._id

//    Reader.findByIdAndUpdate(readerId, { weekCount: individualReader.weekCount + 1, periodCount: individualReader.periodCount + 1, totalCount: individualReader.totalCount + 1 },
//      function (err, docs) {
//        if (err){
//            console.log(err)
//        }
//        else{
//            console.log("Updated " + docs.name +"'s counts by one. ");
//        }
//      });

//    this.reader = readerId
//    individualReader.weekCount === individualReader.weekCount + 1 

//  })

module.exports = mongoose.model('Submission', SubmissionSchema)         // First parameter is the name given the function that creates individual collections. 
                                                                        //// Second is the schema itself.