const express=require("express");
const { LoginUser, RegisterUser, getMe, Logout, googleLogin } = require("../Controller/Auth.controller");
const isAuthenticated = require("../Middleware/Protected.middleware");
const router=express.Router();
// simple Route
router.post('/Register',RegisterUser)
router.post('/Login',LoginUser);
router.post('/googleLogin',googleLogin);
router.post('/Logout',Logout)
//protected route
router.get('/getMe',isAuthenticated,getMe)
module.exports=router
