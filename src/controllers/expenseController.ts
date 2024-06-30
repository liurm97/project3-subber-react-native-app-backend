import { Request, Response } from "express";
import db from "../utils/db.server";
import { Prisma } from "@prisma/client";
const dayjs = require("dayjs");
import { SubscriptionCategory } from "@prisma/client";
class ExpenseController {
  constructor() {}

  test = async (req: Request, res: Response) => {
    res.send("test");
  };

  calculateTotalMonthlyExpenses = async (req: Request, res: Response) => {
    /**
    // 1. default to current month (express backend)
       2. allows optional year and month query params
     */

    const userId = req.params.userId;
    const userResult = await db.user.findUnique({
      where: {
        id: userId,
      },
    });
    // if userId is not valid
    if (userResult === null) {
      res
        .status(404)
        .json({ error: `The user id provided ${userId} is invalid` });
    }

    // if userId is valid
    else {
      // if year and month params are not provided - Defaults to current month
      const { year, month, category } = req.query;
      const parsedCategory = category as SubscriptionCategory;
      console.log("category", parsedCategory);
      console.log(year, month);
      if (year === undefined && month == undefined) {
        const currentDate: any = dayjs().format("YYYY-MM-DD");

        const formattedDateBeginningOfMonth = dayjs(currentDate)
          .startOf("month")
          .format("YYYY-MM-DD");

        const formattedDateEndOfMonth = dayjs(formattedDateBeginningOfMonth)
          .endOf("month")
          .format("YYYY-MM-DD");

        console.log(
          "formattedDateBeginningOfMonth",
          formattedDateBeginningOfMonth
        );
        console.log("formattedDateEndOfMonth", formattedDateEndOfMonth);

        const monthlySubscriptions = await db.subscriptionsOnUsers.findMany({
          where: {
            AND: [
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
              {
                user_id: userId,
              },
            ],
          },
          select: {
            user_id: true,
            payment_start_date: true,
            payment_next_date: true,
            subcription_plan: {
              select: {
                billing_period_frequency: true,
                price: true,
              },
            },
          },
        });

        console.log("monthlySubscriptions", monthlySubscriptions);
        let totalMonthlyExpenses = 0;
        monthlySubscriptions.forEach((subscription) => {
          // day
          if (
            subscription.subcription_plan?.billing_period_frequency === "day"
          ) {
            const daysDiffBetweenPaymentStartAndEndOfMonth = Number(
              dayjs(formattedDateEndOfMonth).diff(
                dayjs(subscription.payment_start_date),
                "day"
              )
            );
            console.log(
              "daysDiffBetweenPaymentStartAndEndOfMonth",
              daysDiffBetweenPaymentStartAndEndOfMonth
            );
            // take daily expense * number of days in a month
            totalMonthlyExpenses +=
              Number(subscription.subcription_plan?.price) *
              (daysDiffBetweenPaymentStartAndEndOfMonth + 1);
            console.log("totalMonthlyExpenses", totalMonthlyExpenses);
          }
          // month
          else if (
            subscription.subcription_plan?.billing_period_frequency === "month"
          ) {
            // take daily expense * 1
            totalMonthlyExpenses += Number(
              subscription.subcription_plan?.price
            );
            console.log("totalMonthlyExpenses", totalMonthlyExpenses);
          }
        });
        console.log("totalMonthlyExpenses", totalMonthlyExpenses);

        res.status(200).json({ result: totalMonthlyExpenses });
      }

      // if year and month params are provided
      else {
        // if category is not provided
        const futureDate = dayjs(
          new Date(`${year}-${month}-01T00:00:00`)
        ).format("YYYY-MM-DD");
        console.log("futureDate", futureDate);

        const formattedFutureDateBeginningOfMonth = dayjs(futureDate)
          .startOf("month")
          .format("YYYY-MM-DD");

        const formattedFutureDateEndOfMonth = dayjs(
          formattedFutureDateBeginningOfMonth
        )
          .endOf("month")
          .format("YYYY-MM-DD");

        console.log(
          "formattedDateBeginningOfMonth",
          formattedFutureDateBeginningOfMonth
        );
        console.log(
          "formattedFutureDateEndOfMonth",
          formattedFutureDateEndOfMonth
        );
        if (category === undefined) {
          const futureSubscriptions = await db.subscriptionsOnUsers.findMany({
            where: {
              AND: [
                {
                  payment_next_date: {
                    lte: formattedFutureDateEndOfMonth,
                  },
                },
                {
                  payment_next_date: {
                    gte: formattedFutureDateBeginningOfMonth,
                  },
                },
                {
                  user_id: userId,
                },
              ],
            },
            select: {
              user_id: true,
              payment_start_date: true,
              payment_next_date: true,
              payment_end_date: true,
              subcription_plan: {
                select: {
                  billing_period_frequency: true,
                  price: true,
                },
              },
              subscription: {
                select: {
                  category: true,
                  category_url: true,
                },
              },
            },
          });

          console.log("futureSubscriptions", futureSubscriptions);

          let totalFutureMonthlyExpenses = 0;
          futureSubscriptions.forEach((subscription) => {
            // day
            if (
              subscription.subcription_plan?.billing_period_frequency === "day"
            ) {
              if (
                dayjs(subscription.payment_start_date).format("MM") ==
                  dayjs(subscription.payment_next_date).format("MM") &&
                dayjs(subscription.payment_start_date).format("YYYY") ==
                  dayjs(subscription.payment_next_date).format("YYYY")
              ) {
                const daysDiffBetweenPaymentStartAndEndOfMonth = Number(
                  dayjs(formattedFutureDateEndOfMonth).diff(
                    dayjs(subscription.payment_start_date),
                    "day"
                  )
                );
                console.log(
                  "daysDiffBetweenPaymentStartAndEndOfMonth",
                  daysDiffBetweenPaymentStartAndEndOfMonth
                );
                // take daily expense * number of days in a month
                totalFutureMonthlyExpenses +=
                  Number(subscription.subcription_plan?.price) *
                  (daysDiffBetweenPaymentStartAndEndOfMonth + 1);
                console.log(
                  "totalFutureMonthlyExpenses",
                  totalFutureMonthlyExpenses
                );
              } else {
                const daysDiffBetweenStartAndEndOfMonth = Number(
                  dayjs(formattedFutureDateEndOfMonth).diff(
                    dayjs(formattedFutureDateBeginningOfMonth),
                    "day"
                  )
                );
                console.log(
                  "daysDiffBetweenPaymentStartAndEndOfMonth",
                  daysDiffBetweenStartAndEndOfMonth
                );
                // take daily expense * number of days in a month
                totalFutureMonthlyExpenses +=
                  Number(subscription.subcription_plan?.price) *
                  (daysDiffBetweenStartAndEndOfMonth + 1);
                console.log(
                  "totalFutureMonthlyExpenses",
                  totalFutureMonthlyExpenses
                );
              }
            }
            // month
            else if (
              subscription.subcription_plan?.billing_period_frequency ===
              "month"
            ) {
              // take daily expense * 1
              totalFutureMonthlyExpenses += Number(
                subscription.subcription_plan?.price
              );
              console.log(
                "totalFutureMonthlyExpenses",
                totalFutureMonthlyExpenses
              );
            }
          });
          console.log(
            "totalFutureMonthlyExpenses",
            Math.floor(Number(totalFutureMonthlyExpenses))
          );

          // const futurePrices = futureSubscriptions.map(
          //   (plan) => plan.subcription_plan?.price
          // );
          // const futureSubscriptionSum = futurePrices.reduce(
          //   (a, b) => Number(a) + Number(b),
          //   0
          // );
          res
            .status(200)
            .json({ result: Math.floor(Number(totalFutureMonthlyExpenses)) });
        }
        // if category param is provided
        else if (parsedCategory) {
          const futureSubscriptionsByCategory =
            await db.subscriptionsOnUsers.findMany({
              where: {
                AND: [
                  {
                    payment_next_date: {
                      lte: formattedFutureDateEndOfMonth,
                    },
                  },
                  {
                    payment_next_date: {
                      gte: formattedFutureDateBeginningOfMonth,
                    },
                  },
                  {
                    user_id: userId,
                  },
                  {
                    subscription: {
                      category: parsedCategory,
                    },
                  },
                ],
              },
              select: {
                user_id: true,
                payment_start_date: true,
                payment_next_date: true,
                payment_end_date: true,
                subcription_plan: {
                  select: {
                    billing_period_frequency: true,
                    price: true,
                  },
                },
                subscription: {
                  select: {
                    category: true,
                    category_url: true,
                  },
                },
              },
            });

          console.log(
            "futureSubscriptionsByCategory",
            futureSubscriptionsByCategory
          );

          let totalFutureMonthlyExpenses = 0;
          futureSubscriptionsByCategory.forEach((subscription) => {
            // day
            if (
              subscription.subcription_plan?.billing_period_frequency === "day"
            ) {
              if (
                dayjs(subscription.payment_start_date).format("MM") ==
                  dayjs(subscription.payment_next_date).format("MM") &&
                dayjs(subscription.payment_start_date).format("YYYY") ==
                  dayjs(subscription.payment_next_date).format("YYYY")
              ) {
                const daysDiffBetweenPaymentStartAndEndOfMonth = Number(
                  dayjs(formattedFutureDateEndOfMonth).diff(
                    dayjs(subscription.payment_start_date),
                    "day"
                  )
                );
                console.log(
                  "daysDiffBetweenPaymentStartAndEndOfMonth",
                  daysDiffBetweenPaymentStartAndEndOfMonth
                );
                // take daily expense * number of days in a month
                totalFutureMonthlyExpenses +=
                  Number(subscription.subcription_plan?.price) *
                  (daysDiffBetweenPaymentStartAndEndOfMonth + 1);
                console.log(
                  "totalFutureMonthlyExpenses",
                  totalFutureMonthlyExpenses
                );
              } else {
                const daysDiffBetweenStartAndEndOfMonth = Number(
                  dayjs(formattedFutureDateEndOfMonth).diff(
                    dayjs(formattedFutureDateBeginningOfMonth),
                    "day"
                  )
                );
                console.log(
                  "daysDiffBetweenPaymentStartAndEndOfMonth",
                  daysDiffBetweenStartAndEndOfMonth
                );
                // take daily expense * number of days in a month
                totalFutureMonthlyExpenses +=
                  Number(subscription.subcription_plan?.price) *
                  (daysDiffBetweenStartAndEndOfMonth + 1);
                console.log(
                  "totalFutureMonthlyExpenses",
                  totalFutureMonthlyExpenses
                );
              }
            }
            // month
            else if (
              subscription.subcription_plan?.billing_period_frequency ===
              "month"
            ) {
              // take daily expense * 1
              totalFutureMonthlyExpenses += Number(
                subscription.subcription_plan?.price
              );
              console.log(
                "totalFutureMonthlyExpenses",
                totalFutureMonthlyExpenses
              );
            }
          });
          console.log(
            "totalFutureMonthlyExpenses",
            Math.floor(Number(totalFutureMonthlyExpenses))
          );

          // const futurePrices = futureSubscriptions.map(
          //   (plan) => plan.subcription_plan?.price
          // );
          // const futureSubscriptionSum = futurePrices.reduce(
          //   (a, b) => Number(a) + Number(b),
          //   0
          // );
          res
            .status(200)
            .json({ result: Math.trunc(totalFutureMonthlyExpenses) });
        }
      }
    }
  };
}
export default ExpenseController;
