const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { returnURLWithHttp, addDotCom, doesUserExist, doesURLExist, 
  isPasswordCorrect, addNewUser, getUserInfo, generateRandomString } = require('./helpers')

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('short'));

app.use(cookieSession({
  name: 'session',
  keys: ['user_id'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set('view engine', 'ejs');

let error = '';

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
  res.send('I AM ROOT');
});

// USER REGISTRATION //
app.post('/register', (req, res) => {
  const email = req.body.email.toLowerCase();
  const username = req.body.username;
  const password = req.body.password;
  if (doesUserExist(userDatabase, email)) {
    error = "Error: User already exists";
    res.status(401).send(error);
    return;          
  }
  if (email === "" || password === "") {
    error = "Email/Password must be entered";
    res.status(400).send(error);
    return;
  }
  addNewUser(userDatabase, username, email, password, res);
  res.redirect('/urls');
});

// LOGIN FROM LOGIN //
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (doesUserExist(userDatabase, email)) {
    if (isPasswordCorrect(userDatabase, email, password)) {
      let userID = getUserInfo(userDatabase, email, 'email', 'userid');
      req.session['user_id'] = userID;
      console.log(req.session)
      res.redirect('/urls');
      return;
    } else {
      error = "Password/username is incorrect"
      res.status(401).send(error);
      return
    }
  } else {
    error = "User doesn't exist"
    res.status(401).send(error);
    return
  }
});

// USER LOGOUT //
app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/login');
});
 
// --------------- MAIN PAGES ------------------- //

// LOGIN //
app.get('/login', (req, res) => {
  const userIdCookie = req.session.user_id;
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_login', templateVars);
});

// REGISTER //
app.get('/register', (req, res) => {
  const userIdCookie = req.session.user_id;
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_register', templateVars);
});

// HOMEPAGE 
app.get('/urls', (req, res) => {
  const userIdCookie = req.session.user_id;
  console.log(userIdCookie)
  const userObject = userDatabase[userIdCookie];
  const templateVars = {"urls": urlDatabase, "userObject": userObject, "userID": userIdCookie};
  res.render('urls_index', templateVars);
});

// ADD NEW URL PAGE
app.get('/urls/new', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    res.redirect('/login');
    return;
  }
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render("urls_new", templateVars);
});


// INDIVIDUAL URL DISPLAY PAGE
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    error = "URL doesn't exist"
    res.status(401).send(error);
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  const userIdCookie = req.session.user_id;
  const userObject = userDatabase[userIdCookie];
  const templateVars = { shortURL: shortURL, longURL: longURL, "userObject": userObject };
  res.render("urls_show", templateVars);
});

//--------------------- ACTIONS ------------------------//

// SEE USER DB
app.get('/users', (req, res) => {
  res.json(userDatabase);
});

// ADD NEW URL
app.post("/urls", (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    error = 'You must be logged in to add new URLS';
    res.status(401).send(error);
    return;
  }
  const inputUrl = req.body.longURL;
  const httpURL = addDotCom(returnURLWithHttp(inputUrl));
  const userid = req.session.user_id;
  if (doesURLExist(urlDatabase, httpURL, userid)) {
    error = 'This URL is already stored';
    res.status(401).send(error);
    return;
  }
  const newKey = generateRandomString(6);
  urlDatabase[newKey] = {};
  urlDatabase[newKey].longURL = httpURL;
  urlDatabase[newKey].userID = userid;
  res.redirect(`/urls/${newKey}`);
});

// GO TO LONGURL WEBSITE
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  return res.redirect(!returnURLWithHttp(longURL));
});

// EDIT EXISTING URL
app.post('/urls/:id', (req, res) => {
  const userIdCookie = req.session.user_id;
  if (!userIdCookie) {
    error = 'You must be logged in to edit URLS';
    res.status(401).send(error);
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
    error = 'You cannot delete another users URL';
    res.status(401).send(error);
    return;
  }
  let shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL].userID === userIdCookie) {
    error = 'You cannot delete another users URL';
    res.status(401).send(error);
    return;
  }
  delete urlDatabase[shortURL];
  console.log(urlDatabase);
  res.redirect('/urls');
});

                 //<------- Listening -------->//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//                            TODO
// flash messages (npm package) - express flash messages 

// Math.random().toString(36).substring(2,8) - shorter pw gen 

// CREATE MIDDLEWARE TO SEND USEROBJECT // 

// 1. CORE WORK
// 3. STYLE PAGE
// 4. LANDING PAGE
// 5. ERROR PAGE
// 6. ERROR FLAGS (if there is time)

// localhost:8080/urls/b2xVn2/delete

// (Stretch) the date the short URL was created
// (Stretch) the number of times the short URL was visited
// (Stretch) the number number of unique visits for the short URL