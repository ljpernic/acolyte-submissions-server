const Submissions = require('../models/Submissions')                                      // Makes available the schema defined in models/Submissions.js
const { StatusCodes } = require('http-status-codes')                                    // Makes easy status codes from http-status-code package available.
const { BadRequestError, UnauthenticatedError } = require('../errors')                  // Makes these extra errors available.

const Sib = require('sib-api-v3-sdk')
const { listenerCount } = require('multer-gridfs-storage')
require('dotenv').config()

const client = Sib.ApiClient.instance
const apiKey = client.authentications['api-key']
apiKey.apiKey = process.env.EMAIL_KEY


// FUNCTION TO CREATE NEW SUBMISSION //
const createSubmitted = async (req, res) => {
  const submitted = await Submissions.create(req.body)                       // Creates submission array using Role/Submission.js scheme. )
  const submission = submitted;
//  console.log(`Is this invoked? ` + JSON.stringify(req.body))
  const tranEmailApi = new Sib.TransactionalEmailsApi()

  // SET UP DEADLINE PART OF EMAIL
  const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentDate = new Date();
  let currentMonth = month[currentDate.getMonth()];
  var deadlineMonth;

    if (currentMonth <= 10) 
      {
        deadlineMonth = currentMonth + 2;
      } 
    else if (currentMonth = 11)
      {
        deadlineMonth = month[1];
      } else {
        deadlineMonth = month[2];
    }
  // SET UP EMAIL DETAILS
  const sender = {
    email: 'havenspec@gmail.com',
    name: 'Haven Spec Magazine'
  }

  const recievers = [
    {
      email: 'leon.perniciaro@gmail.com',
    },
  ]

// SEND EMAIL
tranEmailApi.sendTransacEmail({
  sender, 
  to: recievers,
  subject: 'Thank you for your submission to Haven Spec Magazine',
  params: {
    name: req.body.name,
    title: req.body.title,
    deadline: deadlineMonth, 
  },
  htmlContent:`
  <h4>Haven Spec Magazine</h4> 
  <p> Dear {{params.name}},
  <p>Thank you for submitting to Haven Spec Magazine! You should hear back 
  from us by the end of {{params.deadline}}, but in the meantime, don't forget to check us 
  out at <a href="https://www.havenspec.com">havenspec.com</a> and on twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>!</p>
  `
}).then(console.log)
.catch(console.log)
  res.status(StatusCodes.CREATED).json({ submission })
}

module.exports = {
  createSubmitted,
}