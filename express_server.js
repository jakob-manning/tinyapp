const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieParser());


//----------------------------------//

// Data

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "eeeeee" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "eeeeee" }
};
const users = { 
  "eeeeee": {
    id: "eeeeee", 
    email: "e@e.e",
    password: "e"
  },
 "abcdef": {
    id: "abcdef", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};
// ----------------------------------//


// This function is used to generate IDs or shortURLS

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

// This function is used to check whether an email given by user
// matches an email already stored in our database
// returns six digit user_id if match, empty string if no match found

const isEmailAlreadyUsed = (email) => {
  let user_id = '';
  for (const user in users) {
    if (users[user].email === email) {
      user_id = user;
    }
  }
  return user_id;
};

// Function that checks whether a person is logged in as registered user
// Takes user_id and makes sure users[user_id] = truthy;

const isCookieValid = user_id => users[user_id] !== undefined;


//----------------------------------//


// 'get' the home page which displays all stored urls;
app.get("/urls", (req, res) => {
  
  const userUrls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === req.cookies['user_id']) {
      userUrls[url] = urlDatabase[url].longURL;
    }
  }
  console.log(userUrls);

  const templateVars = {
    urls: userUrls,
    'user_id': users[req.cookies['user_id']]
  }

  res.render("urls_index", templateVars);
});

// 'get' the add new url page. If they are not logged in, do not alow 
// them to access this page
app.get("/urls/new", (req, res) => {

  if (isCookieValid(req.cookies['user_id'])) {
    const templateVars = {
      'user_id'  : users[req.cookies['user_id']]
    }
    res.render("urls_new", templateVars);
  }
  
  else {
    res.redirect("/login");
  }
});

// POST function for new url page
app.post("/urls/new", (req, res) => {

  if (isCookieValid(req.cookies['user_id'])) {
    newShortUrl = generateRandomString();

    urlDatabase[newShortUrl] = { 
      'longURL': req.body.longURL, 
      'userID': req.cookies['user_id']
    }; 
    res.redirect(`/urls/${newShortUrl}`);
  }

});

// 'get' the generated shortURL page
app.get("/urls/:shortURL", (req, res) => {

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    'user_id': users[req.cookies['user_id']]
  }

  res.render("urls_show", templateVars);
});

// Delete an existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls`);
});

// Edit an existing url
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].userID === req.cookies['user_id']) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
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
    'user_id'  : users[req.cookies['user_id']]
  }
  res.render("login", templateVars);
});

// login POST function;
app.post("/login", (req, res) => {
  user_id = isEmailAlreadyUsed(req.body.email);
  if (user_id && req.body.password === users[user_id].password) {
      res.cookie('user_id', user_id);
      res.redirect('/urls');
      console.log(users[id]);
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
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// 'get the register new user page:
app.get("/register", (req, res) => {
  const templateVars = {
    'user_id'  : users[req.cookies['user_id']]
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
  
  else if (isEmailAlreadyUsed(req.body.email)) {
    res.statusCode = 404;
    res.end('email Already used');
  }
  
  else {
  id = generateRandomString();
  email = req.body.email;
  password = req.body.password;
  users[id] = { id, email, password };
  res.cookie('user_id', id);
  res.redirect('/urls');
  console.log(users[id]);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
