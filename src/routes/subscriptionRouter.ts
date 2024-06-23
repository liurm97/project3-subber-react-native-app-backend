import SubscriptionController from "../controllers/subscriptionController";
const express = require("express");

const subscriptionRouter = express.Router();
const subscriptionController = new SubscriptionController();

// ----------------------------------------
// 1. List all subscriptions in `CreateSubscription` page
// Stored in `subscription` table

// List all available subscriptions in `CreateSubscription`
subscriptionRouter.get(
  "/available/users/:userId",
  subscriptionController.listAvailableUserSubscriptions
);

// Get a specific subscription available in `CreateSubscription`
subscriptionRouter.get(
  "/available/:availableId",
  subscriptionController.getAvailableUserSubscription
);

// ----------------------------------------
// 2. List all subscriptions in `My Subscriptions` page
// Stored in `user_subscription_junction` table
subscriptionRouter.get(
  "/subscribed/users/:userId",
  subscriptionController.listSubscribedSubscriptions
);

// Subscribe based on existing subscription
// -- Will not have to create a new subscription
subscriptionRouter.post(
  "/subscribed/users/:userId",
  subscriptionController.subcribeToExistingSubscription
);

// First create a new subscription and then subscribe to it
// -- Will have to first create a new subscription
subscriptionRouter.post(
  "/subscribed/users/:userId",
  subscriptionController.subcribeToNewSubscription
);

// // Delete a subscription in `My Subscriptions`
// subscriptionRouter.delete(
//   "/subscribed/:subscribedId/users/:userId",
//   deleteSubscribedUserSubscription
// );

// // Update a subscription in `My Subscriptions`
// subscriptionRouter.patch(
//   "/subscribed/:subscribedId/users/:userId",
//   updateSubscribedUserSubscription
// );

export default subscriptionRouter;
