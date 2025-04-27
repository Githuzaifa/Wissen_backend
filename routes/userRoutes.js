import express from "express";
import { isAuthenticated, authorizeAdmin } from "../middlewares/auth.js";
import { googleAuth,register, login, logout, getMyProfile, changePassword, updateProfile, forgetPassword, resetPassword, addToPlaylist, removeFromPlaylist, getAllUsers, updateUserRole, deleteUser, deleteMyProfile, postFeedback, getAllFeedbacks} from "../controllers/userController.js";

const router = express.Router();

// To register a new user
router.route("/register").post(register);

// Login
router.route("/login").post(login);

// google Login
router.route("/google-login").post(googleAuth);

// logout
router.route("/logout").get(logout);

// Get my profile
router.route("/me").get(isAuthenticated, getMyProfile);

// Delete my profile
router.route("/me").delete(isAuthenticated, deleteMyProfile); 

// ChangePassword
router.route("/changepassword").put(isAuthenticated, changePassword);

// UpdateProfile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

// ForgetPassword
router.route("/forgetpassword").post(forgetPassword);

// Send Feedback
router.route("/sendFeedback").post(postFeedback);

// Get Feedbacks
router.route("/getFeedbacks").get(getAllFeedbacks);


// ResetPassword
router.route("/resetpassword/:token").put(resetPassword);

// AddtoPlaylist
router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

// RemoveFromPlaylist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

//  Admin Routes
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);

router
   .route("/admin/user/:id")
   .put(isAuthenticated, authorizeAdmin, updateUserRole)
   .delete(isAuthenticated, authorizeAdmin, deleteUser);

export default router;