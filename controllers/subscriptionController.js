import { catchAsyncError } from "../middlewares/CatchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { userAudit } from "./userAuditController.js";
import { BackendLog } from "../models/BackendLog.js";

export const buySubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const oldValue = await User.findById(req.user._id);

  if (user.subscription.status === "active") {
    await BackendLog.create({
      fileName: "subscriptionController",
      functionName: "buySubscription",
      details: "You have subscribed already",
    });

    return next(new ErrorHandler("You have subscribed already", 400));
  }
  
  user.subscription.status = 'active';

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);
  res.status(201).json({
    success: true,
    message: "Subscription Successful",
  });
});

export const cancelSubscription = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
 
  const oldValue = await User.findById(req.user._id);

  user.subscription.status = undefined;

  await user.save();

  userAudit(user._id, "UPDATE", oldValue, user);
  res.status(200).json({
    success: true,
    message: 
       "Subscription cancelled"
  });
});
