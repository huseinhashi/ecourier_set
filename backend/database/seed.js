import User from "../models/user.model.js";

export const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      await User.create({
        phone: "252610000000",
        password: "admin123", // In production, hash this!
        name: "Admin",
        role: "admin",
      });
      console.log("Admin user seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};
