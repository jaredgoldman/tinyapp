const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { returnURLWithHttp, addDotCom, doesUserExist, doesURLExist, isPasswordCorrect, addNewUser, getUserInfo, generateRandomString } = require('./helpers');

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('short'));

app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],
  maxAge: 24 * 60 * 60 * 1000 
}));

app.set('view engine', 'ejs');

// Library of errors that are passed via a redirect URL param
// Key is then used to access this object and populate an error page via templateVars
const errors = {
  userexists: "User already exists",
  empwmiss: "Email and password must be enetered",
  pwunin: "Password/username is incorrect",
  nouser: "No record of that user exists",
  logadd: "You must be logged in to add new URLs",
  logview: "You must be logged in to view this URL",
  nourl: "URL does not exist",
  oldurl: "This URL is has already been shortened",
  loggedin: "You are already logged in",
  logreg: "Please log out to register a new account",
  alogout: "You are already logged out",
  logdel: "You must be logged in to delete this URL"
};

//-------------- DATA --------------//

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" },
  "Fv84if": { longURL: "http://www.reddit.com", userID: "1D4G5v7" },
  "BM7r4d": { longURL: "http://www.facebook.com", userID: "1D4G5v7" },
  "MUaf43": { longURL: "http://www.twitter.co", userID: "5D7HGr1" },
  "Bv5Htq": { longURL: "http://www.pinterest.com", userID: "5D7HGr1" }
};

const userDatabase = {
  "1D4G5v7": {
    username: 'jimmybobby',
    email: 'jim@bobby.com',
    password: bcrypt.hashSync('test1234', saltRounds)
  },

  "aJ48lW": {
    username: 'jennifer',
    email: 'jenn@gmail.com',
    password: bcrypt.hashSync('test1234', saltRounds)
  },

  "5D7HGr1": {
    username: 'Johnny',
    email: 'john@hotmail.com',
    password: bcrypt.hashSync('test1234', saltRounds)
  }
};

//---------------- ROUTING ----------------//
        
            // LOGIN/REGISTRATION //

// ROOT //
app.get('/', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (userIdCookie) {
    res.redirect('/urls');
    return;
  }
  res.redirect('/login');
});

// USER REGISTRATION //
app.post('/register', (req, res) => {
  const email = req.body.email.toLowerCase();
  const username = req.body.username;
  const password = req.body.password;
  if (doesUserExist(userDatabase, email)) {
    res.redirect('/error/userexists');
    return;
  }
  if (email === "" || password === "") {
    res.redirect('/error/empwmiss');
    return;
  }
  addNewUser(userDatabase, username, email, password, req);
  res.redirect('/urls');
});

// LOGIN FROM LOGIN //
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (doesUserExist(userDatabase, email)) {
    if (isPasswordCorrect(userDatabase, email, password)) {
      let userID = getUserInfo(userDatabase, email, 'email', 'userid');
      req.session.user_id = userID;
      res.redirect('/urls');
      return;
    } else {
      error = "Password/username is incorrect";
      res.redirect('/error/pwunin')
      return;
    }
  } else {
    error = "User doesn't exist";
    res.redirect('/error/nouser')
    return;
  }
});

// USER LOGOUT //
app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/login');
});
 
                  // MAIN PAGES //

// LOGIN //
app.get('/login', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (userIdCookie) {
    res.redirect('/error/loggedin');
    return;
  }
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_login', templateVars);
});

// REGISTER //
app.get('/register', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (userIdCookie) {
    res.redirect('/error/logreg');
    return;
  }
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_register', templateVars);
});

// HOMEPAGE //
app.get('/urls', (req, res) => {
  const userIdCookie = req.session.user_id;
  const userObject = userDatabase[userIdCookie];
  const templateVars = {"urls": urlDatabase, "userObject": userObject, "userID": userIdCookie};
  res.render('urls_index', templateVars);
});

// ADD NEW URL PAGE //
app.get('/urls/new', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    res.redirect('/error/logadd');
    return;
  }
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render("urls_new", templateVars);
});


// INDIVIDUAL URL DISPLAY PAGE //
app.get('/urls/:shortURL', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    res.redirect('/error/logview');
    return;
  }
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.redirect('/error/nourl')
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  const userObject = userDatabase[userIdCookie];
  const templateVars = { shortURL: shortURL, longURL: longURL, "userObject": userObject };
  res.render("urls_show", templateVars);
});

// ERROR PAGE
app.get('/error/:errormsg', (req, res) => {
  const errorId = req.params.errormsg;
  const errorMsg = errors[errorId];
  const userIdCookie = req.session.user_id;
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject, "errorMsg": errorMsg }
  res.render('urls_error', templateVars);
});

                           // ACTIONS //

// SEE USER DB //
app.get('/users', (req, res) => {
  res.json(userDatabase);
});

// ADD NEW URL //
app.post("/urls", (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    return;
  }
  const inputUrl = req.body.longURL;
  const httpURL = addDotCom(returnURLWithHttp(inputUrl));
  const userid = req.session.user_id;
  if (doesURLExist(urlDatabase, httpURL, userid)) {
    res.redirect('error/oldurl');
    return;
  }
  // if user is logged in and URL doesn't exist, proceed with creating new URL
  const newKey = generateRandomString(6);
  urlDatabase[newKey] = {};
  urlDatabase[newKey].longURL = httpURL;
  urlDatabase[newKey].userID = userid;
  res.redirect(`/urls/${newKey}`);
});

// REDIRECT TO LONGURL WEBSITE //
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  return res.redirect(returnURLWithHttp(longURL));
});

// EDIT EXISTING URL
app.post('/urls/:id', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    return;
  }
  const shortURL = req.params.id;
  const inputURL = req.body.longURL;
  const longURL = addDotCom(returnURLWithHttp(inputURL));
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});

// DELETE URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    res.redirect('/error/logdel')
    return;
  }
  let shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL].userID === userIdCookie) {
    res.redirect('/error/logdel')
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

//<------- Listening -------->//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

