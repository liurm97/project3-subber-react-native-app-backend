import { Request, Response } from "express";
import db from "../utils/db.server";
import { Prisma } from "@prisma/client";

class UserController {
  constructor() {}

  register = async (req: Request, res: Response) => {
    const { email, clerkUserId } = req.body;
    console.log("email", email);
    console.log("clerkUserId", clerkUserId);
    try {
      const result = await db.user.create({
        data: {
          clerk_user_id: clerkUserId,
          email: email,
        },
      });
      console.log(result);
      res
        .status(201)
        .json({ message: "user created successfully", result: result });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          res.status(400).json({
            error:
              "There is a unique constraint violation, a new user cannot be created with this email address",
          });
        }
      } else {
        res.status(400).json({ error: "An error occurred" });
      }
    }
  };
  login = async (req: Request, res: Response) => {
    try {
      // Retrieves user information and authenticates against Clerk
      res.status(201).json("done");
    } catch (error) {
      res.status(400).json({ error: "An error occurred" });
    }
  };
}

export default UserController;
