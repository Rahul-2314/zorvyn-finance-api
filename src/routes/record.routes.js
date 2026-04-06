import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {recordSchema, recordUpdateSchema} from "../validators/record.validator.js";
import {addRecord, getRecords, getRecordById, modifyRecord, removeRecord} from "../services/record.service.js";

const router = Router();

// read -> viewer+
// create and edit -> analyst+
// Delete -> admin

// Middleware
router.use(protect);

// Fetch all records with filters and pagination
router.get("/", allow("viewer"), async (req, res, next) => {
	try {
		const result = await getRecords(req.query);
		res.json({ success: true, ...result });
	} catch (err) {
		next(err);
	}
});

// Get single record by ID
router.get("/:id", allow("viewer"), async (req, res, next) => {
	try {
		res.json({ success: true, data: await getRecordById(req.params.id) });
	} catch (err) {
		next(err);
	}
});

// Create new record (analyst allowed)
router.post("/", allow("analyst"), validate(recordSchema), async (req, res, next) => {
	try {
		const record = await addRecord(req.body, req.user._id);
		res.status(201).json({ success: true, data: record });
	} catch (err) {
		next(err);
	}
});

// Update record
router.put("/:id", allow("analyst"), validate(recordUpdateSchema), async (req, res, next) => {
	try {
		res.json({
			success: true,
			data: await modifyRecord(req.params.id, req.body),
		});
	} catch (err) {
		next(err);
	}
});

// soft delete record
router.delete("/:id", allow("admin"), async (req, res, next) => {
	try {
		await removeRecord(req.params.id);
		res.json({ success: true, message: "Record deleted successfully" });
	} catch (err) {
		next(err);
	}
});

export default router;
