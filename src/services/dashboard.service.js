import Record from "../models/record.model.js";

// ignore deleted(soft) records
const notDeleted = { deletedAt: null };

// overall summary - total amount
export const fetchSummary = async () => {
	const rows = await Record.aggregate([
		{ $match: { deletedAt: null } },
		{
			$group: {
				_id: "$type",
				total: { $sum: "$amount" },
				count: { $sum: 1 },
			},
		},
	]);

	const income = rows.find((r) => r._id === "income") || { total: 0, count: 0 };
	const expense = rows.find((r) => r._id === "expense") || {
		total: 0,
		count: 0,
	};

	return {
		totalIncome: income.total,
		totalExpenses: expense.total,
		netBalance: income.total - expense.total,
		totalRecords: income.count + expense.count,
	};
};

// category insights - total amount per category
export const fetchCategoryInsights = () => {
	return Record.aggregate([
		{
			$match: notDeleted,
		},
		{
			$group: {
				_id: { category: "$category", type: "$type" },
				total: { $sum: "$amount" },
				count: { $sum: 1 },
			},
		},
		{
			$sort: { total: -1 },
		},
		{
			$project: {
				_id: 0,
				category: "$_id.category",
				type: "$_id.type",
				total: 1,
				count: 1,
			},
		},
	]);
};

// monthly trends - monthly income/expense trends
export const fetchMonthlyTrends = () => {
	return Record.aggregate([
		{
			$match: notDeleted,
		},
		{
			$group: {
				_id: {
					year: { $year: "$date" },
					month: { $month: "$date" },
					type: "$type",
				},
				total: { $sum: "$amount" },
				count: { $sum: 1 },
			},
		},
		{
			$sort: { "_id.year": 1, "_id.month": 1 },
		},
		{
			$project: {
				_id: 0,
				year: "$_id.year",
				month: "$_id.month",
				type: "$_id.type",
				total: 1,
				count: 1,
			},
		},
	]);
};

// recent activity - Gets latest records
export const fetchRecentActivity = (limit = 10) => {
	return Record.find(notDeleted)
		.sort({ createdAt: -1 })
		.limit(limit)
		.populate("owner", "name email")
		.select("amount type category date notes owner createdAt")
		.lean();
}