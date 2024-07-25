const Submissions = require('../models/Submissions');
const { StatusCodes } = require('http-status-codes');
const Sib = require('sib-api-v3-sdk');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_KEY;

const createSubmitted = async (req, res) => {
  try {
    const { name, email, title, type, wordCount, coverLetter } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    // Directly use the original file path
    const filePath = path.join(__dirname, '../uploads/', file.filename);
    const newFilePath = filePath;  // No renaming

    console.log('File path:', filePath);
    console.log('New file path:', newFilePath);

    // Check if file exists before proceeding
    if (fs.existsSync(filePath)) {
      console.log('File exists:', filePath);
    } else {
      console.error('File not found:', filePath);
      return res.status(500).json({ message: 'File not found.' });
    }

    // Prepare the file for uploading to Google Drive
    const fileBlob = fs.readFileSync(filePath);
    const base64File = fileBlob.toString('base64');

    const dataSend = {
      dataReq: {
        data: base64File,
        name: file.originalname,
        type: file.mimetype
      },
      fname: 'uploadFilesToGoogleDrive'
    };

    const googleScriptUrl = 'https://script.google.com/macros/s/AKfycbxmYTZlykO8th3ZLiVTzmjMh-UruauRjK4yuaqypgwhOvK8OBxCBd4vNUYFjAFKcjnP/exec';

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      body: JSON.stringify(dataSend),
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'An error occurred while uploading the file');
    }

    // Save the submission to MongoDB
    const submission = await Submissions.create({
      name,
      email,
      title,
      type,
      wordCount,
      coverLetter,
      file: result.url
    });

    console.log('File uploaded successfully:', result);
    fs.unlinkSync(filePath); // Remove the file from the server after upload

    // Send email confirmation
    const tranEmailApi = new Sib.TransactionalEmailsApi();
    const month = ["March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February"];
    const currentDate = new Date();
    const deadlineMonth = month[currentDate.getMonth()];
    const sender = { email: 'editor@havenspec.com', name: 'Haven Spec Magazine' };
    const receivers = [{ email }];

    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Thank you for your submission to Haven Spec Magazine',
      params: {
        name,
        title,
        deadline: deadlineMonth,
      },
      htmlContent: `
        <p>Dear {{params.name}},</p>
        <p>Thank you for submitting to Haven Spec Magazine. You should hear back 
        from us by the end of {{params.deadline}}, but in the meantime, don't forget to check us 
        out at <a href="https://www.havenspec.com">havenspec.com</a>, on Twitter <a href="https://www.twitter.com/HavenSpec">@HavenSpec</a>, and 
        on Bluesky <a href="https://bsky.app/profile/havenspec.bsky.social">@havenspec.bsky.social</a>!</p>
        <p>Sincerely, <br />
        Haven Spec Magazine</p>
      `
    });

    res.status(StatusCodes.CREATED).json({ submission });
  } catch (error) {
    console.error('Error processing submission:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while processing your submission' });
  }
};

module.exports = { createSubmitted };