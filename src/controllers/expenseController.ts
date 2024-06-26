import { Request, Response } from "express";
import db from "../utils/db.server";
import { Prisma } from "@prisma/client";
const dayjs = require("dayjs");

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
      const { year, month } = req.query;
      console.log(year, month);
      if (year === undefined && month == undefined) {
        const currentDate: any = dayjs().format("YYYY-MM-DD");

        const monthlySubscriptions = await db.subscriptionsOnUsers.findMany({
          where: {
            AND: [
              {
                payment_start_date: {
                  lte: currentDate,
                },
              },
              {
                payment_end_date: {
                  gte: currentDate,
                },
              },
            ],
          },
          select: {
            subcription_plan: {
              select: {
                price: true,
              },
            },
          },
        });
        const prices = monthlySubscriptions.map(
          (plan) => plan.subcription_plan?.price
        );
        const monthlySubscriptionSum = prices.reduce(
          (a, b) => Number(a) + Number(b),
          0
        );

        res.status(200).json({ result: monthlySubscriptionSum });
      }

      // if year and month params are provided
      else {
        const futureDate = dayjs(
          new Date(`${year}-${month}-01T12:00:00`)
        ).format("YYYY-MM-DD");

        const futureSubscriptions = await db.subscriptionsOnUsers.findMany({
          where: {
            AND: [
              {
                payment_start_date: {
                  lte: futureDate,
                },
              },
              {
                payment_end_date: {
                  gte: futureDate,
                },
              },
            ],
          },
          select: {
            subcription_plan: {
              select: {
                price: true,
              },
            },
          },
        });
        const futurePrices = futureSubscriptions.map(
          (plan) => plan.subcription_plan?.price
        );
        const futureSubscriptionSum = futurePrices.reduce(
          (a, b) => Number(a) + Number(b),
          0
        );
        res.status(200).json({ result: futureSubscriptionSum });
      }
    }
  };
}
export default ExpenseController;
