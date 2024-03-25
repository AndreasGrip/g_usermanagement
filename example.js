const user = require('.');

const users = new user();

let tmp;
tmp = users.userAdd('JohnDoe','Secret123');
console.log(tmp)
tmp = users.userSettingsUpdate('JohnDoe', {'usertype':'admin'});
console.log(tmp)
tmp = users.userDataUpdate('JohnDoe', {'showsize': '42'});
console.log(tmp)
tmp = users.userDataUpdate('JaneDoe', {'showsize': '37'});
console.log(tmp)


tmp = users.userLogin('JaneDoe', "secret");
console.log(tmp)
tmp = users.userLogin('JohnDoe','Secret123');
console.log(tmp)
tmp = users.userDel('JaneDoe');
console.log(tmp)
tmp = users.userDel('JohnDoe');
console.log(tmp)
