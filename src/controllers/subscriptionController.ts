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
import { subscribe } from "diagnostics_channel";

export type SubscriptionType = {
  id: string;
  name: string;
  image_url: string;
};

export type Category = {
  category: string;
  category_url: string;
  data: SubscriptionType[];
};

export type availableSubscriptionsOutput = {
  categories: Category[];
};

class SubscriptionController {
  constructor() {}

  // 1. List all available subscriptions in `CreateSubscription`
  listAvailableUserSubscriptions = async (req: Request, res: Response) => {
    const view = req.query.view;
    const userId = req.params.userId;
    const category: any = req.query.category;
    console.log("category", category);

    try {
      let [uniqueUserId, publicSubscriptions, privateSubscriptions]: [
        any,
        any,
        any
      ] = [undefined, undefined, undefined];

      if (userId == null)
        return res.status(404).json({
          message: `user id ${userId} cannot be found. please try again`,
        });

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
                id: true,
                image_url: true,
                category: true,
                category_url: true,
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
                id: true,
                image_url: true,
                category: true,
                category_url: true,
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
                id: true,
                image_url: true,
                category: true,
                category_url: true,
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
                id: true,
                image_url: true,
                category: true,
                category_url: true,
              },
            }),
          ]);
      }

      const combinedSubscriptions = [
        ...publicSubscriptions,
        ...privateSubscriptions,
      ];
      // View list
      if (view === "list") {
        const categories = [
          "music_streaming",
          "video_streaming",
          "food_delivery",
          "insurance",
          "cloud_storage",
          "others",
        ];

        const output: availableSubscriptionsOutput = { categories: [] };
        categories.forEach((category) => {
          //category = food_delivery
          const subscriptions = combinedSubscriptions.filter(
            (subscription) => subscription.category === category
          );
          const categoryUrl: string = subscriptions[0]?.category_url;
          const categorySubscriptions: any[] = subscriptions.map(
            (subscription) =>
              new Object({
                name: subscription.name,
                image_url: subscription.image_url,
                id: subscription.id,
              })
          );
          output.categories.push({
            category:
              category.replace("_", " ").charAt(0).toUpperCase() +
              category.replace("_", " ").slice(1),
            category_url: categoryUrl,
            data: categorySubscriptions,
          });
        });
        // );
        console.log("output", output);
        res.status(200).json({
          message: "success",
          userId: userId,
          result: output,
        });
      }
      console.log("combinedSubscriptions", combinedSubscriptions);
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

    let paymentNextDate: undefined | string = undefined;
    console.log("paymentStartDate", paymentStartDate);
    console.log("paymentNextDate", paymentNextDate);
    if (
      dayjs(paymentStartDate).isAfter(dayjs(new Date()).format("YYYY-MM-DD"))
    ) {
      paymentNextDate = dayjs(paymentStartDate).format("YYYY-MM-DD");
      console.log("a future date");
    }
    // format values
    else {
      paymentNextDate = returnPaymentNextDate(paymentStartDate, billingPeriod);
      console.log("Not a future date");
    }
    console.log("paymentStartDate", paymentStartDate);
    console.log("paymentNextDate", paymentNextDate);
    // format values
    // const paymentNextDate = returnPaymentNextDate(
    //   paymentStartDate,
    //   billingPeriod
    // );
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
              payment_next_date: paymentNextDate!,
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
      imageUrl,
      category,
      categoryUrl,
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

    let paymentNextDate: undefined | string = undefined;
    console.log("paymentStartDate", paymentStartDate);
    console.log("paymentNextDate", paymentNextDate);
    if (
      dayjs(paymentStartDate).isAfter(dayjs(new Date()).format("YYYY-MM-DD"))
    ) {
      paymentNextDate = dayjs(paymentStartDate).format("YYYY-MM-DD");
      console.log("a future date");
    }
    // format values
    else {
      paymentNextDate = returnPaymentNextDate(paymentStartDate, billingPeriod);
      console.log("Not a future date");
    }
    console.log("paymentStartDate", paymentStartDate);
    console.log("paymentNextDate", paymentNextDate);
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
            image_url: imageUrl,
            category: category,
            category_url: categoryUrl,
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
                payment_next_date: paymentNextDate!,
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
    // Defaults to all subscriptions
    // Optional Year & Month query params
    let { year, month } = req.query;
    console.log(year, month);
    const userId = req.params.userId;
    try {
      const userResult = await db.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      // if userId is not valid
      if (userResult == null)
        res.status(404).json({
          message: `user id ${userId} cannot be found. please try again`,
        });
      // else if userId is valid
      else {
        if (year === undefined && month === undefined) {
          // if year and month params are not provided - Defaults to all subscriptions
          const subscribedSubscriptions =
            await db.subscriptionsOnUsers.findMany({
              where: {
                user_id: {
                  equals: userId,
                },
              },
              select: {
                id: true,
                payment_start_date: true,
                payment_next_date: true,
                payment_end_date: true,
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
          res.status(200).json({
            userId: userId,
            message: "success",
            subscriptions: subscribedSubscriptions,
          });
        }

        // if year and month params are provided
        else {
          // format date
          if (Number(month) < 10) month = `0${Number(month)}`.toString();
          const formattedDateBeginningOfMonth = dayjs(
            new Date(`${year}-${month}-01T12:00:00`)
          ).format("YYYY-MM-DD");

          const formattedDateEndOfMonth = dayjs(formattedDateBeginningOfMonth)
            .endOf("month")
            .format("YYYY-MM-DD");

          const subscribedSubscriptions =
            await db.subscriptionsOnUsers.findMany({
              where: {
                AND: [
                  {
                    user_id: {
                      equals: userId,
                    },
                  },
                  {
                    payment_next_date: {
                      gte: formattedDateBeginningOfMonth,
                    },
                  },
                  {
                    payment_next_date: {
                      lte: formattedDateEndOfMonth,
                    },
                  },
                ],
              },
              select: {
                id: true,
                payment_start_date: true,
                payment_next_date: true,
                payment_end_date: true,
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
          res.status(200).json({
            userId: userId,
            message: "success",
            subscriptions: subscribedSubscriptions,
          });
        }
      }
    } catch (error) {}
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
          notes: notes,
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
