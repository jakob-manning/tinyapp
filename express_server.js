const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
const bcrypt = require('bcrypt');

// ----------------------------------//
// MiddleWare
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

// ----------------------------------//
// Helper functions
const { generateRandomString } = require("./helpers");
const { userUrls } = require("./helpers");
const { getUserByEmail } = require("./helpers");
const { isCookieValid } = require("./helpers");


//----------------------------------//
// Data

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "eeeeee" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "eeeeee" }
};

const password1 = bcrypt.hashSync('e', 10);
const password2 = bcrypt.hashSync('2', 10);
const users = { 
  "eeeeee": {
    id: "eeeeee", 
    email: "e@e.e",
    password: password1
  },
 "222222": {
    id: "222222", 
    email: "2@2.2", 
    password: password2
  }
};

//----------------------------------//
// GET and POST requests

// 'get' the home page which displays all stored urls;
app.get("/urls", (req, res) => {

  const templateVars = {
    urls: userUrls(req.session.user_id, urlDatabase),
    'user_id': users[req.session.user_id]
  }
  res.render("urls_index", templateVars);
});

// 'get' the add new url page. If they are not logged in, do not alow 
// them to access this page
app.get("/urls/new", (req, res) => {

  if (isCookieValid(req.session.user_id, users)) {
    const templateVars = {
      'user_id'  : users[req.session.user_id]
    }
    res.render("urls_new", templateVars);
  }
  
  else {
    res.redirect("/login");
  }
});

// POST function for new url page
app.post("/urls/new", (req, res) => {

  if (isCookieValid(req.session.user_id, users)) {
    newShortUrl = generateRandomString();

    urlDatabase[newShortUrl] = { 
      'longURL': req.body.longURL, 
      'userID': req.session.user_id
    }; 
    res.redirect(`/urls/${newShortUrl}`);
  }

});

// 'get' the generated shortURL page
app.get("/urls/:shortURL", (req, res) => {

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    'user_id': users[req.session.user_id]
  }

  res.render("urls_show", templateVars);
});

// Delete an existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect(`/urls`);
  } 
  
  else {
    res.redirect(`/login`);
  }

});

// Edit an existing url
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.session.user_id) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    console.log('urlDatabase', urlDatabase);
    res.redirect(`/urls`);
  }

  else {
    res.redirect(`/login`);
  }

});

// 'get' the given short url page which redirects the page to the longURL
// basically, the /urls/:shortURL has a href which directs to this page, which then uses
// this function to direct to the actual longURL page.
// This page should be accessable for all users, whether logged in or not
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// 'get' page for login
app.get("/login", (req, res) => {
  const templateVars = {
    'user_id'  : users[req.session.user_id]
  }
  res.render("login", templateVars);
});

// login POST function;
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  const user_id = user.id;

  if (user_id) {
    const passwordEntry = req.body.password;
    const passwordStored = users[user_id].password;
    if(bcrypt.compareSync(passwordEntry, passwordStored)) {
      req.session.user_id = user_id;
      res.redirect('/urls');
    } else {
      res.statusCode = 404;
      res.end('invalid login credentials');
    }
  }

  else if (!user_id) {
    res.statusCode = 403;
    res.end('no email address found');
  }

  else {
    res.statusCode = 404;
    res.end('invalid login credentials');
  }
});

// logout POST function;
app.post("/logout", (req, res) => {
  // console.log(users['user_id'])
  res.clearCookie('session');
  res.redirect('/urls');
});

// 'get the register new user page:
app.get("/register", (req, res) => {
  const templateVars = {
    'user_id'  : users[req.session.user_id]
  }
  res.render("register",templateVars)
});

// register POST function 
// has 2 error handling conditions:
// first if handles if either email or password has a empty space in it
// second if handles if email is a previously stored email.

app.post("/register", (req, res) => {

  if (req.body.email.includes(' ') ||
      req.body.password.includes(' ')) {
    res.statusCode = 404;
    res.end('put in proper email and password');
  }
  
  else if (getUserByEmail(req.body.email, users)) {
    res.statusCode = 404;
    res.end('email Already used');
  }
  
  else {
  const id = generateRandomString();
  const email = req.body.email;
  const password = bcrypt.hashSync(req.body.password, 10);
  users[id] = { id, email, password };
  req.session.user_id = id;
  res.redirect('/urls');
  console.log(users[id]);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});