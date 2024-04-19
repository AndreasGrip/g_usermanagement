const bcrypt = require('bcryptjs');
const bcryptSaltRounds = 24;
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('userDb.json');
const db = low(adapter);

db.defaults({ users: [], userIdMax: 0 }).write();

/*
class user {
  constructor(userId, userName, password) {
    this.userId = userId;
    this.userName = userName;
    this.password = password;
    this.data = {};    // Arbitrary user information, not a setting like shoe size
    this.data = {};    // Arbitrary user information, not a setting like shoe size
    this.settings = {};  
    this.lastLogin;
    this.deleted;
  }
}
*/
function isJSON(variable) {
  try {
    JSON.parse(variable);
  } catch (error) {
    return false;
  }
  return true;
}

class userManager {
  constructor() {
    this.userIdMax = db.get('userIdMax').value();
    this.usersLoggedIn = [];
    // How many tries before temporary lock the account.
    this.userLockTries = 5;
    // if wrong password attempted within this period counter towards lock get +1.
    this.userLockTriesTime = 300;
    // How long the user will be unable to login.
    // Each attempt before this time will reset the timer. (Call me evil ;) )
    // this is the suggested formula. You can change it but it's quite balanced.
    this.userLockTimeSec = this.userLockTries * this.userLockTriesTime;
  }

  // return number of users in the database.
  userCount() {
    return db.get('users').__wrapped__.users.length;
  }

  // Check if a username exist
  userCheck(username) {
    const user = db.get('users').find({ userName: username }).value();
    if (user) return true;
    return false;
    // How many tries before temporary lock the account.
    this.userLockTries = 5;
    // if wrong password attempted within this period counter towards lock get +1.
    this.userLockTriesTime = 300;
    // How long the user will be unable to login.
    // Each attempt before this time will reset the timer. (Call me evil ;) )
    // this is the suggested formula. You can change it but it's quite balanced.
    this.userLockTimeSec = this.userLockTries * this.userLockTriesTime;
  }

  // return number of users in the database.
  userCount() {
    return db.get('users').__wrapped__.users.length;
  }

  // Check if a username exist
  userCheck(username) {
    const user = db.get('users').find({ userName: username }).value();
    if (user) return true;
    return false;
  }


  userLogin(username, password) {
    const user = db.get('users').find({ userName: username }).value();
    let returnObj = {};
    // if login attempt while account is locked.
    if (user.userLockTries >= user.lastLoginFail && (new Date() - new Date(user.lastLoginFailTime)) / 1000 <= this.userLockTimeSec) {
      // "reset" timer
      user.lastLoginFailTime = new Date().toISOString();
      returnObj.error = 'To many failed attempt, take a break';
    } else if (user && bcrypt.compareSync(password, user.password)) {
      returnObj = Object.assign({}, user);
      // Store last successful login, some day we might purge unused users.
      user.lastLoginTime = new Date().toISOString();
      db.write();
      returnObj.password = '******';
    } else {
      user.lastLoginFailTime = new Date().toISOString();
      // if failed login within userLockTriesTime sec, add one to userLockTriesTime
      if ((new Date() - new Date(user.lastLoginFailTime)) / 1000 <= this.userLockTriesTime) user.userLockTriesTime = user.lastLoginFail ? user.lastLoginFail++ : 1;
      returnObj.error = 'Wrong user or password';
    }
    return JSON.stringify(returnObj);
    // someway to check if something returned.
  }

  // Add a new user
  userAdd(userName, password, data, settings) {
    let returnObj = {};
    // Check that username is set
    if (!userName) {
      returnObj.error = returnObj.error ? returnObj.error + ' and ' : '';
      returnObj.error += 'No username defined';
    }
    if (!password) {
      returnObj.error = returnObj.error ? returnObj.error + ' and ' : '';
      returnObj.error += 'No password defined';
    }
    // Check that username is not taken.
    if (db.get('users').find({ userName: userName }).value()) {
      returnObj.error = returnObj.error ? returnObj.error + ' and ' : '';
      returnObj.error += 'Username already exist';
    }
    // If any errors found, return them.
    if (!returnObj.error) {
      const userId = this.userIdMax++;
      const passwordHashed = bcrypt.hashSync(password, bcryptSaltRounds);
      const dataObj = data ? JSON.parse(data) : {};
      const settingsObj = data ? JSON.parse(c) : {};
      db.set('userIdMax', this.userIdMax).write();
      const userObj = {
        userId: userId,
        userName: userName,
        password: passwordHashed,
        data: dataObj,
        settings: settingsObj,
      };
      db.get('users').push(userObj).write();
      returnObj = Object.assign({}, userObj);
      returnObj.password = '******';
    }
    return JSON.stringify(returnObj);
  }
  // Del user (This is tagging user as removed)
  userDel(userName) {
    let returnObj = {};
    const timestamp = new Date().toJSON();
    const user = db.get('users').find({ userName: userName }).set({ deleted: timestamp }).value();;
    if (user.length > 0) {
      if ((user.length = 1)) {
        returnObj = user[0];
      } else {
        returnObj = user;
      }
      user.password = '*****'
    } else {
      returnObj.error = 'No such user';
    }
    return JSON.stringify(returnObj);
  }
  // Wipe user
  userWipe(userName) {
    let returnObj = {};
    const user = db.get('users').remove({ userName: userName }).write().value();
    if (user.length > 0) {
      if ((user.length = 1)) {
        returnObj = user[0];
      } else {
        returnObj = user;
      }
      returnObj.password = '******';
    } else {
      returnObj.error = 'No such user';
    }
    return JSON.stringify(returnObj);
  }

  // Update user settings
  userSettingsUpdate(userName, settingsToUpdate) {
    const originalUserFilter = db.get('users').filter({ userName: userName }).value();
    if (originalUserFilter.length !== 1) return { error: 'more or less than one user with that username found.' };
    if (typeof settingsToUpdate === 'object' && !Array.isArray(settingsToUpdate) && settingsToUpdate !== null) settingsToUpdate = JSON.stringify(settingsToUpdate);
    const orginal = originalUserFilter[0].settings ? originalUserFilter[0].settings : {};
    const updates = JSON.parse(settingsToUpdate);
    const newSettings = Object.assign(orginal, updates);
    db.get('users').filter({ userName: userName }).set({ settings: newSettings }).write();
    return newSettings;
  }

  // Update user data
  userDataUpdate(userName, dataToUpdate) {
    const originalUserFilter = db.get('users').filter({ userName: userName }).value();
    if (originalUserFilter.length !== 1) return { error: 'more or less than one user with that username found.' };
    if (typeof dataToUpdate === 'object' && !Array.isArray(dataToUpdate) && dataToUpdate !== null) dataToUpdate = JSON.stringify(dataToUpdate);

    const orginal = originalUserFilter[0].data ? originalUserFilter[0].data : {};
    const updates = JSON.parse(dataToUpdate);
    const newData = Object.assign(orginal, updates);
    db.get('users').find({ userName: userName }).set({ data: newData }).write();
    return newData;
  }
}

module.exports = userManager;
