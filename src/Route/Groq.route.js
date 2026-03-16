const express=require("express");
const isAuthenticated = require("../Middleware/Protected.middleware");
const { ImprovedText, generateResume, handleFile } = require("../Controller/Groq.controller");
const upload = require("../Middleware/Multer");
const router=express.Router();


router.post('/improvisedText',isAuthenticated,ImprovedText);
router.post('/GenerateResume',isAuthenticated,generateResume);
router.post('/upload',upload.single('myfile'),handleFile)

module.exports=router