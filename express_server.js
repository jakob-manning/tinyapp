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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "12sM3I": "http://www.youtube.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};
// This function is used to generate IDs or shortURLS

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

// 'get' the home page which displays all stored urls;
app.get("/urls", (req, res) => {

  const templateVars = {
    urls: urlDatabase,
    'user_id'  : users[req.cookies['user_id']]
  }
  console.log(templateVars.user_id);
  res.render("urls_index", templateVars);
});

// 'get' the url post page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    'user_id'  : users[req.cookies['user_id']]
  }
  res.render("urls_new", templateVars);
});

// Add new url page
app.post("/urls/new", (req, res) => {
  newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = req.body.longURL; 
  res.redirect(`/urls/${newShortUrl}`);
});

// Delete an existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls/`);
});

// Edit an existing url
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/`);
});

// 'get' the generated shortURL page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], 'user_id'  : users[req.cookies['user_id']]};
  res.render("urls_show", templateVars);
});

// 'get' the given short url page which redirects the page to the longURL
// basically, the /urls/:shortURL has a href which directs to this page, which then uses
// this function to direct to the actual longURL page.
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// login POST function;
app.post("/login", (req, res) => {
  res.cookie('user_id', req.body.user_id);
  console.log(req.body['user_id']); //keep here for now, see what username is passed
  res.redirect('/urls');
});
// logout POST function;
app.post("/logout", (req, res) => {
  console.log(users['user_id'])
  res.clearCookie('user_id');
  res.redirect('/urls/');
});

// 'get the register new user page:
app.get("/register", (req, res) => {
  const templateVars = {
    'user_id'  : users[req.cookies['user_id']]
  }
  console.log(req.body);
  res.render("register",templateVars)
});

// register POST function 
app.post("/register", (req, res) => {
  id = generateRandomString();
  email = req.body.email;
  password = req.body.password;
  users[id] = { id, email, password };
  res.cookie('user_id', id);
  res.redirect('/urls');
  console.log(users[id]);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
