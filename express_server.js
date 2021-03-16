const express = require('express');
const app = express();
const PORT = 8080; // default port 8080'
const morgan = require('morgan')
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('short'));

app.set('view engine', 'ejs');


//-------------- DATA --------------//

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//-------------- ROUTING --------------//

app.get('/', (req, res) => {
  res.send('Hello');
});

app.post('/login', (req, res) => {
  userNameStr = req.body["userName"];
  res.cookie('username', userNameStr);
  res.redirect('/urls')
});

app.post('/logout', (req, res) => {
  // clear the cookies
  res.clearCookie('username');
  // redirect to //urls
  res.redirect('/urls')
});

app.get('/urls', (req, res) => {
  const usernameCookie = req.cookies["username"];
  const templateVars = { urls: urlDatabase, username: usernameCookie}
  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => { 
  const usernameCookie = req.cookies["username"];
  const templateVars = {username: usernameCookie}
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  let newKey = generateRandomString(6); 
  inputUrl = req.body.longURL;
  let httpUrl = returnUrlWithHttp(inputUrl);
  urlDatabase[newKey] = httpUrl;
  const usernameCookie = req.cookies["username"];
  const templateVars = {username: usernameCookie}
  res.redirect(`/urls/${newKey}`, templateVars); 

});

// our URLs show page display 
app.get('/urls/:shortURL', (req, res) => { 
  const shortUrl = req.params.shortURL;
  const longUrl = urlDatabase[req.params.shortURL];
  const usernameCookie = req.cookies["username"];
  const templateVars = { shortURL: shortUrl, longURL: longUrl, username: usernameCookie};
  res.render("urls_show", templateVars);
});

// when we enter a new URL
app.get('/u/:shortUrl', (req, res) => {
  const longUrl = urlDatabase[req.params.shortUrl]
  return res.redirect(!returnUrlWithHttp(longUrl))
})

app.post('/urls/:shortUrl/delete', (req, res) => {
  let shortUrl = req.params.shortUrl;
  delete urlDatabase[shortUrl];
  res.redirect('/urls');
});


// localhost:8080/u/b2xVn2
// localhost:8080/
// localhost:8080/urls
// localhost:8080/urls/new

// <------------ Helper Functions --------------->

const returnUrlWithHttp = (url) => {
  if ((!url.startsWith('http')) && (!url.startsWith('https'))) {
    return `http:/${url}`;
  } else {
    return url;
  }
}

function generateRandomString(length) {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  } 
  return result;
}

// <------- Listening -------->

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});