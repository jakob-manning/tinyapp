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

// 'get' the home page which displays all stored urls;
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// 'get' the url post page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Add new url page
app.post("/urls/new", (req, res) => {
  const generateRandomString = () => {
    return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
  };
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
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// 'get' the given short url page which redirects the page to the longURL
// basically, the /urls/:shortURL has a href which directs to this page, which then uses
// this function to direct to the actual longURL page.
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// adding a login POST function;
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  console.log(req.body.username); //keep here for now, see what username is passed
  res.redirect('/urls');
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
