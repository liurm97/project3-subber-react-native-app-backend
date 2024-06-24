import { Request, Response } from "express";
import db from "../utils/db.server";
import { v4 } from "uuid";
const dayjs = require("dayjs");
import { parseBillingPeriod, returnPaymentNextDate } from "../utils/helpers";
import {
  Prisma,
  PlanFrequency,
  NotificationFrequency,
  NotificationType,
  SubscriptionCategory,
} from "@prisma/client";
import { create } from "domain";

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
    const planId = v4();
    const {
      subscriptionId, // Not sure if this is provided by the FE
      planName,
      planPrice,
      billingPeriod,
      paymentStartDate,
      paymentEndDate,
      notificationType,
      notificationFrequency,
      notificationTime,
      notes,
    } = req.body;

    // format values
    const paymentNextDate = returnPaymentNextDate(
      paymentStartDate,
      billingPeriod
    );
    const { value, frequency } = parseBillingPeriod(billingPeriod);

    // check that userId is valid
    const { id }: any = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (id == null)
      res.status(404).json({
        message: `user id ${userId} cannot be found. please try again`,
      });
    else {
      await db.plan.create({
        data: {
          name: planName,
          price: planPrice,
          billing_period_value: value,
          billing_period_frequency: frequency,
          subscribed_plan: {
            create: {
              id: v4(),
              user_id: userId,
              subscription_id: subscriptionId,
              payment_start_date: paymentStartDate,
              payment_next_date: paymentNextDate,
              payment_end_date: paymentEndDate,
              has_notifications: false,
              notification_type: notificationType,
              notification_frequency: notificationFrequency,
              notification_time_of_day: notificationTime,
              plan_id: planId,
              notes: notes,
            },
          },
        },
      });
      res.status(201).json({ message: "success" });
    }
  };

  subcribeToNewSubscription = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const {
      subscriptionName,
      image_url,
      category,
      planName,
      planPrice,
      billingPeriod,
      paymentStartDate,
      paymentEndDate,
      notificationType,
      notificationFrequency,
      notificationTime,
      notes,
    } = req.body;

    // format values
    const paymentNextDate = returnPaymentNextDate(
      paymentStartDate,
      billingPeriod
    );
    const { value, frequency } = parseBillingPeriod(billingPeriod);
    const planId = v4();
    const subscriptionId = v4();
    try {
      // check that userId is valid
      const { id }: any = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      console.log("id", id);
      const [subscription, plan]: [
        Prisma.SubscriptionCreateInput,
        Prisma.PlanCreateInput
      ] = await db.$transaction([
        db.subscription.create({
          data: {
            id: subscriptionId,
            name: subscriptionName,
            image_url: image_url,
            category: category,
            user_id: userId,
          },
        }),
        db.plan.create({
          data: {
            name: planName,
            price: planPrice,
            billing_period_value: value,
            billing_period_frequency: frequency,
            subscribed_plan: {
              create: {
                id: v4(),
                user_id: userId,
                subscription_id: subscriptionId,
                payment_start_date: paymentStartDate,
                payment_next_date: paymentNextDate,
                payment_end_date: paymentEndDate,
                has_notifications: false,
                notification_type: notificationType,
                notification_frequency: notificationFrequency,
                notification_time_of_day: notificationTime,
                plan_id: planId,
                notes: notes,
              },
            },
          },
        }),
      ]);
      console.log("executed");
      res.status(201).json({ message: "success" });
    } catch (error) {
      if (error instanceof TypeError) {
        res.status(404).json({ error: "The provided user id cannot be found" });
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.log(error.code, error.message);
        res.status(400).json({ description: error.meta, error: error.message });
      } else {
        res.status(400).json({ message: "something unexpected happened" });
      }
    }
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
