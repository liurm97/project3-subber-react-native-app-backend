const express = require("express");
const cors = require("cors");
import userRouter from "./src/routes/userRouter";
import subscriptionRouter from "./src/routes/subscriptionRouter";
import expenseRouter from "./src/routes/expenseRouter";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);
app.use("/subscriptions", subscriptionRouter);
app.use("/expenses", expenseRouter);

app.listen(PORT, () => {
  console.log("Application listening to port 3000");
});
