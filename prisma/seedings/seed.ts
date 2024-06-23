import db from "../../src/utils/db.server";
const main = async () => {
  // Subscriptions

  try {
    // Insert user (✅)
    await db.user.create({
      data: {
        clerk_user_id: crypto.randomUUID(),
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@gmail.com",
      },
    });

    // Create many public and private subscriptions (✅)
    await db.subscription.createMany({
      data: [
        {
          name: "FoodPanda",
          image_url: "https://localhost:3000/foodpanda.png",
          category: "food_delivery",
        },
        {
          name: "GrabFood",
          image_url: "https://localhost:3000/foodpanda.png",
          category: "food_delivery",
        },
        {
          name: "Uber Eats",
          image_url: "https://localhost:3000/foodpanda.png",
          category: "food_delivery",
        },
        {
          name: "Prudential",
          image_url: "https://localhost:3000/prudential.png",
          category: "insurance",
        },
      ],
    });

    // Insert a user_subscription_junction table

    // 8aff1175-c02b-45c0-80dd-75ce2e0747dd
  } catch (err) {
    console.log("error", err);
  }
};
main()
  .then(async () => {
    console.log("disconnecting to database");
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

// const subscription = {
//   name: "Netflix",
//   image_url: "https://localhost:3000/netflix.png",
//   category: "video_streaming",
//   user_id: null,
//   plans: [
//     {
//       id: crypto.randomUUID(),
//       name: "plan_netflix_basic",
//       price: 13.98,
//       billing_period_frequency: "monthly",
//     },
//     {
//       id: crypto.randomUUID(),
//       name: "plan_netflix_standard",
//       price: 19.98,
//       billing_period_frequency: "monthly",
//     },
//     {
//       id: crypto.randomUUID(),
//       name: "plan_netflix_premium",
//       price: 25.98,
//       billing_period_frequency: "monthly",
//     },
//   ],
// };
