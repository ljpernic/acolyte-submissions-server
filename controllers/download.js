// BROKEN FUNCTION TO DOWNLOAD FILE FROM MONGODB. OBSOLETE NOW THAT GOOGLE DRIVE WORKS.

const Submissions = require('../models/Submissions')                                      // Makes available the schema defined in models/Submissions.js
const { StatusCodes } = require('http-status-codes')                                    // Makes easy status codes from http-status-code package available.
const { BadRequestError, UnauthenticatedError } = require('../errors')                  // Makes these extra errors available.
const fs = require('fs');

// FUNCTION TO DOWNLOAD SUBMISSION //
const downloadSubmission = async (req, res) => {
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                             // Sets req values from req.reader and req.params.
  const submission = await Submissions.findOne({                                                     // Looks for specific submission based on those req values.
    _id: submissionId,
    reader: readerId,
  })
  if (!submission) {                                                                         // If it can't find the submission, it throws an error.
    throw new NotFoundError(`No submission with id ${submissionId}`)
  }
  console.log(`controllers/download.js, downloadSubmission.file: ` + submission.file)
  const docx = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  res.writeHead(200, 
    {'content-type': docx} ).end()                                            // Otherwise, returns the submission.
}

module.exports = {
   downloadSubmission,
}