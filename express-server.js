// #####################
// Require Dependencies:
// #####################
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");


// #################
// Global Constants:
// #################
const PORT = 8080;
const saltRounds = 10;


// ##########################
// Middleware Initialization:
// ##########################
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["flabbahbabbahwoopwoopwoop"]
}));


// #########
// Databases
// #########

// Shortened URLs:
const urlDB = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    ownerID: "user2example"
  },

  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    ownerID: "user1example",
  },

  "83419d": {
    shortURL: "83419d",
    longURL: "www.example.com",
    ownerID: "user2example"
  }
};

// Users:
const usersDB = {
  "user1example": {
    id: "randomIDHere",
    email: "user@example.com",
    password: "examplePasswordetc"
  },

  "user2example": {
    id: "raldkjf;lsa",
    email: "hello@frog.com",
    password: "sdlsajfd;ldsjf"
  }
};


// ##########
// Functions:
// ##########

const createNewUser = function (email, password) {
  const id = generateRandomString(6);

  // Hash password:
  hashedPassword = bcrypt.hashSync(password, saltRounds);

  const newRecord = {
    "id": id,
    "email": email,
    "password": hashedPassword
  };

  // Adds the new accout object to the database so that the key name matches the random ID
  usersDB[id] = newRecord;
  return newRecord;
};

const createNewURL = function (shortURL, longURL, ownerID) {
  const newRecord = {
    "shortURL": shortURL,
    "longURL": longURL,
    "ownerID": ownerID
  };

  urlDB[shortURL] = newRecord;
};

// Alphanumeric random ID generator.  Adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
const generateRandomString = function (length) {
  let outputString = "";
  const characterPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    outputString += characterPool.charAt(Math.floor(Math.random() * characterPool.length));

  return outputString;
}

const findUserByEmail = function (email) {
  for (let record in usersDB) {
    const user = usersDB[record];
    if (user.email === email) {
      return user; // returns that whole record
    }
  }
  return null;
};

const findUserByID = function (id) {
  for (let record in usersDB) {
    const user = usersDB[record];
    if (user.id === id) {
      return user;
    }
  }
  return null;
};

// Return a database of URL records belonging to the provided user_id
const findURLsByUser = function (user_id) {
  const userURLDB = [];

  for (let record in urlDB) {
    if (urlDB[record].ownerID === user_id) {
      userURLDB.push(urlDB[record]);
    }
  }
  return userURLDB;
};

const authenticateUser = (email, password) => {
  const user = findUserByEmail(email);

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return null;
  }
};


// ########
// Routing:
// ########

// ## Diagnostics: ##
/*
// DIAGNOSTIC: View the complete URL database.  KEEP OFF BY DEFAULT.
app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});
*/

/*
// DIAGNOSTIC: View the complete user database.  KEEP OFF BY DEFAULT.
app.get("/users.json", (req, res) => {
  res.json(usersDB);
});
*/


// ## Redirects: ##

// Redirect unspecified traffic to the main page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// New user registration page
app.get("/register", (req, res) => {
  res.render("register");
});

// Login page
app.get("/login", (req, res) => {
  res.render("urls_login");
});

// Redirect user to the long URL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});

// Index page: Display current user's URLs or redirect unregistered user to login/register
app.get("/urls", (req, res) => {

  if (!findUserByID(req.session.user_id)) {
    res.redirect("/login");

  } else {
    let templateVars = {
      urlDB: findURLsByUser(req.session.user_id),
      username: req.session.user_id,
      users: usersDB
    };

    res.render("urls_index", templateVars);
  }
});

// New URL form or redirect unregistered users to login/register
app.get("/urls/new", (req, res) => {

  if (!findUserByID(req.session.user_id)) {
    res.redirect("/login");

  } else {
    let templateVars = {
      username: req.session.user_id,
      users: usersDB
    };

    res.render("urls_new", templateVars);
  }
});

// Update existing shortened URL page if owned by current user
app.get("/urls/:id", (req, res) => {
  if (urlDB[req.params.id].ownerID !== req.session.user_id) {
    res.status(401);
    res.send(`This isn't your URL.`);

  } else {
    let templateVars = {
      "shortURL": urlDB[req.params.id].shortURL,
      "longURL": urlDB[req.params.id].longURL,
      "username": req.session.user_id,
      "users": usersDB
    };

    res.render("urls_show", templateVars);
  }
});


// ## User-Driven Record Management ##

// Creates a new shortened URL
app.post("/urls", (req, res) => {
  let newShortURL = generateRandomString(8);
  createNewURL(newShortURL, req.body.longURL, req.session.user_id);

  res.redirect("/urls/" + newShortURL);
});

// Updates an existing shortened URL to point to another location
app.post("/urls/:id", (req, res) => {
  urlDB[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// Deletes a shortened URL if it was authored by the current user.
app.post("/urls/:id/delete", (req, res) => {
  //  Check to see if the shortURL's owner is the current user.
  if (urlDB[req.params.id].ownerID !== req.session.user_id) {
    res.status(401);
    res.send(`'T'isn't thine to smite.`);

  } else {
    delete urlDB[req.params.id];
    res.redirect("/urls");
  }
});

// Registers a new user record
app.post("/register", (req, res) => {

  // Handle registration errors:
  if (req.body.password !== req.body.confirmPassword || !req.body.password || !req.body.email) {
    res.send("Problem with supplied credentials.  Check email and ensure passwords match.");
    res.status(400);  // Password mismatch, no password supplied, no email supplied

  } else if (findUserByEmail(req.body.email)) {
    res.send("This email already exists in our database.  Please use a different one.");
    res.status(400);  // supplied email matches another email in the database

  } else {
    userEmail = req.body.email;
    userPassword = req.body.password;

    createNewUser(userEmail, userPassword);

    req.session.user_id = findUserByEmail(userEmail).id;
    res.redirect("/urls")

  }
});


// ## Account Management ##

// User login
app.post("/login", (req, res) => {
  console.log(`Login request received from ${req.body.username}.`);

  if (!authenticateUser(req.body.email, req.body.password)) {
    res.status(403);
    res.send("Your email and password don't match, Bub.");

  } else {
    req.session.user_id = findUserByEmail(req.body.email).id;
    res.redirect("/");
  }
});

// User logout
app.post("/logout", (req, res) => {
  console.log(`Logout request received.  Destroying cookie!`);
  req.session.user_id = null;
  res.redirect("/urls");
});


// ## Listener: ##

app.listen(PORT, () => {
  console.log(`Lilliputifier is listening on port ${PORT}!`)
});