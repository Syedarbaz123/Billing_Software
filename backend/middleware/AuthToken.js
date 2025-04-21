const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {

    const token =
        req.body.token || req.query.token || req.headers["x-access-token"];
    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication' }).send();
    }
    try {
        req.user = jwt.verify(token, process.env.TOKEN_KEY);
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' }).send();
    }
    return next();
};

module.exports = verifyToken;