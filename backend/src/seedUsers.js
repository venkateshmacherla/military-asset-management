import bcrypt from "bcryptjs";
import pool from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const users = [
  {
    username: "admin",
    password: "Admin@123",
    role: "ADMIN",
    baseId: null,
  },
  {
    username: "commander",
    password: "Commander@123",
    role: "BASE_COMMANDER",
    baseId: 1,
  },
  {
    username: "logistics",
    password: "Logistics@123",
    role: "LOGISTICS_OFFICER",
    baseId: 1,
  },
];

const seedUsers = async () => {
  try {
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 12);

      await pool.query(
        `
        INSERT INTO users (
          username,
          password_hash,
          role,
          base_id
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          base_id = EXCLUDED.base_id
        `,
        [user.username, passwordHash, user.role, user.baseId],
      );

      console.log(`User created: ${user.username}`);
    }

    console.log("All demo users seeded successfully.");
  } catch (error) {
    console.error("User seed failed:", error);
  } finally {
    await pool.end();
  }
};

seedUsers();
