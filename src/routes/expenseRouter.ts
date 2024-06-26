import ExpenseController from "../controllers/expenseController";
const express = require("express");

const expenseRouter = express.Router();
const expenseController = new ExpenseController();

expenseRouter.get("/test", expenseController.test);

// Calculate total expenses for a user for the current month
expenseRouter.get(
  "/users/:userId",
  expenseController.calculateTotalMonthlyExpenses
);

export default expenseRouter;
