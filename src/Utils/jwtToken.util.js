const jwt=require("jsonwebtoken")
const SendToken = (user, statusCode, res) => {
  try {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    };

    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      data: user,
    });
  } catch (error) {
    throw error
  }
};

module.exports = SendToken;
