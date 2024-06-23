import { Request, Response } from "express";
import db from "../utils/db.server";
const dayjs = require("dayjs");
import {
  Prisma,
  PlanFrequency,
  NotificationFrequency,
  NotificationType,
  SubscriptionCategory,
} from "@prisma/client";

class SubscriptionController {
  constructor() {}

  // 1. List all available subscriptions in `CreateSubscription`
  listAvailableUserSubscriptions = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const category: any = req.query.category;
    console.log("category", category);

    try {
      let [uniqueUserId, publicSubscriptions, privateSubscriptions]: [
        any,
        any,
        any
      ] = [undefined, undefined, undefined];

      // -- If category is provided into the query
      if (category) {
        [uniqueUserId, publicSubscriptions, privateSubscriptions] =
          await db.$transaction([
            // 1. Check if userId is valid
            db.user.findUnique({ where: { id: userId } }),
            // Roll back if not valid
            // if valid:
            //2. Get all public subscriptions
            db.subscription.findMany({
              where: {
                AND: [
                  {
                    user_id: {
                      equals: null,
                    },
                  },
                  {
                    category: {
                      equals: category,
                    },
                  },
                ],
              },
              select: {
                name: true,
                image_url: true,
              },
            }),
            // 3. Get all private subscriptions
            db.subscription.findMany({
              where: {
                AND: [
                  {
                    user_id: {
                      equals: userId,
                    },
                  },
                  {
                    category: {
                      equals: category,
                    },
                  },
                ],
              },
              select: {
                name: true,
              },
            }),
          ]);
      } else {
        // -- If category is not provided into the query

        [uniqueUserId, publicSubscriptions, privateSubscriptions] =
          await db.$transaction([
            // 1. Check if userId is valid
            db.user.findUnique({ where: { id: userId } }),
            // Roll back if not valid
            // if valid:
            //2. Get all public subscriptions
            db.subscription.findMany({
              where: {
                user_id: {
                  equals: null,
                },
              },
              select: {
                name: true,
              },
            }),
            // 3. Get all private subscriptions
            db.subscription.findMany({
              where: {
                user_id: {
                  equals: userId,
                },
              },
              select: {
                name: true,
              },
            }),
          ]);
      }
      if (uniqueUserId == null)
        res.status(404).json({
          message: `user id ${userId} cannot be found. please try again`,
        });
      else
        res.status(200).json({
          message: "success",
          userId: userId,
          subscriptions: [...publicSubscriptions, ...privateSubscriptions],
        });
    } catch (error) {
      res.status(400).json({
        message: "something wrong happened",
      });
    }
  };

  // 2. Get the `name` and `image_url` of a specific available subscription in `CreateSubscription`
  getAvailableUserSubscription = async (req: Request, res: Response) => {
    const availableSubscriptionId = req.params.availableId;
    console.log("availableSubscriptionId", availableSubscriptionId);
    try {
      const availableSubscriptionDetails = await db.subscription.findUnique({
        where: {
          id: availableSubscriptionId,
        },
        select: {
          name: true,
          image_url: true,
        },
      });
      console.log("availableSubscriptionDetails", availableSubscriptionDetails);
      res.status(200).json({ result: availableSubscriptionDetails });
    } catch (error) {
      res.status(400).json({
        message: "something wrong happened",
      });
    }
  };

  subcribeToExistingSubscription = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    let [planId, subscriptionsOnUsersResult]: [any, any] = [
      undefined,
      undefined,
    ];
    const {
      subscriptionId, // Not sure if this is provided by the FE
      planName,
      planPrice,
      billingPeriod,
      paymentStartDate,
      paymentEndDate,
      notificationType,
      notificationPeriod,
      notificationTime,
      notes,
    } = req.body;

    // check that userId is valid
    const uniqueUserId = await db.user.findUnique({ where: { id: userId } });
    if (uniqueUserId == null)
      res.status(404).json({
        message: `user id ${userId} cannot be found. please try again`,
      });
    else {
      // format billing period -> billing_period_value and billing_period_frequency
      let [_, billing_period_value, billing_period_frequency]: [
        any,
        string | number,
        PlanFrequency
      ] = billingPeriod.split(" ");
      billing_period_value = Number(billing_period_value);
    }
  };
  subcribeToNewSubscription = async (req: Request, res: Response) => {
    // subscription
    // user
    // plan
  };

  listSubscribedSubscriptions = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    let [uniqueUserId, subscribedSubscriptions]: [any, any] = [
      undefined,
      undefined,
    ];
    [uniqueUserId, subscribedSubscriptions] = await db.$transaction([
      // 1. Check if userId is valid
      db.user.findUnique({ where: { id: userId } }),
      // Roll back if not valid
      // if valid:
      // 3. Get all user subscribed subscriptions
      db.subscription.findMany({
        where: {
          user_id: {
            equals: userId,
          },
        },
        select: {
          name: true,
          image_url: true,
          subscribed_users: {
            select: {
              plan_id: true,
              subcription_plan: {
                select: {
                  price: true,
                  billing_period_value: true,
                  billing_period_frequency: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (uniqueUserId == null)
      res.status(404).json({
        message: `user id ${userId} cannot be found. please try again`,
      });
  };
  deleteSubscribedUserSubscription = async (req: Request, res: Response) => {};
  updateSubscribedUserSubscription = async (req: Request, res: Response) => {};

  // createPrivateSubscription = async (req: Request, res: Response) => {
  //   const userId = req.params.userId;
  //   console.log(userId);
  //   try {
  //     const [result] = await db.$transaction([
  //       // 1. Check if userId is valid
  //       db.user.findUnique({ where: { id: userId } }),
  //       // Roll back if not valid
  //       // if valid - 2. Create a subscription for the user
  //       db.subscription.create({
  //         data: {
  //           name: req.body.name,
  //           image_url: req.body.imageUrl,
  //           category: req.body.category,
  //           user_id: userId,
  //         },
  //       }),
  //     ]);
  //     res.status(200).send("Subscription is created successfully!");
  //   } catch (error: any) {
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       if (error.code === "P2003") {
  //         res.status(400).json({
  //           message: "Operation failed because the user id does not exists",
  //         });
  //       } else if (error.code === "P2002") {
  //         res.status(400).json({
  //           message: "Something went wrong",
  //         });
  //       }
  //     }
  //   }
  // };

  // delete = async (req: Request, res: Response) => {
  //   try {
  //     const subscriptionId = req.params.subscriptionId;
  //     res.status(201).json("done");
  //   } catch (error) {
  //     res.status(400).json({ error: "An error occurred" });
  //   }
  // };

  // update = async (req: Request, res: Response) => {
  //   try {
  //     // Retrieves user information and authenticates against Clerk
  //     res.status(201).json("done");
  //   } catch (error) {
  //     res.status(400).json({ error: "An error occurred" });
  //   }
  // };
}

export default SubscriptionController;
