// IMPORTANT: Search for "TO DO" to find the various smaller things that still have to be done!

require('dotenv').config();                                                       // Makes the data in the .env file available.
require('express-async-errors');                                                  // Makes the easy errors from the express-async-errors package available.
const path = require('path');

// EXTRA SECURITY PACKAGES
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');
const rateLimiter = require('express-rate-limit');

// SWAGGER
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

// EXPRESS
const express = require('express');                                             // Makes the express package available for use in this file.
const app = express();                                                          // Assigns the express function specifically to the 'app' constant.

// DATABASE AND AUTHENTICATION SETUP
const connectDB = require('./db/connect');                                      // Makes the database info in db/connect available.
const authReader = require('./middleware/authentication');                      // Makes the authentication middleware available.
                                                                                ////
// ROUTERS
const submittedRouter = require('./routes/submitted');                                // Makes controllers from controllers/submit.js that are paired with routes in app.js available
const submissionsRouter = require('./routes/submissions');
const authRouter = require('./routes/auth');                                    // Makes the functions and post method in routes/auth.js available for use below.

// ERROR HANDLER
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// SETS SECURITY PARAMETERS //
app.set('trust proxy', 1);                                                      // We need this for everything to work on Heroku
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,                                                   // 15 minutes
    max: 100,                                                                   // limit each IP to 100 requests per windowMs
  })
);

app.use((req, res, next) => {
  // Disable caching headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const corsOrigin ={
  origin: 'http://localhost:3000', 
  credentials:true,            
  optionSuccessStatus:200
}

// INVOKES THE SECURITY PACKAGES REQUIRED ABOVE // 
app.use(express.json());
app.use(helmet());
app.use(cors(corsOrigin));
app.use(xss());

// ROUTES //
app.use('/api/v1/submitted', submittedRouter);                                    // Where the req.body shows itself; second thing is the routes file required above
app.use('/api/v1/submissions', authReader, submissionsRouter);                                    // Where the req.body shows itself; second thing is the routes file required above
app.use('/api/v1/auth', authRouter);                                            // Assigns the authRouter functions and post methods to this route.
app.use('/api/v1/auth-pw', authReader, authRouter);
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);                                     //// Starts the server by connecting to the database based on the info in the .env file.
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
