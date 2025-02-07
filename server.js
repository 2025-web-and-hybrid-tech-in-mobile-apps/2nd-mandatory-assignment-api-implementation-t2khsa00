const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // for parsing application/json

//------SOLUTION-----//

// Import necessary modules
const passport = require('passport');
const jwtStrategy = require('passport-jwt').Strategy;
const extractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');

// Secret key for JWT
const secretKey = 'helloFriend_2002';

// JWT validation configuration
const JwtValidation = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey
};

// User information storage
const userInformation = {
  userHandle: "",
  password: ""
}

// Configure passport to use JWT strategy
passport.use(new jwtStrategy(JwtValidation, function (payload, done) {
  if (payload.user === userInformation.userHandle) {
    return done(null, { user: payload.user });
  } else {
    return done(null, false);
  }
}));

// Storage for high scores
const scoreInformation = [{ level: "", userHandle: "", score: "", timestamp: "" }];

// Endpoint for user signup
app.post('/signup', (req, res) => {
  const { userHandle, password } = req.body;

  // Validate userHandle and password
  if (!userHandle || !password || userHandle.length < 6 || password.length < 6) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Save user information
  userInformation.userHandle = userHandle;
  userInformation.password = password;

  // Respond with success
  res.status(201).send("User registered successfully");
});

// Endpoint for user login
app.post('/login', (req, res) => {
  const accessToken = jwt.sign({ user: userInformation.userHandle }, secretKey);
  const { userHandle, password } = req.body;

  // Validate request body
  if (!userHandle || !password || Object.keys(req.body).length > 2 || typeof userHandle !== 'string' || typeof password !== 'string') {
    return res.status(400).send("Bad request");
  }

  // Check user credentials
  if (userHandle === userInformation.userHandle && password === userInformation.password) {
    res.json({ 'jsonWebToken': accessToken });
  } else {
    res.status(401).json({ error: "Unauthorized, incorrect username or password" });
  }
});

// Endpoint for posting high scores
app.post('/high-scores', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;

  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized, JWT token is missing or invalid" });
  }

  // Validate request body
  if (!level || !userHandle || !score || !timestamp) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  // Save new high score
  const newPost = {
    level: level,
    userHandle: userHandle,
    score: score,
    timestamp: timestamp
  }
  scoreInformation.push(newPost);

  // Respond with success
  res.status(201).send("High score posted successfully");
});

// Endpoint for retrieving high scores
app.get('/high-scores', async (req, res) => {
  try {
    const { level, page } = req.query;

    // Validate level query parameter
    if (!level) {
      return res.status(400).json({ error: "Level is required" });
    }

    // Filter and sort scores
    const filteredScores = scoreInformation.filter(score => score.level === level);
    const sortedScores = filteredScores.sort((a, b) => b.score - a.score);

    // Handle pagination
    const pageLimit = 20;
    const currentPage = parseInt(page, 10) || 1;
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = currentPage * pageLimit;

    // Slice the scores array for pagination
    const paginatedScores = sortedScores.slice(startIndex, endIndex);

    // Return paginated scores
    return res.status(200).json(paginatedScores);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

// Start and close server functions
let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};
