
// This function is used to generate IDs or shortURLS

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

// This function is used to check whether an email given by user
// matches an email already stored in our database
// returns six digit user_id if match, empty string if no match found

const getUserByEmail = (email, database) => {

  let userInfo = false;
  for (const userId in database) {
    if (database[userId].email === email) {
      userInfo = database[userId];
    }
  }
  return userInfo;
};

// Function that filters the url Database and creates an object
// of URLS that match the given user_id, 
// in the form of { shortURL: longURL } key value pairs.

const userUrls = (user_id, database) => {
  const output = {};
  for (const url in database) {
    if (database[url].userID === user_id) {
      output[url] = database[url].longURL;
    }
  }
  return output;
}; 

// Function that checks whether a person is logged in as registered user
// Takes user_id and makes sure users[user_id] = truthy;

const isCookieValid = (user_id, database) => database[user_id] !== undefined;

module.exports = {generateRandomString, getUserByEmail, userUrls, isCookieValid }