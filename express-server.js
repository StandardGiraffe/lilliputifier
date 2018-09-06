// ######
// Require dependencies:
// ######

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser=require("cookie-parser");



// ######
// Global constants:
// ######
const PORT = 8080;



// ######
// Middleware Initialization:
// ######
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());



// ######
// Databases
// ######

// Shortened URLs:
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const newRecord = {
    "id": id,
    "email": email,
    "password": password
  };

  // Adds the new accout object to the database so that the key name matches the random ID
  usersDB[id] = newRecord;
  return newRecord;
};

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
    const user = usersDB[record]
    if (user.email === email) {
      return user; // returns that whole record
    }
  }
  return null;
}

const findUsernameById = function (userID) {
  for (let record in usersDB) {
    const user = usersDB[record]
    if (user.id === id) {
      return user.email;
    }
  }
  return null;
}


// Built by Robert...
const authenticateUser = (email, password) => {
  const user = findUserByEmail(email)
  if (user && user.password === password) {
    return user
  } else {
    return null
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
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {

  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["user_id"],
    users: usersDB
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // debug statement to see POST parameters
  let newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = req.body.longURL;
  res.redirect("/urls/" + newShortURL);
  // res.send(urlDatabase); // Respond with "Ok" (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
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

    res.cookie("user_id", findUserByEmail(userEmail).id);
    res.redirect("/urls")

  }

});



// Receives a login request and username
app.post("/login", (req, res) => {
  console.log(`Login request received from ${req.body.username}.`);

  if (!findUserByEmail(req.body.email) || findUserByEmail(req.body.email).password !== req.body.password) {
    res.status(403);
    res.send("Your email and password don't match, Bub.");
  } else {

    res.cookie("user_id", findUserByEmail(req.body.email).id);
    res.redirect("/");
  }

});

// Receives a logout request
app.post("/logout", (req, res) => {
  console.log(`Logout request received.  Destroying cookie!`);
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// Deletes a record.
app.post("/urls/:id/delete", (req, res) => {
  console.log("Deleted the record for " + urlDatabase[req.params.id]);
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

// Updates Lilliput pointers
app.post("/urls/:id", (req, res) => {
  console.log("Got a request for Lilliput " + req.params.id + " to update from\n" + urlDatabase[req.params.id] + " to " + req.body.fullURL);
  urlDatabase[req.params.id] = req.body.fullURL;
  console.log(`DONE: www.lilli.put/${req.params.id} now points to ${urlDatabase[req.params.id]}\n`);
  res.redirect("/urls");
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    "shortURL": req.params.id,
    "fullURL": urlDatabase[req.params.id],
    "username": req.cookies["user_id"],
    "users": usersDB
  };

  res.render("urls_show", templateVars);
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

