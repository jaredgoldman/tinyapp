const express = require("express");
const app = express();
const PORT = 8080; // default port 8080'
const morgan = require('morgan')
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('short'));


function generateRandomString(length) {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  } 
  return result;
}

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set('view engine', 'ejs');

//-------------- ROUTING --------------//

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase }
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => { 
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let newKey = generateRandomString(6);        // Respond with 'Ok' (we will replace this)
  urlDatabase[newKey] = req.body.longURL;
  res.redirect(`/urls/${newKey}`); 
});

app.get('/urls/:shortURL', (req, res) => { 
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]};
  res.render("urls_show", templateVars);
});

app.get('/u/:shortUrl', (req, res) => {
  const longUrl = urlDatabase[req.params.shortUrl]
  if (!doesUrlHaveHttp(longUrl)) {
    res.redirect(`http://${longUrl}`)
  } 
  res.redirect(longUrl);
})

app.post('/urls/:shortUrl/delete', (req, res) => {
  let shortUrl = req.params.shortUrl;
  console.log(shortUrl)
  delete urlDatabase[shortUrl];
  res.redirect('/urls');
});

const doesUrlHaveHttp = (url) => {
  return url.startsWith('http');
}

// localhost:8080/u/b2xVn2
// localhost:8080/
// localhost:8080/urls
// localhost:8080/urls/new

// <------- Listening -------->

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});