import UserController from "../controllers/userController";
const express = require("express");

const userRouter = express.Router();
const userController = new UserController();
userRouter.post("/register", userController.register);
userRouter.post("/login", userController.login);

export default userRouter;

// app.get("/", (req: any, res: any) => {
//   //   main()
//   //     .then((users) => res.send(users))
//   //     .catch((e) => {
//   //       console.log(e.message);
//   //     })
//   //     .finally(async () => {
//   //       await prisma.$disconnect();
//   //     });
//   // });
