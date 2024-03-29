const express = require('express')
const mongoose = require('mongoose')
const path = require('path');
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
// const Grid = require("gridfs-stream");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

const userlogin = require("./model/user");
const adminlogin = require("./model/admin");
const url = 'mongodb://127.0.0.1:27017/useradmin';
mongoose.connect(url);

const db = mongoose.connection;
const PORT = process.env.PORT || 5000

db.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});

db.once('open', () => {
  console.log('Connected successfully to MongoDB');

});

app.get('/', function (req, res) {
  res.set({
    'Access-control-Allow-Origin': '*'
  });
  return res.sendFile(path.join(__dirname, 'index.html'));  // Updated path
})
app.get('/admindashboard', function (req, res) {

  res.render('admindashboard');
})

// app.get('/viewusers', function (req, res) {

//   res.render('viewusers');
// })

app.post('/admin_login', async (req, res) => {
  const { adminemail, adminpassword } = req.body;

  try {
    const user = await adminlogin.findOne({ email: adminemail });
    if (!user) {
      return res.status(404).send('User not found');
    }
    if (user.password !== adminpassword) {
      return res.status(401).send('Invalid password');
    }
    res.render('admindashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/user_login', async (req, res) => {
  const { useremail, userpassword } = req.body;

  try {
    const user = await userlogin.findOne({ email: useremail });
    if (!user) {
      return res.status(404).send('User not found');
    }
    if (user.password !== userpassword) {
      return res.status(401).send('Invalid password');
    }

    // Assuming you are rendering the 'userdashboard' view
    res.render('userdashboard', { email: useremail, password: userpassword });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/user_signup', async (req, res) => {
  var email = req.body.useremail;
  var password = req.body.userpassword;
  // Check if email and password are present
  if (!password || !email) {
    return res.status(400).send('Email and password are required.');
  }
  try {
    // Assuming you have a User model named userlogin
    await userlogin.create({ email: email, password: password });

    // Redirect to the login page after successful signup
    res.render('admindashboard');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal Server Error');
  }
});

// Assuming you have already defined your userlogin model and app variable

app.get('/viewusers', async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await userlogin.find();
    // console.log(users);
    // Render the viewusers.ejs template with the users data
    res.render('viewusers', { users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Assuming you have an Express app instance named 'app'
app.get('/view_user/:email', async (req, res) => {
  try {
    const email = req.params.email;

    // Fetch user details from the database based on the email
    const user = await userlogin.findOne({ email });
    // console.log(user);
    if (!user) {
      // If user not found, handle accordingly (e.g., redirect to an error page)
      return res.status(404).send('User not found');
    }

    // Render the user details in the side nav
    const userDetailsHTML = `
          <h2>${user.name}</h2>
          <p>Email: ${user.email}</p>
          <img src="/images/${user.image}" alt="Profile Image" width="100px" height="100px">
          <h1 style="color:red;">Status: ${user.status}</h1>

          <!-- Add more details as needed -->
      `;

    // Send the user details HTML to the client
    res.send(userDetailsHTML);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/accept_user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
      // Update the user status to "Accepted By Admin"
      const updatedUser = await userlogin.findByIdAndUpdate(userId, { status: 'Accepted By Admin' }, { new: true });

      if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Send a JSON response indicating success
      res.json({ message: 'User accepted successfully.' });
  } catch (error) {
      console.error('Error during acceptance:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/delete_user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
      // Update the user status to "Not Accepted By Admin"
      const updatedUser = await userlogin.findByIdAndUpdate(userId, { status: 'Not Accepted By Admin' }, { new: true });

      if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Send a JSON response indicating success
      res.json({ message: 'User marked as not accepted by admin.' });
  } catch (error) {
      console.error('Error during deletion:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: './public/images',
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/jpeg' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/gif'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error('Only jpeg, jpg, png, and gif images are allowed.'));
    }
  }
});

// Update user data route for single image
app.post('/submit_user_form', upload.single('image'), async (req, res) => {
  try {
    const { name, email, status } = req.body;

    const updatedUser = await userlogin.findOneAndUpdate(
      { email: email },
      {
        $set: {
          name: name,
          image: req.file.filename,
          status: status
          // Add other fields as needed
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send('User not found');
    }

    res.status(200).send('User data updated successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})