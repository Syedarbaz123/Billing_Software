const db = require('../../models');
const User = db.User;
const Meter = db.Meter;

const isAssigned = async (req, permission_key) => {
    const user = await User.findOne({
        where: { id: req.query.user_id }
    });

    if (!user) {
        console.log('User not found!');
        return false;
    }

    let is_assigned = false;
    let role = await user.getRole();

    if (!role) {
        console.log('Role not found for user:', user.id);
        return false;
    }

    console.log('User Role Permissions:', role.permissions); // Debugging

    const permission = await getPermission(role, permission_key);
    
    console.log('Checking Permission:', permission_key, 'Found:', permission);

    if (permission) {
        is_assigned = permission.is_assigned ?? true; // Default true
    }
    

    return is_assigned;
};

const sendResponse = (is_assigned, res, next) => {
    if (is_assigned) {
        next()
    } else {
        return res.status(403).json({ 'message': 'Unauthorized access' });
    }
}
const getPermission = (role, permission_key) => {
    console.log("Raw Permissions:", role.permissions);
    
    let permissions = role.permissions;
    
    if (typeof permissions === 'string') {
        try {
            permissions = JSON.parse(permissions);
        } catch (error) {
            console.error("Error parsing permissions:", error);
            return null;
        }
    }

    console.log("Parsed Permissions:", permissions);
    console.log("Looking for permission key:", permission_key);

    const permission = permissions.find(item => {
        console.log("Checking:", item.uq_key, "==", permission_key);
        return (
            item.uq_key.toLowerCase() === permission_key.toLowerCase() ||  // Case-insensitive check
            item.uq_key.toLowerCase() === (permission_key + 's').toLowerCase()  // Plural check
        );
    });

    console.log("Permission found:", permission);
    return permission;
};





const isSuperUser = async (user_id) => {
    const user = await User.findOne({
        where: {
            id: user_id
        }
    });
    let is_super = false;
    let role = await user.getRole();
    if (role) {
        if (role.key === '@super_user') {
            is_super = true;
        }
    }
    //console.log("/////////Super User ///////////////////", is_super);

    return is_super;
}
const getSpaceFloor = async (MeterId) => {

    let floor = await db.sequelize.query(`SELECT f.* FROM floors_web AS f 
    WHERE f.id IN (SELECT s.floor_id FROM spaces AS s WHERE s.meter_id = ${MeterId})`, {
        type: db.sequelize.QueryTypes.SELECT
    })

    if (floor.length > 0)
        return floor[0]; // first record
    else
        return null;
    //return floor;
}

const formatDate = (date) => {

    //console.log("\n\n\n date string",date);

    const year = date.getFullYear();
    const month = String(date.getMonth()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDate_DayMonth = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}`;
};

const tonFactor = () => {
    return (1000000 / 12000);
}

module.exports = {
    isAssigned,
    sendResponse,
    getPermission,
    isSuperUser,
    getSpaceFloor,
    formatDate,
    tonFactor,
    formatDate_DayMonth,
}