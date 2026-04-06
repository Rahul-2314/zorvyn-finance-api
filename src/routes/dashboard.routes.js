import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import {fetchSummary, fetchCategoryInsights, fetchMonthlyTrends, fetchRecentActivity} from "../services/dashboard.service.js";

const router = Router();

// Summary -> viewer+
// recent -> viewer+
// categories -> analyst+
// trendS -> analyst+

// Middleware
router.use(protect);

// get summary
router.get("/summary", allow("viewer"), async (req, res, next) => {
	try {
		res.json({ success: true, data: await fetchSummary() });
	} catch (err) {
		next(err);
	}
});

// Returns latest records
router.get("/recent", allow("viewer"), async (req, res, next) => {
	try {
		const limit = Math.min(50, parseInt(req.query.limit) || 10);
		res.json({ success: true, data: await fetchRecentActivity(limit) });
	} catch (err) {
		next(err);
	}
});

// Returns category-wise insights
router.get("/categories", allow("analyst"), async (req, res, next) => {
	try {
		res.json({ success: true, data: await fetchCategoryInsights() });
	} catch (err) {
		next(err);
	}
});

// Returns monthly trends
router.get("/trends", allow("analyst"), async (req, res, next) => {
	try {
		res.json({ success: true, data: await fetchMonthlyTrends() });
	} catch (err) {
		next(err);
	}
});

export default router;
