// Require dependencies
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser=require("cookie-parser");

const PORT = 8080;

// Initializing viewing engine: ejs
app.set("view engine", "ejs");

// Passes all incoming signals through the parser.
app.use(bodyParser.urlencoded({extended: true}));


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
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
    "fullURL": urlDatabase[req.params.id]
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
