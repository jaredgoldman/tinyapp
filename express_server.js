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
  res.send('I AM ROOT');
});

// user login
app.post('/login', (req, res) => {
  userNameStr = req.body["userName"];
  res.cookie('username', userNameStr);
  res.redirect('/urls')
});

// user logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls')
});

// send page with URL index
app.get('/urls', (req, res) => {
  const usernameCookie = req.cookies["username"];
  const templateVars = { urls: urlDatabase, username: usernameCookie}
  res.render('urls_index', templateVars);
});

// send page with new URL form
app.get('/urls/new', (req, res) => { 
  const usernameCookie = req.cookies["username"];
  const templateVars = {username: usernameCookie}
  res.render("urls_new", templateVars);
});

// generate new short URL and store long URL
app.post("/urls", (req, res) => {
  inputUrl = req.body.longURL;
  let httpURL = addDotCom(returnUrlWithHttp(inputUrl));  
  if (!doesURLExist(httpURL)) {
    console.log('this entry exists'); // how do I alert??
    res.redirect('/urls/new');
  }
  let newKey = generateRandomString(6); 
  urlDatabase[newKey] = httpURL;
  res.redirect(`/urls/${newKey}`); 
});

// our URLs show page display 
app.get('/urls/:shortURL', (req, res) => { 
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const usernameCookie = req.cookies["username"];
  const templateVars = { shortURL: shortURL, longURL: longURL, username: usernameCookie};
  res.render("urls_show", templateVars);
});

// when we enter a new URL
app.get('/urls/:shortURL', (req, res) => {
  // const shortURL = 
  const longURL = urlDatabase[req.params.shortURL];
  return res.redirect(!returnUrlWithHttp(longURL));
});

// edit an URL
app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const inputURL = req.body.longURL;
  const longURL = addDotCom(returnUrlWithHttp(inputURL));
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// delete an URL
app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


// localhost:8080/u/b2xVn2
// localhost:8080/
// localhost:8080/urls
// localhost:8080/urls/new

// <------------ Helper Functions --------------->

// returns string with http:// prefix
const returnUrlWithHttp = (url) => {
  if ((!url.startsWith('http')) && (!url.startsWith('https'))) {
    return `http://${url}`;
  } else {
    return url;
  }
};

// adds .com to URL
const addDotCom = (url) => {
  const domExtArray = ['.com', '.ca', '.co.uk', '.net', '.org', '.us'];
  for (const domExt of domExtArray) {
    if (domExt === url.slice(-domExt.length)) {
      return url
    }
  }
  return `${url}.com`
}


// do we have this URL in our db?
const doesURLExist = (url) => {
  let urlArr = Object.values(urlDatabase);
  for (const value of urlArr) {
    if (url === value) {
      return true;
    }
  }
};
   
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