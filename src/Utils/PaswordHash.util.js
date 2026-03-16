const bcrypt = require("bcrypt");
const hashPassword = async (plainPassword) => {
    const hashedResult = await bcrypt.hash(plainPassword, 10);
    return hashedResult;
};
const verifyPassword = async (plainPassword, hashedPassword) => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch; 
};
module.exports={hashPassword,verifyPassword}