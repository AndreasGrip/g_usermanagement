const bcrypt = require('bcrypt');
const bcryptSaltRounds = 11;
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
  }

  userLogin(username, password) {
    const user = db.get('users').find({ userName: username }).value();
    let returnObj = {};
    if (user && bcrypt.compareSync(password, user.password)) {
      returnObj = Object.assign({}, user);
      //user.lastLogin = new Date().toISOString();
      //db.write();
      returnObj.password = '******';
    } else {
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
      const passwordHashed = bcrypt.hashSync(password, 11);
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
  // Del user (This is taging user as removed)
  userDel(userName) {
    let returnObj = {};
    const timestamp = new Date().toJSON();
    const user = db.get('users').find({ userName: userName }).set({ deleted: timestamp }).value();
    if (user) {
      returnObj = user;
      returnObj.password = '******';
      db.write();
    } else {
      returnObj.error = 'No such user';
    }
    return JSON.stringify(returnObj);
  }
  // Wipe user
  userWipe(userName) {
    let returnObj = {};
    const user = db.get('users').remove({ userName: userName }).write();
    if (user) {
        returnObj = user;
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
