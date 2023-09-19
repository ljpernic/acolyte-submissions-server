## ACOLYTE SUBMISSION SYSTEM, SERVER

#### Overview

This project is the **SERVER-SIDE** of the **ACOLYTE SUBMISSION SYSTEM**. It uses **NPM** and **MongoDB** to function.

Users can submit a doc, docx, or ODT file through a **customizable form** that will then be uploaded to **MongoDB**. These submissions are then divided among the **readers**, who access their assigned submissions through a **web portal** that they log into. The system also allows for **notes** to be logged, **rejections** to be sent to the submitter, and **holds** to be sent to the next editor in the line, among other things.

To spin up the project, a **.env file** must be created, and the following two variables places inside. These values are unique to your project.

Values for the .env file:

**MONGO_URI**
**JWT_SECRET**

The first connects the project to a MongoDB database where your data will go. The second connects to the login information for each reader.

After that, the following command has to be run:

```bash
npm install && npm start
```

#### Swagger UI

The **Swagger UI** is also built in for keeping track of whatever thing does. This is essentially a wiki, and it uses the following format:

```yaml
/jobs/{id}:
  parameters:
    - in: path
      name: id
      schema:
        type: string
      required: true
      description: the job id
```

#### app.js

The **app.js** file is where everything connects. There are many notes within the document explaining what each part does. The **dotenv** require functionality makes the .env data available to be used for the project. The **express-async-errors** require functionality makes the easy error messages available.

The constant **connectDB = require('./db/connect')** makes the database information in /db/connect available for the project. The constant **authenticateReader = require('./middleware/authentication')** makes the authentication middleware available. This contains the functionality to use the data linkups in the dotenv file. The **authentication middleware** is used to **verify sign-in** in order to see the **job routes**. 

**--> TO BE ADDED:** Fixed reader roles to make sure that the reader is signed in as the **correct role**. Each role will have its own **reader dashboard**. Should the role be checked server-side? The person tries to log in, the server sees what their role is, and then it returns the correct dashboard api? 

**How authentication works:** User submits credentials and server verifies credentials (and eventually checks role) using functions in controllers/auth. If the credentials are correct, it returns a token to the browser that lets the user be logged in. Seccond, routes for login and delegate are created (at routes/auth) using the criteria at controllers/auth, invoking those functions. Otherwise, if the functions fail (because of faulty credentials), the routes don't post because the controllers throw an error first. Finally, if the routes in routes/auth work (meaning the authentication controller worked), app.js uses api/v1/auth to give access to what was posted in routes/auth to the user. This only happens, however, if the controller/auth worked (i.e., if the login or registration worked).

In other words, when someone tries to log in, the following process occurs: 

1. app.js says, "Try to access the api route" 
2. the api route says, "Try to access the route.post for login" 
3. route.post says, "Try to test the login credentials through the controllers" 
3. The controller either throws an error for false credentials or tells the route/auth, "Yes, the credentials are valid" 
--> Add "And this is the role"?
4. route/auth tells the api/v1/auth, "Yes, we have something to post"
5. which allows the user to access the api route.
6. The middleware/authentication functions then grabs the token from the header, verifies it, and puts the values into req.body. 

The returned token contains the readerId, name, and role. It shouldn't be decipherable on client-side without the hash key, which is hidden in the .env file. The middleware/authentication deciphers the token when you try to access the jobs route, makes it available in req.body but unreadable to the casual reader. 

**-->TO BE ADDED/TO THINK ABOUT:** The above process might not be completely done. I remember there being some issues with the login and tokens. Also, the process has to be split up for the different reader roles. How do we make the server post a different route to the api based on the role? Can we create a new route in routes/auth (/editor-dashboard)? Where do we split the process?

The constant **authRouter = require('./routes/auth');** makes the functions and post method in routes/auth.js available for use by the api/v1/auth. There are three routeNames in app.js: **routes/auth**, **routes/jobs**, and **routes/roles**.

The function **app.use('/api/v1/auth', authRouter);** makes the functions and post method in routes/auth.js available, using the routes/auth constant defined as authRouter above. This is also true for jobs and roles, with different functions/apis.

Assuming everything went well, **const start** carries a function that starts the server by connecting to the database based on the info in the .env file.

#### 