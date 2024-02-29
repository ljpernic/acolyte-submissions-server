// TO DO: Organize the controllers so that emails are separated out and this file isn't a million miles long

const Submissions = require('../models/Submissions')                          // Makes available the schema defined in models/Submissions.js
const Reader = require('../models/Reader')                                    // Makes available the schema defined in models/Reader.js
const { StatusCodes } = require('http-status-codes')                          // Makes easy status codes from http-status-code package available.


//////// IMPORTS FOR EMAILING FUNCTIONALITY ////////

const Sib = require('@getbrevo/brevo');
//const Sib = require('sib-api-v3-sdk')
require('dotenv').config()




//////// 
//////// 
//////// STRAIGHTFORWARD FUNCTIONS ////////
//////// 
//////// 
//
// GET ALL STATIC SUBMISSIONS
const getAllSubmissionsStatic = async (req, res) => {                           // Async function to get all submissions from database--
  const submissions = await Submissions.find({})                                // Uses the .find function to find all submissions
  res.status(StatusCodes.OK).json({ submissions, count: submissions.length })   // Returns submissions and # of submissions, needed on the front end.
}
//
// FUNCTION TO GET ALL SUBMISSIONS FOR A PARTICULAR READER //
const getAllSubmissions = async (req, res) => {
                                                                                // Finds all submissions by signed-in readerId and sorts.
  const submissions = await Submissions.find({ reader: { $in: [req.reader.readerId, "unclaimed"] } }).sort('createdAt')   
  res.status(StatusCodes.OK).json({ submissions, count: submissions.length })   // Returns submissions and # of submissions, needed on the front end.
}
//
// FUNCTION TO GET SPECIFIC SUBMISSION //
const getSubmission = async (req, res) => {
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                       // Sets req values from req.reader and req.params.
  const submission = await Submissions.findOne({                                // Looks for specific submission based on those req values.
    _id: submissionId,
    reader: readerId,
  })
  if (!submission) {                                                            // If it can't find the submission, it throws an error.
    throw new NotFoundError(`No submission with id ${submissionId}`)
  }
//  console.log(`controllers/submissions.js, getSubmission: ` + submission)
  res.status(StatusCodes.OK).json({ submission })                               // Otherwise, returns the submission.
}
//
// FUNCTION TO DELETE SPECIFIC SUBMISSION //
const deleteSubmission = async (req, res) => {
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                       // Sets req values from req.reader and req.params.
  const submission = await Submissions.findByIdAndRemove({                      // Find and deletes a submission based on submissionId and readerId.
    _id: submissionId,
    reader: readerId,
  })
  if (!submission) {                                                            // If it can't, it throws an error.
    throw new NotFoundError(`No submission with id ${submissionId}. `)
  }
//  console.log(`server/controllers/submissions.js, deleteSubmission, submission: ` + submission)
  res.status(StatusCodes.OK).send()
}

////////
////////
//////// UPDATING THE SUBMISSION ////////
//////// 
////////
//
// FUNCTION TO UPDATE READER FOR CLAIMING AND UNCLAIMING SUBMISSIONS (NO EMAIL NEEDED) //
const updateReader = async (req, res) => {
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                       // Sets req values from req.body, req.reader, and req.params.
  const submission = await Submissions.findByIdAndUpdate(                       // Finds submission by submissionId and ReaderId.
    { _id: submissionId, reader: readerId },
    req.body,                                                                   // Uses the req values to replace submission values.
    { new: true, runValidators: true }
    )
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}`)            // Throws error if no submission found.
  } else {
    res.status(StatusCodes.OK).json({ submission })                             // Otherwise returns good status and the new submission values.
  }    
}
//
// FUNCTION TO UPDATE SUBMISSION FOR REJECTIONS AND HOLDS (EMAIL FUNCTIONALITY INCLUDED) //
const updateSubmission = async (req, res) => {
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                       // Sets req values from req.body, req.reader, and req.params.
  const submission = await Submissions.findByIdAndUpdate(                       // Finds submission by submissionId and ReaderId.
    { _id: submissionId, reader: readerId },
    req.body,                                                                   // Uses the req values to replace submission values.
    { new: true, runValidators: true }
    )
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}`)            // Throws error if no submission found.
  }

  const sender = {                                                              // Sets sender values.
    email: 'editor@havenspec.com',
    name: 'Haven Spec Magazine'
  }

  const submitterReceivers = [                                                  // Sets receiver email.
    {
      email: submission.email,
    },
  ]

  const recommendationReceivers = [                                             // Sets recommendation email.
    {
      email: 'editor@havenspec.com',
    },
  ]

if (submission.type === 'fiction') {                                            // Sets inline text for submission type.
  var submissionType = 'short story'
} else if (submission.type === 'poetry') {
  var submissionType = 'poem'
} else if (submission.type === 'art') {
  var submissionType = 'artwork'
} else {
  var submissionType = ''
}

  if ( submission.active === true ) {                                           // If submission is active...

    const readerEntry = await Reader.findOne({                                  // Finds reader using the Reader model
      _id: submission.reader,                                                   // based on the readerId of the given submission.
    })
    if (!readerEntry) {                                                         // If no reader, it throws an error.
      throw new NotFoundError(`No readerEntry with id ${submission.reader}`)
    }
    var readerName = readerEntry.name;                                          // Otherwise, sets readerName and readerRole to plain text.
    
    if (readerEntry.role === 'EIC') {
      var readerRole = 'Editor'
    } else if (readerEntry.role === 'assistantEditor') {
      var readerRole = 'Assistant Editor'
    } else if (readerEntry.role === 'associateEditor') {
      var readerRole = 'Associate Editor'
    } else {
      var readerRole = ''
    }

    if ( submission.status === "Rejected, Third Round") {                       // Top-tier rejection.             
      await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
      const otherEmailApi = new Sib.TransactionalEmailsApi()                    // Makes transactional email available. 
      let apiKey = otherEmailApi.authentications['apiKey'];
      apiKey.apiKey = process.env.EMAIL_KEY
     
//    console.log("readerName: " + readerName) 
//    console.log("readerRole: " + readerRole)     
      otherEmailApi.sendTransacEmail({                                          // Sends email.
        sender, 
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: {
          submitterName: submission.name,
          readerName: readerName,
          role: readerRole,
          title: submission.title,
          type: submissionType,
          readerNote: submission.readerNote,
        },
        htmlContent:`
        <h4>Haven Spec Magazine</h4> 
        <p> Dear {{params.submitterName}},
        <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. 
        Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing 
        and publishing endeavors. We would be happy to consider anything else you might write!</p> 
        <p> {{params.readerNote}} That's just our subjective opinion, of course, but we appreciated the 
        chance to look at your work, and we hope you send us more. </p>
        <p> Sincerely,</p>
        <p> {{params.readerName}}, {{params.role}} <br /> Haven Spec Magazine</p>
        <br />
        Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
        Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
        `
      }).then(console.log("It worked."))
      .catch(console.log)

      res.status(StatusCodes.OK).json({ submission })
    }

    else if ( submission.status === "Rejected, Second Round") {                 // Middle-tier rejection, sets text of email and sends email. 
      await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
//      console.log("readerName: " + readerName) 
//      console.log("readerRole: " + readerRole)       
      const otherEmailApi = new Sib.TransactionalEmailsApi()                    // Makes transactional email available. 
      let apiKey = otherEmailApi.authentications['apiKey'];
      apiKey.apiKey = process.env.EMAIL_KEY
      otherEmailApi.sendTransacEmail({
        sender, 
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: {
          submitterName: submission.name,
          readerName: readerName,
          role: readerRole,
          title: submission.title,
          type: submissionType,
        },
        htmlContent:`
        <h4>Haven Spec Magazine</h4> 
        <p> Dear {{params.submitterName}},
        <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. 
        Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing 
        and publishing endeavors. We would be happy to consider anything else you might write!</p> 
        <p> Sincerely,</p>
        <p> {{params.readerName}}, {{params.role}} <br /> Haven Spec Magazine</p>
        <br />
        Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
        Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
        `
      }).then(console.log("It worked."))
      .catch(console.log)

      res.status(StatusCodes.OK).json({ submission })
    }
    
  else if ( submission.status === "Rejected, First Round") {                       // Low-tier rejection, sets text of email and sends email.    
    await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
//    console.log("readerName: " + readerName) 
//    console.log("readerRole: " + readerRole)     
      const otherEmailApi = new Sib.TransactionalEmailsApi()                    // Makes transactional email available. 
      let apiKey = otherEmailApi.authentications['apiKey'];
      apiKey.apiKey = process.env.EMAIL_KEY
    otherEmailApi.sendTransacEmail({
      sender, 
      to: submitterReceivers,
      subject: 'Re: Submission to Haven Spec Magazine',
      params: {
        submitterName: submission.name,
        readerName: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p> Dear {{params.submitterName}},
      <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. 
      Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing 
      and publishing endeavors.</p> 
      <p> Sincerely,</p>
      <p> {{params.readerName}}, {{params.role}} <br /> Haven Spec Magazine</p>
      <br />
      Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
      Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
      `
    }).then(console.log("It worked."))
    .catch(console.log)

    res.status(StatusCodes.OK).json({ submission })
  }

  else if ( submission.status === "Rejected Anonymously") {                        // Anon-tier rejection, sets text of email and sends email. 
    await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
//    console.log("readerName: " + readerName) 
//    console.log("readerRole: " + readerRole)     
//    console.log(`Anonymous receivers' emails: ` + submitterReceivers)
      const otherEmailApi = new Sib.TransactionalEmailsApi()                    // Makes transactional email available. 
      let apiKey = otherEmailApi.authentications['apiKey'];
      apiKey.apiKey = process.env.EMAIL_KEY
    otherEmailApi.sendTransacEmail({
      sender, 
      to: submitterReceivers,
      subject: 'Re: Submission to Haven Spec Magazine',
      params: {
        submitterName: submission.name,
        readerName: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p> Dear {{params.submitterName}},
      <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. 
      Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing 
      and publishing endeavors.</p> 
      <p> Sincerely,</p>
      <p> The Editorial Team <br /> Haven Spec Magazine</p>      
      <br />
      Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
      Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
      `
    }).then(console.log("It worked."))
    .catch(console.log)


    res.status(StatusCodes.OK).json({ submission })
  }

  else if ( submission.status === "Recommended") {                                // Recommendation, sets text of email and sends email. 
    const otherEmailApi = new Sib.TransactionalEmailsApi()                    // Makes transactional email available. 
    let apiKey = otherEmailApi.authentications['apiKey'];
    apiKey.apiKey = process.env.EMAIL_KEY
    otherEmailApi.sendTransacEmail({
      sender, 
      to: recommendationReceivers,
      subject: 'Reader Recommendation: ' + submission.name + ' - ' + submission.title,
      params: {
        submitterName: submission.name,
        readerName: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
        readerNote: submission.readerNote,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p><strong>Recommendation: </strong></p>
      <p><strong>Title:</strong> {{params.title}}</p>
      <p><strong>Name:</strong> {{params.submitterName}}</p>
      <p><strong>Type:</strong> {{params.type}}</p>
      <br />
      <p><strong>Recommended by:</strong> <br /> {{params.readerName}}, {{params.role}}</p>
      <p><strong>readerNote:</strong> <br /> {{params.readerNote}}</p>
      `
    }).then(console.log("It worked."))
//
//
    const holdEmailApi = new Sib.TransactionalEmailsApi()
    holdEmailApi.sendTransacEmail({
      sender, 
      to: submitterReceivers,
      subject: 'Re: Submission to Haven Spec Magazine',
      params: {
        submitterName: submission.name,
        readerName: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
        readerNote: submission.readerNote,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p> Dear {{params.submitterName}},
      <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. 
      This is just a quick note to say we've decided to hold onto this one for further consideration, but 
      you should hear from us again in the next couple of months. </p> 
      <p> Sincerely,</p>
      <p>
        {{params.readerName}}, {{params.role}}<br />
        Haven Spec Magazine
      </p>
      Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
      Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
      `
    }).then(console.log("It worked."))
    .catch(console.log)


    res.status(StatusCodes.OK).json({ submission })                               // Returns good status code and the submission.    
  }
    //////// IF ACTIVE BUT NOT REJECTED, UPDATES THE FILE AS NORMAL.
    else {
      res.status(StatusCodes.OK).json({ submission })
    }    
  }
  //////// ELSE IF THE SUBMISSION IS NOT ACTIVE, DO NOTHING.
  else {
      res.status(StatusCodes.NOT_MODIFIED).json({ submission })
    } 
  } 

module.exports = {
  deleteSubmission,
  getAllSubmissions,
  getAllSubmissionsStatic,
  updateSubmission,
  updateReader,
  getSubmission,
}