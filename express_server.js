const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('short'));

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
    password: 'test1234'
  },
  "aJ48lW": {
    username: 'jennifer',
    email: 'jenn@gmail.com',
    password: 'test1234'
  },
  "5D7HGr1": {
    username: 'Johnny',
    email: 'john@hotmail.com',
    password: 'test1234'
  } // add bcypt hash to hardcoded passwords 
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
  if (doesUserExist(email)) {
    error = "Error: User already exists";
    res.status(401).send(error);
    return;          
  }
  if (email === "" || password === "") {
    error = "Email/Password must be entered";
    res.status(400).send(error);
    return;
  }
  addNewUser(username, email, password, res);
  res.redirect('/urls');
});

// LOGIN FROM LOGIN //
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (doesUserExist(email)) {
    if (isPasswordCorrect(email, password)) {
      let userId = getUserInfo(email, 'email', 'userid');
      res.cookie('user_id', userId);
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
  console.log('logout function is firing')
  res.clearCookie('user_id');
  res.redirect('/login');
});
 
// --------------- MAIN PAGES ------------------- //

// LOGIN //
app.get('/login', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_login', templateVars);
});

// REGISTER //
app.get('/register', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_register', templateVars);
});

// HOMEPAGE 
app.get('/urls', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = {"urls": urlDatabase, "userObject": userObject, "userID": userIdCookie};
  res.render('urls_index', templateVars);
});

// ADD NEW URL PAGE
app.get('/urls/new', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
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
  const longURL = urlDatabase[shortURL].longURL;
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = { shortURL: shortURL, longURL: longURL, "userObject": userObject };
  res.render("urls_show", templateVars);
});

//--------------------- ACTIONS ------------------------//

// ADD NEW URL
// check if url exists in db already
// ddd .com or http to input if not present already
// generate new short id and store long URL.
app.post("/urls", (req, res) => {
  const inputUrl = req.body.longURL;
  let httpURL = addDotCom(returnURLWithHttp(inputUrl));
  if (!doesURLExist(httpURL)) {
    error = 'This URL is already stored';
    res.status(401).send(error);
    return;
  }
  let newKey = generateRandomString(6);
  urlDatabase[newKey] = httpURL;
  res.redirect(`/urls/${newKey}`);
});

// GO TO LONGURL WEBSITE
app.get('/urls/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  return res.redirect(!returnURLWithHttp(longURL));
});

// EDIT EXISTING URL
app.post('/urls/:id', (req, res) => {
  const shortURL = req.params.id;
  const inputURL = req.body.longURL;
  const longURL = addDotCom(returnURLWithHttp(inputURL));
  urlDatabase[shortURL].longURL = longURL;
  res.redirect('/urls');
});
// THIS IS DELETING THE ENTRIES - probably re-assigning them to nothing

// DELETE URL
app.post('/urls/:shortURL/delete', (req, res) => {
  console.log("delete is firing")
  const userIdCookie = req.cookies["user_id"];
  if (!userIdCookie) {
    return;
  }
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// <------------------ Pages ---------------------->

// localhost:8080/u/b2xVn2
// localhost:8080/
// localhost:8080/urls
// localhost:8080/urls/new
// localhost:8080/login
// localhost:8080/register

// <------------ Helper Functions --------------->

// returns string with http:// prefix
const returnURLWithHttp = (url) => {
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
      return url;
    }
  }
  return `${url}.com`;
};


// do we have this URL in our db?
const doesURLExist = (url) => {
  let urlArr = Object.values(urlDatabase);
  for (const value of urlArr) {
    if (url === value) {
      return true;
    }
  }
  return false;
};

// do we have this user email in our db?
const doesUserExist = (email) => {
  let userArr = Object.keys(userDatabase);
  for (const userId of userArr) {
  const dbEmail = userDatabase[userId].email;
    if (email === dbEmail) {
      return true;
    }
  }
  return false;
};

const isPasswordCorrect = (email, password) => {
  // use hash method here hashPass = bcrypt.hashSyc(password, saltRounds)
  // use compareSync in comparison to 
  let userArr = Object.keys(userDatabase);
  for (const userId of userArr) {
    if (email === userDatabase[userId].email) {
      return (password === userDatabase[userId].password);
    }
  }
};

const addNewUser = (username, email, password, res) => {
  const id = generateRandomString(7);
  const hashPass = bcrypt.hashSyc(password, saltRounds);
  console.log(hashPass)
  userDatabase[id] = {email: email, username: username, password: password};
  res.cookie('user_id', id);
  return id;
};

// generates any user info with any user info available in our db            
// i.e gerUserInfo('name@domain.com', 'email', 'userid');
// pass userid, email, username or password as data
const getUserInfo = (inputData, inputDataType, outputData) => {
let userArr = Object.keys(userDatabase);
if (inputDataType === 'userid') {
  return userDatabase[inputData][outputData];
}
 for (let userId of userArr) {
    if (inputData === userDatabase[userId][inputDataType]) {
      if (outputData === 'userid') {
        return userId;
      } else {
        return userDatabase[userId][outputData];
      }
    }
  } 
};

const generateRandomString = (length) => {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

                 //<------- Listening -------->//

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//                            TODo
// flash messages (npm package) - express flash messages 

// Math.random().toString(36).substring(2,8) - shorter pw gen 

// url -X POST -i localhost:8080/urls/9sm5xK/delete

// create flag system for bad logins 

// add better landing page 

// get short link to send to actual website

// style page with bootstrap

// encrypt 

// replace cookieParcer with cookieSession 
// res.cookie ----> req.session['user_id'] = userid; 
// req.cookie = req.session['user_id']
// logout 
// req.session['user_id'] = null; 