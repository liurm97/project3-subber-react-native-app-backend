import { Request, Response } from "express";
import db from "../utils/db.server";
import { v4 } from "uuid";
const dayjs = require("dayjs");
import {
  parseBillingPeriod,
  returnPaymentNextDate,
  parseNotificationPeriod,
  returnHasNotification,
} from "../utils/helpers";
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
    const userResult = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (userResult == null)
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
    try {
      const { id }: any = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      // retrive subscribed subscriptions
      /** Details to retrieve | Model
       1. Subscription name | subscription
       2. Subscription image_url | subscription
       3. Plan price | plan
       4. Plan billing_period_value | plan
       5. Plan billing_period_frequency | plan
       */

      const subscribedSubscriptions = await db.subscriptionsOnUsers.findMany({
        where: {
          user_id: {
            equals: userId,
          },
        },
        select: {
          id: true,
          subcription_plan: {
            select: {
              price: true,
              billing_period_value: true,
              billing_period_frequency: true,
            },
          },
          subscription: {
            select: {
              name: true,
              image_url: true,
            },
          },
        },
      });
      res
        .status(200)
        .json({ message: "success", subscriptions: subscribedSubscriptions });
    } catch (error) {
      if (error instanceof TypeError) {
        res.status(404).json({ error: "The provided user id cannot be found" });
      }
    }
  };
  deleteSubscribedUserSubscription = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const subscriptionId = req.params.subscriptionId;
    try {
      const subscriptionResult = await db.subscriptionsOnUsers.findUnique({
        where: { id: subscriptionId },
        select: { id: true },
      });
      const userResult = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      // if invalid userId & subscriptionId
      if (userResult == undefined && subscriptionResult == undefined)
        throw new Error("1");
      // if invalid userId
      else if (userResult == undefined) {
        throw new Error("2");
      }
      // if invalid subscriptionid
      else if (subscriptionResult == undefined) {
        throw new Error("3");
      }
      await db.subscriptionsOnUsers.delete({
        where: {
          id: subscriptionId,
        },
      });

      res.status(200).json({ message: "success" });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "1")
          res.status(404).json({
            error: "The provided user id and subscription id cannot be found",
          });
        else if (error.message === "2")
          res
            .status(404)
            .json({ error: "The provided user id cannot be found" });
        else if (error.message === "3")
          res.status(404).json({
            error: "The provided subscription id cannot be found",
          });
      }
    }
  };
  updateSubscribedUserSubscription = async (req: Request, res: Response) => {
    const {
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

    const paymentNextDate = returnPaymentNextDate(
      paymentStartDate,
      billingPeriod
    );
    const { value, frequency } = parseBillingPeriod(billingPeriod);

    const formattedNotificationFrequency = parseNotificationPeriod(
      notificationFrequency
    );

    const hasNotifications = returnHasNotification(notificationType);
    const userId = req.params.userId;
    const subscriptionId = req.params.subscriptionId;
    try {
      const subscriptionResult = await db.subscriptionsOnUsers.findUnique({
        where: { id: subscriptionId },
        select: { id: true },
      });
      const userResult = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      // if invalid userId & subscriptionId
      if (userResult == undefined && subscriptionResult == undefined)
        throw new Error("1");
      // if invalid userId
      else if (userResult == undefined) {
        throw new Error("2");
      }
      // if invalid subscriptionid
      else if (subscriptionResult == undefined) {
        throw new Error("3");
      }
      await db.subscriptionsOnUsers.update({
        where: {
          id: subscriptionId,
        },

        data: {
          payment_start_date: paymentStartDate,
          payment_end_date: paymentEndDate,
          payment_next_date: paymentNextDate,
          has_notifications: hasNotifications,
          notification_type: notificationType,
          notification_frequency: formattedNotificationFrequency,
          notification_time_of_day: notificationTime,
          subcription_plan: {
            update: {
              name: planName,
              price: planPrice,
              billing_period_value: value,
              billing_period_frequency: frequency,
            },
          },
        },
      });

      res.status(200).json({ message: "success" });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "1")
          res.status(404).json({
            error: "The provided user id and subscription id cannot be found",
          });
        else if (error.message === "2")
          res
            .status(404)
            .json({ error: "The provided user id cannot be found" });
        else if (error.message === "3")
          res.status(404).json({
            error: "The provided subscription id cannot be found",
          });
      }
    }
  };
}

export default SubscriptionController;
