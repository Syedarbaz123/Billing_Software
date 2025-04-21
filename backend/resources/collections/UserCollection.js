const userResource = require('../UserResource')
const UserCollection = async (users) => {
    let data = [];
    //users = users.filter( user => user.type !== 'super_user#');
    
    //console.log("users............",users);

    for (const user of users) {
        data.push(await userResource(user))
    }
    return data;
}
module.exports = UserCollection;