const Submissions = require('../models/Submissions');
const Reader = require('../models/Reader');
const { StatusCodes } = require('http-status-codes');
const Sib = require('@getbrevo/brevo');
require('dotenv').config();

const getAllSubmissionsStatic = async (req, res) => {
  const submissions = await Submissions.find({});
  res.status(StatusCodes.OK).json({ submissions, count: submissions.length });
};

const getAllSubmissions = async (req, res) => {
  const submissions = await Submissions.find({ reader: { $in: [req.reader.readerId, "unclaimed"] } }).sort('createdAt');
  res.status(StatusCodes.OK).json({ submissions, count: submissions.length });
};

const getSubmission = async (req, res) => {
  const { reader: { readerId }, params: { id: submissionId } } = req;
  const submission = await Submissions.findOne({ _id: submissionId, reader: readerId });
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}`);
  }
  res.status(StatusCodes.OK).json({ submission });
};

const deleteSubmission = async (req, res) => {
  const { reader: { readerId }, params: { id: submissionId } } = req;
  const submission = await Submissions.findByIdAndRemove({ _id: submissionId, reader: readerId });
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}.`);
  }
  res.status(StatusCodes.OK).send();
};

const updateReader = async (req, res) => {
  const { reader: { readerId }, params: { id: submissionId } } = req;
  const submission = await Submissions.findByIdAndUpdate({ _id: submissionId, reader: readerId }, req.body, { new: true, runValidators: true });
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}`);
  } else {
    res.status(StatusCodes.OK).json({ submission });
  }
};

const updateSubmission = async (req, res) => {
  const { reader: { readerId }, params: { id: submissionId } } = req;
  const submission = await Submissions.findByIdAndUpdate({ _id: submissionId, reader: readerId }, req.body, { new: true, runValidators: true });
  if (!submission) {
    throw new NotFoundError(`No submission with id ${submissionId}`);
  }

  const sender = {
    email: 'editor@havenspec.com',
    name: 'Haven Spec Magazine'
  };

  const submitterReceivers = [{ email: submission.email }];
  const recommendationReceivers = [{ email: 'editor@havenspec.com' }];
  const submissionType = submission.type === 'fiction' ? 'short story' : submission.type === 'poetry' ? 'poem' : submission.type === 'art' ? 'artwork' : '';

  if (submission.active === true) {
    const readerEntry = await Reader.findOne({ _id: submission.reader });
    if (!readerEntry) {
      throw new NotFoundError(`No readerEntry with id ${submission.reader}`);
    }
    const readerName = readerEntry.name;
    const readerRole = readerEntry.role === 'EIC' ? 'Editor' : readerEntry.role === 'assistantEditor' ? 'Assistant Editor' : readerEntry.role === 'associateEditor' ? 'Associate Editor' : '';

    const emailApi = new Sib.TransactionalEmailsApi();
    emailApi.authentications['apiKey'].apiKey = process.env.EMAIL_KEY;

    const sendEmail = (emailDetails) => {
      emailApi.sendTransacEmail(emailDetails)
        .then(() => console.log("Email sent successfully."))
        .catch((error) => console.error("Error sending email:", error));
    };

    const commonParams = {
      submitterName: submission.name,
      readerName: readerName,
      role: readerRole,
      title: submission.title,
      type: submissionType,
      readerNote: submission.readerNote
    };

    if (submission.status === "Rejected, Third Round") {
      await Submissions.updateOne({ "_id": submission._id }, { $set: { "active": false } });

      sendEmail({
        sender,
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: commonParams,
        htmlContent: `
          <p>Dear {{params.submitterName}},</p>
          <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing and publishing endeavors. We would be happy to consider anything else you might write!</p>
          <p>{{params.readerNote}} That's just our subjective opinion, of course, but we appreciated the chance to look at your work, and we hope you send us more.</p>
          <p>Sincerely, <br />{{params.readerName}}, {{params.role}}<br />Haven Spec Magazine</p>
          <br />
          <p>Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a>, on Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>, and on Bluesky <a href="https://bsky.app/profile/havenspec.bsky.social">@havenspec.bsky.social</a>!</p>
        `
      });

      res.status(StatusCodes.OK).json({ submission });
    } else if (submission.status === "Rejected, Second Round") {
      await Submissions.updateOne({ "_id": submission._id }, { $set: { "active": false } });

      sendEmail({
        sender,
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: commonParams,
        htmlContent: `
          <p>Dear {{params.submitterName}},</p>
          <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing and publishing endeavors. We would be happy to consider anything else you might write!</p>
          <p>Sincerely, <br />{{params.readerName}}, {{params.role}}<br />Haven Spec Magazine</p>
          <br />
          <p>Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a>, on Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>, and on Bluesky <a href="https://bsky.app/profile/havenspec.bsky.social">@havenspec.bsky.social</a>!</p>
        `
      });

      res.status(StatusCodes.OK).json({ submission });
    } else if (submission.status === "Rejected, First Round") {
      await Submissions.updateOne({ "_id": submission._id }, { $set: { "active": false } });

      sendEmail({
        sender,
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: commonParams,
        htmlContent: `
          <p>Dear {{params.submitterName}},</p>
          <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing and publishing endeavors.</p>
          <p>Sincerely, <br />{{params.readerName}}, {{params.role}}<br />Haven Spec Magazine</p>
          <br />
          <p>Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a>, on Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>, and on Bluesky <a href="https://bsky.app/profile/havenspec.bsky.social">@havenspec.bsky.social</a>!</p>
        `
      });

      res.status(StatusCodes.OK).json({ submission });
    } else if (submission.status === "Rejected Anonymously") {
      await Submissions.updateOne({ "_id": submission._id }, { $set: { "active": false } });

      sendEmail({
        sender,
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: commonParams,
        htmlContent: `
          <p>Dear {{params.submitterName}},</p>
          <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. Unfortunately, we've decided to pass on this one, but we wish you the best of luck on your writing and publishing endeavors.</p>
          <p>Sincerely, <br />The Haven Spec Team</p>
          <br />
        `
      });

      res.status(StatusCodes.OK).json({ submission });
    } else if (submission.status === "Recommended") {
      const firstEmail = {
        sender,
        to: recommendationReceivers,
        subject: 'Reader Recommendation: ' + submission.name + ' - ' + submission.title,
        params: commonParams,
        htmlContent: `
          <h4>Haven Spec Magazine</h4> 
          <p><strong>Recommendation: </strong></p>
          <p><strong>Title:</strong> {{params.title}}<br /><strong>Author:</strong> {{params.submitterName}}</p>
          <p><strong>Reader:</strong> {{params.readerName}}</p>
          <p><strong>Notes:</strong> {{params.readerNote}}</p>
        `
      };

      const secondEmail = {
        sender,
        to: submitterReceivers,
        subject: 'Re: Submission to Haven Spec Magazine',
        params: commonParams,
        htmlContent: `
          <p>Dear {{params.submitterName}},</p>
          <p>Thank you for the submission of your {{params.type}} "{{params.title}}" to Haven Spec Magazine. We wanted to let you know that we are impressed with your work, and are considering it for publication. Our editor will reach out to you soon with a final decision. Thank you for your patience!</p>
          <p>Sincerely, <br />{{params.readerName}}, {{params.role}}<br />Haven Spec Magazine</p>
          <br />
          <p>Find us on the web at <a href="https://www.havenspec.com">havenspec.com</a>, on Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>, and on Bluesky <a href="https://bsky.app/profile/havenspec.bsky.social">@havenspec.bsky.social</a>!</p>
        `
      };

      await Promise.all([sendEmail(firstEmail), sendEmail(secondEmail)]);
      res.status(StatusCodes.OK).json({ submission });
    } else {
      res.status(StatusCodes.OK).json({ submission });
    }
  } else {
    res.status(StatusCodes.OK).json({ submission });
  }
};

module.exports = {
  getAllSubmissionsStatic,
  getAllSubmissions,
  getSubmission,
  deleteSubmission,
  updateReader,
  updateSubmission
};
