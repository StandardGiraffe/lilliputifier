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

const createNewUser = function (id, email, password) {
  const newRecord = {
    "id": id,
    "email": email,
    "password": password
  };

  return newRecord;
};



// ######
// Routing:
// ######
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n")
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {

  // I believe what we're doing here is instantiating an object to contain the url database, and then passing that as a variable into urls_index, where it can be called (and iterated through).
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
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


// USER REGISTRATION:
// Registration page:
app.get("/register", (req, res) => {
  res.render("register");
});

// Register based on input:
app.post("/register", (req, res) => {
  userEmail = req.body.email;
  userPassword = req.body.password;

  // console.log (userEmail, userPassword);
  generatedID = generateRandomString(6);
  const newUser = createNewUser(generatedID, userEmail, userPassword);

  usersDB[generatedID] = newUser;

  console.log(`The complete database is\n\n${JSON.stringify(usersDB)}`);

  res.redirect("/urls")
});



// Receives a login request and username
app.post("/login", (req, res) => {
  console.log(`Login request received from ${req.body.username}.`);
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

// Receives a logout request
app.post("/logout", (req, res) => {
  console.log(`Logout request received.  Destroying cookie!`);
  res.clearCookie("username");
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
    "username": req.cookies["username"]
  };

  res.render("urls_show", templateVars);
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});

// Alphanumeric random ID generator.  Adapted from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function generateRandomString(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};
