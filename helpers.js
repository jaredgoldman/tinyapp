const bcrypt = require('bcrypt');
const saltRounds = 10;

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
const doesURLExist = (urlDB, url, userid) => {
  let urlArr = Object.values(urlDB);
  for (const value of urlArr) {
    if (userid === value.userID) {
      if (url === value.longURL) {
        return true;
      }
    }
  }
  return false;
};

// do we have this user email in our db?
const doesUserExist = (userDB, email) => {
  let userArr = Object.keys(userDB);
  for (const userId of userArr) {
    const dbEmail = userDB[userId].email;
    if (email === dbEmail) {
      return true;
    }
  }
  return false;
};

const isPasswordCorrect = (userDB, email, password) => {
  let userArr = Object.keys(userDB);
  for (const userId of userArr) {
    let dbPassword = userDB[userId].password;
    if (email === userDB[userId].email) {
      return bcrypt.compareSync(password, dbPassword);
    }
  }
};

const addNewUser = (userDB, username, email, password, req) => {
  const id = generateRandomString(7);
  const hashPass = bcrypt.hashSync(password, saltRounds);
  userDB[id] = {email: email, username: username, password: hashPass};
  req.session.user_id = id;
  return id;
};

// generates any user info with any user info available in our db
// i.e gerUserInfo('name@domain.com', 'email', 'userid');
// pass userid, email, username or password as data
const getUserInfo = (userDB, inputData, inputDataType, outputData) => {
  let userArr = Object.keys(userDB);
  if (inputDataType === 'userid') {
    return userDB[inputData][outputData];
  }
  for (let userID of userArr) {
    if (inputData === userDB[userID][inputDataType]) {
      if (outputData === 'userid') {
        return userID;
      }
      if (outputData === 'userprofile') {
        return userDB[userID];
      } else {
        return userDB[userID][outputData];
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

module.exports = { returnURLWithHttp, addDotCom, doesUserExist, isPasswordCorrect, addNewUser, getUserInfo, doesURLExist, generateRandomString };