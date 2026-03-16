const { OAuth2Client } = require("google-auth-library");
const User = require("../Model/User.model");
const SendToken = require("../Utils/jwtToken.util");
const { hashPassword, verifyPassword } = require("../Utils/PaswordHash.util");

const RegisterUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = new Error("All Fields Are Required");
    error.status = 400;
    return next(error);
  }
  const user = await User.findOne({ email });
  if (user) {
    const error = new Error("Account is already created");
    error.status = 400;
    next(error);
  }
  try {
    const Hashpassword = await hashPassword(password);
    const user = await User.create({ name, email, password: Hashpassword });
    SendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};

const LoginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const error = new Error("Please provide email and password");
      error.status = 400;
      return next(error);
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      const error = new Error("Invalid Email or Password");
      error.status = 401;
      return next(error);
    }

    const isMatched = await verifyPassword(password, user.password);

    if (!isMatched) {
      const error = new Error("Invalid Email or Password");
      error.status = 401;
      return next(error);
    }

    SendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};
const getMe = async (req, res, next) => {
  const id = req.user._id;
  if (!id) {
    const error = new Error("you are not Registered");
    error.status = 400;
    next(error);
  }
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      const error = new Error("you are not Registered");
      error.status = 400;
      next(error);
    }
    res.status(200).json({
      message: "User is fetched",
      success: true,
      data: user,
    });
  } catch (error) {
    next(error.message);
  }
};
const Logout = async (req, res, next) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: true,
      sameSite: "none",
    });
    res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const googleLogin= async (req,res,next)=>{
  const client =new OAuth2Client(process.env.CLIENTID);
   try {
        const {token}=req.body;
        const ticket= await client.verifyIdToken(
            {
                idToken: token,
                audience: process.env.CLIENTID
            }
        )
         const{name,email,sub}=ticket.getPayload();
         let user = await User.findOne({ googleId:sub });
         if(!user){
            user = new User({ name, email, googleId: sub});
            await user.save();
         }
         SendToken(user,200,res);
    } catch (error) {
        next(error)
    }
}
module.exports = { RegisterUser, LoginUser, getMe,Logout,googleLogin };
