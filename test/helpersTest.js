const { assert } = require('chai');

const { getUserInfo } = require('../helpers.js');

const userDatabase = {
  "5Jhv4Db": {
    username: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "4tDgrgh": {
    username: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserInfo', function() {
  it('should return a user id with valid email', function() {

    const user = getUserInfo(userDatabase, "user@example.com", 'email', 'userid')
    const expectedOutput = "5Jhv4Db";
    assert.equal(user, expectedOutput);

  });

  it('should return a user profile with valid email', function() {

    const user = getUserInfo(userDatabase, "user@example.com", 'email', 'userprofile')
    const expectedOutput = {
      username: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(user, expectedOutput);
  });

  it('should return a user email with valid userid', function() {

    const user = getUserInfo(userDatabase, "4tDgrgh", 'userid', 'email')
    const expectedOutput = "user2@example.com";
    assert.deepEqual(user, expectedOutput);
  });

  it('should return a username with valid email', function() {

    const user = getUserInfo(userDatabase, "user2@example.com", 'email', 'username')
    const expectedOutput = "user2RandomID";
    assert.deepEqual(user, expectedOutput);
  });

});