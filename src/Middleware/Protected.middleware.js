const jwt = require("jsonwebtoken");
const User = require("../Model/User.model");

const isAuthenticated = async (req, res, next) => {
    try {
        let token;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } 
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }
        if (!token) {
            const error = new Error("Not authorized to access this route");
            error.status = 401;
            return next(error);
        }
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decodedData.id);

        if (!req.user) {
            const error = new Error("User not found");
            error.status = 404;
            return next(error);
        }
        next();
    } catch (err) {
        const error = new Error("Invalid or expired token");
        error.status = 401;
        next(error);
    }
};

module.exports = isAuthenticated;