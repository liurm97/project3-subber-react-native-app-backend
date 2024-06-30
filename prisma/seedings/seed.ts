import db from "../../src/utils/db.server";
const main = async () => {
  // Subscriptions

  try {
    // Insert user (✅)
    await db.user.create({
      data: {
        clerk_user_id: crypto.randomUUID(),
        email: "seed.email-test@gmail.com",
      },
    });

    // Create many public and private subscriptions (✅)
    await db.subscription.createMany({
      data: [
        {
          name: "Food Panda",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Ffoodpanda.png?alt=media&token=a3a2549f-b837-4002-a355-1a2d5c87a482",
          category: "food_delivery",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Ffood_delivery.jpg?alt=media&token=a37a0dfa-8952-4bde-8308-41d0aa78e748",
        },
        {
          name: "Grab Food",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fgrabfood.png?alt=media&token=10392df9-7adb-48fb-a65e-b910a0347f5e",
          category: "food_delivery",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Ffood_delivery.jpg?alt=media&token=a37a0dfa-8952-4bde-8308-41d0aa78e748",
        },
        {
          name: "Uber Eats",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fubereats.png?alt=media&token=e4e99e70-2647-4bc8-b963-46f489f5ee22",
          category: "food_delivery",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Ffood_delivery.jpg?alt=media&token=a37a0dfa-8952-4bde-8308-41d0aa78e748",
        },
        {
          name: "Prudential",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fprudential.png?alt=media&token=d74a2a9a-14fc-46d0-a863-b863b3ae66a9",
          category: "insurance",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Finsurance.jpg?alt=media&token=8e8dd827-f48b-4b97-a343-091693dc530d",
        },
        {
          name: "AIA",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Faia.png?alt=media&token=be388b40-bdbe-4f8c-b68e-8d197540d495",
          category: "insurance",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Finsurance.jpg?alt=media&token=8e8dd827-f48b-4b97-a343-091693dc530d",
        },
        {
          name: "Great Eastern",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fgreateastern.png?alt=media&token=ad19aa34-badc-44be-9ed3-415827db713b",
          category: "insurance",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Finsurance.jpg?alt=media&token=8e8dd827-f48b-4b97-a343-091693dc530d",
        },
        {
          name: "Youtube Premium",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fyoutubepremium.png?alt=media&token=57feb523-ead3-4035-9567-8f0ede4a38c3",
          category: "video_streaming",
          category_url: "https://localhost:3000/video_streaming.png",
        },
        {
          name: "Netflix",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fnetflix.png?alt=media&token=8b5b6dbd-be2b-4c70-a2af-e2b544481a9c",
          category: "video_streaming",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Fvideo_streaming.jpg?alt=media&token=74cf8a7f-e3f5-484a-9c81-2f89d14c1c14",
        },
        {
          name: "Disney+",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fdisneyplus.png?alt=media&token=9d68eda3-ac91-4474-8c2e-14cd4d3c0fd6",
          category: "video_streaming",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Fvideo_streaming.jpg?alt=media&token=74cf8a7f-e3f5-484a-9c81-2f89d14c1c14",
        },
        {
          name: "iCloud+ Storage",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Ficloud.png?alt=media&token=60e9dbc6-4358-43d0-8821-6e5cb1e9a112",
          category: "cloud_storage",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Fcloud_storage.jpg?alt=media&token=f6084e31-729a-4488-9e9b-22b319999532",
        },
        {
          name: "OneDrive Storage",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fonedrive.png?alt=media&token=092d4115-60b3-4023-ab76-cc6502eae4f7",
          category: "cloud_storage",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Fcloud_storage.jpg?alt=media&token=f6084e31-729a-4488-9e9b-22b319999532",
        },
        {
          name: "ChatGPT 4.0",
          image_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/subscriptions%2Fchatgpt.png?alt=media&token=94bfcd4a-2c6c-45c6-ac35-1a213b7f9e1b",
          category: "others",
          category_url:
            "https://firebasestorage.googleapis.com/v0/b/subber-71436.appspot.com/o/categories%2Fothers.jpg?alt=media&token=4568595d-eeb9-40a8-a254-0ca0652ae366",
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
