import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/User.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import { Stats } from "../models/Stats.js";
import { BackendLog } from "../models/BackendLog.js";
import { catchAsyncError } from "../middlewares/CatchAsyncError.js";
import { userAudit } from "./userAuditController.js";
import { statsAudit } from "./statsAuditController.js";
import { Feedback } from "../models/Feedback.js";


export const getAllFeedbacks = catchAsyncError(async (req, res, next) => {
  const feedbacks = await Feedback.find();
  res.status(200).json(feedbacks);

});

export const postFeedback = catchAsyncError(async (req, res, next) => {
  const { name, email, feedback, rating } = req.body;

  const newFeedback = new Feedback({ name, email, feedback, rating });

  await newFeedback.save();
});



export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "register",
      details: "Please Enter all fields",
    });

    return next(new ErrorHandler("Please enter all fields", 400));
  }

  let user = await User.findOne({ email });

  if (user) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "register",
      details: "User Already Exist",
    });

    return next(new ErrorHandler("User Already Exist", 409));
  }

  user = await User.create({
    name,
    email,
    password,
    role,
  });

  userAudit(user._id, "INSERT", "-", user);

  sendToken(res, user, "Registered Successfully", 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "login",
      details: "Please enter all field",
    });

    return next(new ErrorHandler("Please enter all field", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "login",
      details: "Incorrect Email or Password",
    });

    return next(new ErrorHandler("Incorrect Email or Password", 401));
  }
  

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "login",
      details: "Incorrect Email or Password",
    });

    return next(new ErrorHandler("Incorrect Email or Password", 401));
  }

  sendToken(res, user, `Welcome back, ${user.name}`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "changePassword",
      details: "Please enter all field",
    });

    return next(new ErrorHandler("Please enter all field", 400));
  }
    
  const user = await User.findById(req.user._id).select("+password");

  const oldValue = await User.findById(req.user._id);

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "changePassword",
      details: "Incorrect Old Password",
    });

    return next(new ErrorHandler("Incorrect Old Password", 400));
  }

  user.password = newPassword;

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  const oldValue = await User.findById(req.user._id);

  if (!user) {
      await BackendLog.create({
        fileName: "userController",
        functionName: "updateProfile",
        details: "User not found",
      });
    return next(new ErrorHandler("User not found", 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);

  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "forgetPassword",
      details: "No user with this Email Address",
    });

    return next(new ErrorHandler("No user with this Email Address", 400));
  }
  const resetToken = await user.getResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `Click on the link to reset your password. ${url}. If you have not requested this, then please ignore.`;

  // Send token via email
  await sendEmail(user.email, "Happy Learning Reset Password", message);

  res.status(200).json({
    success: true,
    message: `Reset Token has been sent to ${user.email}`,
  });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex"); 

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: {
      $gt: Date.now(),
    },
  });

  if (!user) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "resetPassword",
      details: "Token is invalid or has been expired",
    });

    return next(new ErrorHandler("Token is invalid or has been expired", 401));
  }

  const oldValue = await User.findById(req.user._id);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);

  res.status(200).json({
    success: true,
    message: "Password Changed Successfully",
  });
});

export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const oldValue = await User.findById(req.user._id);

  const course = await Course.findById(req.body.id);

  if (!course) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "addToPlaylist",
      details: "Invalid Course Id",
    });

    return next(new ErrorHandler("Invalid Course Id", 404));
  }
  const itemExist = user.playlist.find((item) => {
    if (item.course.toString() === course._id.toString()) return true;
  });

  if (itemExist) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "addToPlaylist",
      details: "Item Already Exist",
    });

    return next(new ErrorHandler("Item Already Exist", 409));
  }
  user.playlist.push({
    course: course._id,
    poster: course.poster.url,
  });

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);

  res.status(200).json({
    success: true,
    message: "Added to Course list",
  });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const oldValue = await User.findById(req.user._id);

  const course = await Course.findById(req.query.id);

  if (!course) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "removeFromPlaylist",
      details: "Invalid Course Id",
    });

    return next(new ErrorHandler("Invalid Course Id", 404));
  }

  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });

  user.playlist = newPlaylist;

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);

  res.status(200).json({
    success: true,
    message: "Removed From Course list",
  });
});

// Admin Controllers

export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

  export const updateUserRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "updateUserRole",
      details: "User not found",
    });

    return next(new ErrorHandler("User not found", 404));
  }

  const oldValue = await User.findById(req.user._id);

  if (user.role === "user") user.role = "admin";
  else user.role = "user";

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);

  res.status(200).json({
    success: true,
    message: "Role Updated",
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    await BackendLog.create({
      fileName: "userController",
      functionName: "deleteUser",
      details: "User not found",
    });
    return next(new ErrorHandler("User not found", 404));
  }
  const oldValue = user.toObject();

  await User.deleteOne({ _id: req.params.id });

  userAudit(user._id, "DELETE", oldValue, "-");

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const oldValue = user.toObject();

  await User.deleteOne({ _id: req.user._id });

  userAudit(user._id, "DELETE", oldValue, "-");

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "User Deleted Successfully",
    });
});

User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const oldValue = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const subscription = await User.find({ "subscription.status": "active" });

  if(stats.length>0){
    stats[0].users = await User.countDocuments();

    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Date(Date.now());
    await stats[0].save();

  
  }


  const statsUpdated = JSON.stringify(oldValue) !== JSON.stringify(stats);

  if (statsUpdated) {
    statsAudit(stats[0]._id, "UPDATE", oldValue, stats);
  }
});
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID);

export const googleAuth = catchAsyncError(async (req, res, next) => {
  const { token } = req.body; // The token sent from the client

  try {
    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.REACT_APP_GOOGLE_CLIENT_ID, // Verify the audience matches
    });

    const payload = ticket.getPayload();

    // Extract user information
    const { email, name } = payload;

    // Check if the user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // If the user does not exist, create a new user
      user = {
        email,
        name,
        password:"123456", // You can decide whether to assign a default password here
        role: "user",
      };
    }

    // Send token to the user (login or signup successful)
    sendToken(res, user, `Welcome back, ${name}`, 200);
  } catch (error) {
    // If there's any error during the authentication process, pass it to the next middleware
    return next(new ErrorHandler(error.message, 401));
  }
});




