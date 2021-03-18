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
const { isUserValid } = require("./helpers");


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

  const user = isUserValid(req.session.user_id, users);
  const urls = userUrls(req.session.user_id, urlDatabase);
  const templateVars = { user, urls };

  res.render("urls_index", templateVars);
});

// 'get' the 'add new url' page. If they are not logged in, do not alow 
// them to access this page
app.get("/urls/new", (req, res) => {

  const user = isUserValid(req.session.user_id, users);

  if (!user) {
    res.redirect("/login");
    return;
  }
  
  if (user) {
    const templateVars = { user }
    res.render("urls_new", templateVars);
  }
});

// POST function for new url page: function adds given url into url database
// with the longurl and the userID of person logged in.
// The function will not run for non-registered users
app.post("/urls/new", (req, res) => {

  if (!isUserValid(req.session.user_id, users)) {
    res.redirect("/login");
    return;
  }

  if (isUserValid(req.session.user_id, users)) {
    const newShortUrl = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.session.user_id;
    urlDatabase[newShortUrl] = { longURL, userID }; 

    res.redirect(`/urls/${newShortUrl}`);
  }


});

// 'get' the generated shortURL page. Page displays the short and long url.
// return forbidden access error if not logged in
// returns invalid 'tinyURL given' if given a tinyURL that doesn't exist
app.get("/urls/:id", (req, res) => {

  const user = isUserValid(req.session.user_id, users);
  const urlInfo = urlDatabase[req.params.id];

  if (!urlInfo) {
    res.statusCode = 404;
    res.end('This tinyURL does not exist in database');
    return;
  }

  if (!(urlInfo.userID === user.id)) {
    res.statusCode = 403;
    res.end('Please login, you do not have access to this page');
    return;
  }

  if (urlInfo.userID === user.id) {
    const shortURL = req.params.id;
    const longURL = urlDatabase[req.params.id].longURL;
  
    const templateVars = { user, shortURL, longURL } 

    res.render("urls_show", templateVars);

  }

});

// Delete an existing url
app.post("/urls/:id/delete", (req, res) => {

  const user = isUserValid(req.session.user_id, users);
  const urlUser = urlDatabase[req.params.id].userID;

  if (!user) {
    res.redirect(`/login`);
    return;
  }

  if (user.user_id === urlUser) {
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } 

});

// Edit an existing url
app.post("/urls/:id", (req, res) => {

  const user = isUserValid(req.session.user_id, users);
  const urlInfo = urlDatabase[req.params.id];

  if (!user) {
    res.redirect(`/login`);
    return;
  }

  if (user.user_id === urlUser.userID) {
    urlInfo.longURL = req.body.longURL;
    res.redirect(`/urls`);
  }

});

// 'get' the given short url page which redirects the page to the longURL
// basically, the /urls/:shortURL has a href which directs to this page, which then uses
// this function to direct to the actual longURL page.
// This page should be accessable for all users, whether logged in or not
app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
  else {
    res.statusCode = 404;
    res.end('Sorry, page not found. Please check the url given is valid');
  }
});

// 'get' page for login
app.get("/login", (req, res) => {

  const user = isUserValid(req.session.user_id, users);
  const templateVars = { user };
  res.render("login", templateVars);
});

// login POST function;
app.post("/login", (req, res) => {

  // Are you an existing user?
  const user = getUserByEmail(req.body.email, users);

  if (!user) {
    res.statusCode = 403;
    res.end('no user by this email address was found.');
    return;
  }

  const passwordEntry = req.body.password;
  const passwordStored = existingUser.password;

  if (!bcrypt.compareSync(passwordEntry, passwordStored)) {
    res.statusCode = 404;
    res.end('invalid login credentials: user exists but password is wrong.');
    return;
  }

  if (bcrypt.compareSync(passwordEntry, passwordStored)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  }

});

// logout POST function;

app.post("/logout", (req, res) => {

  req.session = null;
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

app.get("/*", (req, res) => {
  isUserValid(req.session.user_id, users) ? res.redirect('/urls') : res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});