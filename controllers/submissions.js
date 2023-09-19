// TO DO: Organize the controllers so that emails are separated out and this file isn't a million miles long

const Submissions = require('../models/Submissions')                                    // Makes available the schema defined in models/Submissions.js
const Reader = require('../models/Reader')                                    // Makes available the schema defined in models/Reader.js
const { StatusCodes } = require('http-status-codes')                                    // Makes easy status codes from http-status-code package available.
const { BadRequestError, UnauthenticatedError } = require('../errors')                  // Makes these extra errors available.
const fs = require('fs');

//////// IMPORTS FOR EMAILING FUNCTIONALITY ////////

const Sib = require('sib-api-v3-sdk')
const { listenerCount } = require('multer-gridfs-storage')
require('dotenv').config()

const client = Sib.ApiClient.instance
const apiKey = client.authentications['api-key']
apiKey.apiKey = process.env.EMAIL_KEY


//////// STRAIGHTFORWARD FUNCTIONS ////////
//////// 
//////// 

// GET ALL STATIC SUBMISSIONS
const getAllSubmissionsStatic = async (req, res) => {                                   // Async function to get all submissions from database--
  const submissions = await Submissions.find({})                                         // Uses the .find function to find all submissions
  res.status(StatusCodes.OK).json({ submissions, count: submissions.length })           // Returns submissions and # of submissions, which is needed on the front end.
}
//
//
//
//
// FUNCTION TO GET ALL SUBMISSIONS FOR A PARTICULAR READER //
const getAllSubmissions = async (req, res) => {
  const submissions = await Submissions.find({ reader: req.reader.readerId }).sort('createdAt')   // Finds all submissions by signed-in readerId and sorts.
//  console.log(`server/controllers/submissions.js, getAllSubmissions, req.reader: ` + JSON.stringify(req.reader))
//  console.log(`server/controllers/submissions.js, getAllSubmissions, const submissions: ` + submissions)
  res.status(StatusCodes.OK).json({ submissions, count: submissions.length })                       // Returns submissions and # of submissions, which is needed on the front end.
}
//
//
//
//
// FUNCTION TO GET SPECIFIC SUBMISSION //
const getSubmission = async (req, res) => {
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
//  console.log(`controllers/submissions.js, getSubmission: ` + submission)
  res.status(StatusCodes.OK).json({ submission })                                            // Otherwise, returns the submission.
}
//
//
//
//
// FUNCTION TO DELETE SPECIFIC SUBMISSION //
const deleteSubmission = async (req, res) => {
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                             // Sets req values from req.reader and req.params.
  const submission = await Submissions.findByIdAndRemove({                                           //// Find and deletes a submission based on submissionId and readerId.
    _id: submissionId,
    reader: readerId,
  })
  if (!submission) {                                                                         //// If it can't, it throws an error.
    throw new NotFoundError(`No submission with id ${submissionId}. `)
  }
//  console.log(`server/controllers/submissions.js, deleteSubmission, submission: ` + submission)
  res.status(StatusCodes.OK).send()
}
////////
////////
//////// UPDATING AND EMAILING FUNCTION ////////
//////// 
//////// 
// FUNCTION TO UPDATE SPECIFIC SUBMISSION //
const updateSubmission = async (req, res) => {

  //////// SETS REQ PARAMETERS TO SEARCH DATABASE; PASSED IN FROM PAYLOAD
  const {
    reader: { readerId },
    params: { id: submissionId },
  } = req                                                                             // Sets req values from req.body, req.reader, and req.params.
 
  //////// SEARCHES DATABASE FOR SUBMISSION BASED ON REQ PARAMETERS
  //////// SETS REJECTION STATUS FROM REQ.BODY IF APPLICABLE 
  const submission = await Submissions.findByIdAndUpdate(                            //// Otherwise, finds and updates submission by submissionId and readerId.
    { _id: submissionId, reader: readerId },
    req.body,
    { new: true, runValidators: true }
    )

  //////// SUBMISSION CONTAINS ALL OF THE DATA IN THE SUBMISSION
  //////// THROWS AN ERROR IF NO SUBMISSION IS FOUND
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}`) 
  }

  const sender = {
    email: 'havenspec@gmail.com',
    name: 'Haven Spec Magazine'
  }

  const submitterRecievers = [
    {
      email: submission.email,
    },
  ]

  const recommendationRecievers = [
    {
      email: 'havenspec@gmail.com',
    },
  ]

if (submission.type === 'fiction') {
  var submissionType = 'short story'
} else if (submission.type === 'poetry') {
  var submissionType = 'poem'
} else if (submission.type === 'art') {
  var submissionType = 'artwork'
} else {
  var submissionType = ''
}

  // TO DO: Clarify how this works. Basically, when you click the right-hand button on pages/Verarbeiten.js (the one that sends the email), 
  // it changes the client-side value for status for readerInput values.  
  //
  // This function then finds the submission in the database and updates it with the new values, changing the status field. (This is everything above.)
  //
  // Then it checks if the submission is active. If active is true, it checks the status. 
  //
  // If status is a rejection, it sends an email and changes active to false.
  //
  // If status is not rejection, it sends the appropriate email but does not change active to false. 
  //
  // TO DO: Change 'Third Round' to 'High-Tier' throughout (or whatever it is in the other uses)

  if ( submission.active === true ) {

    const readerEntry = await Reader.findOne({                                      // Looks for specific submission based on those req values.
      _id: submission.reader,
    })
    if (!readerEntry) {                                                                         // If it can't find the submission, it throws an error.
      throw new NotFoundError(`No readerEntry with id ${submission.reader}`)
    }
    var readerName = readerEntry.name;
    
    if (readerEntry.role === 'EIC') {
      var readerRole = 'Editor'
    } else if (readerEntry.role === 'assistantEditor') {
      var readerRole = 'Assistant Editor'
    } else if (readerEntry.role === 'associateEditor') {
      var readerRole = 'Associate Editor'
    } else {
      var readerRole = ''
    }

  //////// 
  //////// TOP-TIER REJECTION FUNCTIONALITY AND EMAIL ////////
  //////// 

    if ( submission.status === "Rejected, Third Round") {
      await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
      const otherEmailApi = new Sib.TransactionalEmailsApi()
    console.log("readerName: " + readerName) 
    console.log("readerRole: " + readerRole)     
      otherEmailApi.sendTransacEmail({
        sender, 
        to: submitterRecievers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: {
          name: readerName,
          role: readerRole,
          title: submission.title,
          type: submissionType,
          readerNote: submission.readerNote,
        },
        htmlContent:`
        <h4>Haven Spec Magazine</h4> 
        <p> Dear {{params.name}},
        <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to 
        pass on this one, but we wish you the best of luck on your writing and publishing endeavors. We would be happy to consider anything 
        else you might write!</p> 
        <p> {{params.readerNote}} That's just our subjective opinion, of course, but we appreciated the chance to look at your work, and we 
        hope you send us more. </p>
        <p> Sincerely,</p>
        <p> {{params.name}}, {{params.role}} <br /> Haven Spec Magazine</p>
        <br />
        Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
        Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
        `
      }).then(console.log)
      .catch(console.log)

        //      const testSubmission = await Submissions.findById(submission._id)
        //      console.log(`testSubmission to see if the submission has updated: ` + testSubmission)

      res.status(StatusCodes.OK).json({ submission })
    }

  //////// 
  //////// MIDDLE-TIER REJECTION FUNCTIONALITY AND EMAIL ////////
  //////// 

    else if ( submission.status === "Rejected, Second Round") {
      await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
      console.log("readerName: " + readerName) 
      console.log("readerRole: " + readerRole)       
      const otherEmailApi = new Sib.TransactionalEmailsApi()
      otherEmailApi.sendTransacEmail({
        sender, 
        to: submitterRecievers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: {
          name: readerName,
          role: readerRole,
          title: submission.title,
          type: submissionType,
        },
        htmlContent:`
        <h4>Haven Spec Magazine</h4> 
        <p> Dear {{params.name}},
        <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to 
        pass on this one, but we wish you the best of luck on your writing and publishing endeavors. We would be happy to consider anything 
        else you might write!</p> 
        <p> Sincerely,</p>
        <p> {{params.name}}, {{params.role}} <br /> Haven Spec Magazine</p>
        <br />
        Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
        Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
        `
      }).then(console.log)
      .catch(console.log)

        //      const testSubmission = await Submissions.findById(submission._id)
        //      console.log(`testSubmission to see if the submission has updated: ` + testSubmission)

      res.status(StatusCodes.OK).json({ submission })
    }
    
  //////// 
  //////// LOW-TIER REJECTION FUNCTIONALITY AND EMAIL ////////
  //////// 

  else if ( submission.status === "Rejected, First Round") {
    await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
    console.log("readerName: " + readerName) 
    console.log("readerRole: " + readerRole)     
    const otherEmailApi = new Sib.TransactionalEmailsApi()
    // TO DO: Change "fiction" to "short fiction" so that it is easy to include in the parameters of the emails.
          // SEND EMAIL
    otherEmailApi.sendTransacEmail({
      sender, 
      to: submitterRecievers,
      subject: 'Re: Submission to Haven Spec Magazine',
      params: {
        name: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p> Dear {{params.name}},
      <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to 
      pass on this one, but we wish you the best of luck on your writing and publishing endeavors.</p> 
      <p> Sincerely,</p>
      <p> {{params.name}}, {{params.role}} <br /> Haven Spec Magazine</p>
      <br />
      Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
      Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
      `
    }).then(console.log)
    .catch(console.log)

      //      const testSubmission = await Submissions.findById(submission._id)
      //      console.log(`testSubmission to see if the submission has updated: ` + testSubmission)

    res.status(StatusCodes.OK).json({ submission })
  }

  //////// 
  //////// ANON-TIER REJECTION FUNCTIONALITY AND EMAIL ////////
  //////// 

  // TO DO: Split this into two emails so that the reader notes are sent to the editor immediatly?
  else if ( submission.status === "Rejected Anonymously") {
    await Submissions.updateOne( {"_id":submission._id}, {$set: {"active":false}} )
    console.log("readerName: " + readerName) 
    console.log("readerRole: " + readerRole)     
    console.log(`Anonymous recievers' emails: ` + submitterRecievers)
    const otherEmailApi = new Sib.TransactionalEmailsApi()
          // SEND EMAIL
    otherEmailApi.sendTransacEmail({
      sender, 
      to: submitterRecievers,
      subject: 'Re: Submission to Haven Spec Magazine',
      params: {
        name: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p> Dear {{params.name}},
      <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to 
      pass on this one, but we wish you the best of luck on your writing and publishing endeavors.</p> 
      <p> Sincerely,</p>
      <p> The Editorial Team <br /> Haven Spec Magazine</p>      
      <br />
      Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
      Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
      `
    }).then(console.log)
    .catch(console.log)

    // TO DO: Fix the notification email that sends anonymous rejection notification notes to the editor
    // const thirdEmailApi = new Sib.TransactionalEmailsApi()
    //       // SEND EMAIL
    // thirdEmailApi.sendTransacEmail({
    //   sender, 
    //   to: 'havenspec@gmail.com',
    //   subject: 'Re: Submission to Haven Spec Magazine (anon rejection)',
    //   params: {
    //     name: submission.name,
    //     title: submission.title,
    //     type: submissionType,
    //     readerNote: submission.readerNote,
    //   },
    //   htmlContent:`
    //   <h4>Haven Spec Magazine</h4> 
    //   <p><strong>Anonymous rejection: </strong><p>
    //   <br />
    //   <p>Title: {{params.title}}</p>
    //   <p>Name: {{params.title}}</p>
    //   <p>Type: {{params.type}}</p>
    //   <br />
    //   <p>Recommended by: name to come...
    //   <p>readerNote: {{params.readerNote}}</p>
    //   `
    // }).then(console.log)
    // .catch(console.log)

      //      const testSubmission = await Submissions.findById(submission._id)
      //      console.log(`testSubmission to see if the submission has updated: ` + testSubmission)

    res.status(StatusCodes.OK).json({ submission })
  }

  //////// 
  //////// REC-TIER FUNCTIONALITY AND EMAIL ////////
  //////// 

  else if ( submission.status === "Recommended") {
    const otherEmailApi = new Sib.TransactionalEmailsApi()
          // SEND EMAIL
    otherEmailApi.sendTransacEmail({
      sender, 
      to: recommendationRecievers,
      subject: 'Reader Recommendation',
      params: {
        name: readerName,
        role: readerRole,
        title: submission.title,
        type: submissionType,
        readerNote: submission.readerNote,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p><strong>Recommendation: </strong></p>
      <p><strong>Title:</strong> {{params.title}}</p>
      <p><strong>Name:</strong> {{params.title}}</p>
      <p><strong>Type:</strong> {{params.type}}</p>
      <br />
      <p><strong>Recommended by:</strong> <br /> {{params.name}}, {{params.role}}</p>
      <p><strong>readerNote:</strong> <br /> {{params.readerNote}}</p>
      `
    }).then(console.log)
//
//
//
//
    const holdEmailApi = new Sib.TransactionalEmailsApi()
          // SEND EMAIL
    holdEmailApi.sendTransacEmail({
      sender, 
      to: submitterRecievers,
      subject: 'Re: Submission to Haven Spec Magazine',
      params: {
        name: submission.name,
        title: submission.title,
        type: submissionType,
        readerNote: submission.readerNote,
      },
      htmlContent:`
      <h4>Haven Spec Magazine</h4> 
      <p> Dear {{params.name}},
      <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. This is just a quick note to say we've 
      decided to hold onto this one for further consideration, but you should hear from us again in the next month or two. </p> 
      <p> Sincerely,</p>
      <p> Reader name to come... </p>
      <br />
      Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a> and on 
      Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>.</p>
      `
    }).then(console.log)
    .catch(console.log)

      //      const testSubmission = await Submissions.findById(submission._id)
      //      console.log(`testSubmission to see if the submission has updated: ` + testSubmission)

    res.status(StatusCodes.OK).json({ submission })
  }
    //////// IF ACTIVE BUT NOT REJECTED, UPDATES THE FILE AS NORMAL.
    else {
//      console.log("Submission.status: " + submission)
//      console.log("UPDATE ENTRY --> Entry has no rejected status")
      res.status(StatusCodes.OK).json({ submission })
    }    
  }
  //////// ELSE IF THE SUBMISSION IS NOT ACTIVE, DO NOTHING.
  else {
//      console.log("Submission.status: " + submission.status)
//      console.log("DO NOTHING --> Entry has status:rejected and active:false)")
      res.status(StatusCodes.NOT_MODIFIED).json({ submission })
    } 
  } 

module.exports = {
  deleteSubmission,
  getAllSubmissions,
  getAllSubmissionsStatic,
  updateSubmission,
  getSubmission,
}