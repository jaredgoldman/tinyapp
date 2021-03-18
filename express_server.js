const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('short'));

app.set('view engine', 'ejs');

let error = '';

//-------------- DATA --------------//

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
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
  }
};

//-------------- ROUTING --------------//
        
          // LOGIN/REGISTRATION //

// root directory 
app.get('/', (req, res) => {
  res.send('I AM ROOT');
});

// USER REGISTRATION 
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

// LOGIN FROM LOGIN
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
    // NEED TO EXPAND TO LINK TO REGISTRY
  } else {
    error = "User doesn't exist"
      res.status(401).send(error);
      return
  }
});

// ** OLD LOGIN FROM HEADER **                              
// user login 
// sets cookie with username
// app.post('/login', (req, res) => {
//   const userNameStr = req.body["userName"];
//   res.cookie('username', userNameStr);
//   res.redirect('/urls');
// });   

// USER LOGOUT
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// MAIN PAGES //

// LOGIN
// currently, we are logging out automatically when we go to the login page//
// 
app.get('/login', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_login', templateVars);
});

// REGISTER 
app.get('/register', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = { "userObject": userObject };
  res.render('urls_register', templateVars);
});

// HOMEPAGE 
app.get('/urls', (req, res) => {
  const userIdCookie = req.cookies["user_id"];
  if (!userIdCookie) {
    res.redirect('/login');
    return;
  }
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
// had edit url form 
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userIdCookie = req.cookies["user_id"];
  const userObject = userDatabase[userIdCookie];
  const templateVars = { shortURL: shortURL, longURL: longURL, "userObject": userObject };
  res.render("urls_show", templateVars);
});

                // ACTIONS //

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
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

// DELETE URL
app.post('/urls/:shortURL/delete', (req, res) => {
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
  let userArr = Object.keys(userDatabase);
  for (const userId of userArr) {
    if (email === userDatabase[userId].email) {
      return (password === userDatabase[userId].password);
    }
  }
};

const addNewUser = (username, email, password, res) => {
  const id = generateRandomString(7);
  userDatabase[id] = {email: email, username: username, password: password};
  res.cookie('user_id', id);
  return id;
}

// generates any user info with custimizable input type             
// i.e gerUserInfo('name@domain.com', 'email', 'userid);
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
}

const generateRandomString = (length) => {
  const chars = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// <------- Listening -------->

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// flash messages (npm package) - express flash messages 

// Math.random().toString(36).substring(2,8) - shorter pw gen 