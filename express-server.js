// ######
// Require dependencies:
// ######
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
// const cookieParser=require("cookie-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");


// ######
// Global constants:
// ######
const PORT = 8080;
const saltRounds = 10;


// ######
// Middleware Initialization:
// ######
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["flabbahbabbahwoopwoopwoop"]
}));



// ######
// Databases
// ######

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

  "newstyle83419": {
    shortURL: "newstyle83419",
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


// ######
// Functions:
// ######

// Generates a new user account object with supplied credentials.
const createNewUser = function (email, password) {
  const id = generateRandomString(6);

  // Hash password:
  hashedPassword = bcrypt.hashSync(password, saltRounds);
  console.log(`Password ${password} has been hashed to ${hashedPassword}`)

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
}


// Alphanumeric random ID generator.  Adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
const generateRandomString = function (length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

const findUserByEmail = function (email) {
  for (let record in usersDB) {
    const user = usersDB[record];
    if (user.email === email) {
      return user; // returns that whole record
    }
  }
  return null;
}

const findUserByID = function (id) {
  for (let record in usersDB) {
    const user = usersDB[record];
    if (user.id === id) {
      return user;
    }
  }
  return null;
}

// Checks authorship of a shortURL
const findURLsByUser = function (user_id) {
  const userURLDB = [];

  for (let record in urlDB) {
    if (urlDB[record].ownerID === user_id) {
      userURLDB.push(urlDB[record]);
    }
  }
  return userURLDB;
}


// Adapted from build by Robert...
const authenticateUser = (email, password) => {
  const user = findUserByEmail(email);
  // const passwordCheck = bcrypt.compareSync(password, user.password);

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return null;
  }
  //return user && user.password === password ? user : null
}


// ######
// Routing:
// ######
app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/urls.json", (req, res) => {
  res.json(urlDB);
});

app.get("/urls", (req, res) => {

  if (!findUserByID(req.session.user_id)) {
    res.redirect("/login");
  } else {

    let templateVars = {
      urlDB: findURLsByUser(req.session.user_id),
      username: req.session.user_id,
      users: usersDB
    }
    console.log("Current DB contains: " + findURLsByUser(req.session.user_id));
    res.render("urls_index", templateVars);
  }
});


app.get("/urls/new", (req, res) => {

  if (!findUserByID(req.session.user_id)) {
    res.redirect("/login");
  } else {

    let templateVars = {
      username: req.session.user_id,
      users: usersDB
    }
    res.render("urls_new", templateVars);

  }

});

// Creates a new shortened URL
app.post("/urls", (req, res) => {
  console.log(req.body); // debug statement to see POST parameters
  let newShortURL = generateRandomString(8);
  createNewURL(newShortURL, req.body.longURL, req.session.user_id);

  res.redirect("/urls/" + newShortURL);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDB[shortURL].longURL;
  res.redirect(longURL);
});

// Login page
app.get("/login", (req, res) => {
  res.render("urls_login");
});


// USER REGISTRATION:
// Registration page:
app.get("/register", (req, res) => {
  res.render("register");
});

// Register based on input:
app.post("/register", (req, res) => {

  // Handle registration errors:
  if (req.body.password !== req.body.confirmPassword || !req.body.password || !req.body.email) {
    res.send("Problem with supplied credentials.  Check email and ensure passwords match.");
    res.status(400);  // Password mismatch, no password supplied, no email supplied

  } else if (findUserByEmail(req.body.email)) {
    res.send("This email already exists in our database.  Please use a different one.");
    res.status(400);  // supplied email matches another email in the database

  } else {
    // Otherwise, it works!

    // Get the user-input from the forms and name them.
    userEmail = req.body.email;
    userPassword = req.body.password;

    // Build the new account object
    createNewUser(userEmail, userPassword);

    // console.log(`The complete database is\n\n${JSON.stringify(usersDB)}`); // Prove the record was added.

    req.session.user_id = findUserByEmail(userEmail).id;
    res.redirect("/urls")

  }

});



// Receives a login request and username
app.post("/login", (req, res) => {
  console.log(`Login request received from ${req.body.username}.`);

  // if (!findUserByEmail(req.body.email) || findUserByEmail(req.body.email).password !== req.body.password) {
  if (!authenticateUser(req.body.email, req.body.password)) {
    res.status(403);
    res.send("Your email and password don't match, Bub.");
  } else {

    req.session.user_id = findUserByEmail(req.body.email).id;
    res.redirect("/");
  }

});

// Receives a logout request
app.post("/logout", (req, res) => {
  console.log(`Logout request received.  Destroying cookie!`);
  req.session.user_id = null;
  res.redirect("/urls");
});

// Deletes a record if it was authored by the current user.
app.post("/urls/:id/delete", (req, res) => {

  //  Check to see if the shortURL's owner is the current user.
  if (urlDB[req.params.id].ownerID !== req.session.user_id) {
    res.status(401);
    res.send(`'T'isn't thine to smite.`);
  } else {

    console.log("Deleted the record for " + urlDB[req.params.id]);
    delete urlDB[req.params.id];
    res.redirect("/urls");

  }

})

// Updates Lilliput pointers
app.post("/urls/:id", (req, res) => {

  console.log("Got a request for Lilliput " + req.params.id + " to update from\n" + urlDB[req.params.id].longURL + " to " + req.body.longURL);
  urlDB[req.params.id].longURL = req.body.longURL;
  console.log(`DONE: www.lilli.put/${req.params.id} now points to ${urlDB[req.params.id].longURL}\n`);
  res.redirect("/urls");

})

app.get("/urls/:id", (req, res) => {
  if (urlDB[req.params.id].ownerID !== req.session.user_id) {
    res.status(401);
    res.send(`This isn't your URL.`);

  } else {
    let templateVars = {
      "shortURL": urlDB[req.params.id].shortURL,
      "longURL": urlDB[req.params.id].longURL,
      "username": req.session.user_id,
      // "urlDB": urlDB[req.params.id],
      "users": usersDB
    };

    res.render("urls_show", templateVars);
  };
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

