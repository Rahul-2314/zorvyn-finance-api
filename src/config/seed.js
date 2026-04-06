import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Record from "../models/record.model.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
await User.deleteMany({});
await Record.deleteMany({});

const hashed = await bcrypt.hash("password123", 10);

const [admin, analyst, viewer] = await User.insertMany([
	{
		name: "Arjun Mehta",
		email: "admin@finance.dev",
		password: hashed,
		role: "admin",
	},
	{
		name: "Priya Sharma",
		email: "analyst@finance.dev",
		password: hashed,
		role: "analyst",
	},
	{
		name: "Rohan Das",
		email: "viewer@finance.dev",
		password: hashed,
		role: "viewer",
	},
]);

await Record.insertMany([
	{
		owner: admin._id,
		amount: 85000,
		type: "income",
		category: "Salary",
		date: new Date("2024-05-01"),
		notes: "May salary credit",
	},
	{
		owner: admin._id,
		amount: 12000,
		type: "expense",
		category: "Rent",
		date: new Date("2024-05-03"),
		notes: "Office space rent",
	},
	{
		owner: analyst._id,
		amount: 4500,
		type: "expense",
		category: "Food",
		date: new Date("2024-05-10"),
	},
	{
		owner: analyst._id,
		amount: 22000,
		type: "income",
		category: "Freelance",
		date: new Date("2024-05-15"),
		notes: "Design project",
	},
	{
		owner: admin._id,
		amount: 3200,
		type: "expense",
		category: "Transport",
		date: new Date("2024-05-18"),
	},
	{
		owner: admin._id,
		amount: 60000,
		type: "income",
		category: "Salary",
		date: new Date("2024-06-01"),
		notes: "June salary credit",
	},
	{
		owner: analyst._id,
		amount: 9800,
		type: "expense",
		category: "Utilities",
		date: new Date("2024-06-05"),
	},
	{
		owner: viewer._id,
		amount: 1500,
		type: "expense",
		category: "Food",
		date: new Date("2024-06-08"),
	},
	{
		owner: admin._id,
		amount: 5000,
		type: "expense",
		category: "Software",
		date: new Date("2024-06-12"),
		notes: "Annual subscriptions",
	},
	{
		owner: analyst._id,
		amount: 30000,
		type: "income",
		category: "Freelance",
		date: new Date("2024-06-20"),
		notes: "Dev contract",
	},
]);

console.log("Seed complete");
await mongoose.disconnect();
