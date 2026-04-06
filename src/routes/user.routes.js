import { Router } from "express";
import { protect, allow } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {roleValidatorSchema, statusValidatorSchema} from "../validators/user.validator.js";
import {getAllUsers, getUserById, updateRole, updateStatus} from "../services/user.service.js";

const router = Router();

// middleware
router.use(protect, allow("admin"));

// fetch all users
router.get("/", async (req, res, next) => {
	try {
		res.json({ success: true, data: await getAllUsers() });
	} catch (err) {
		next(err);
	}
});

// Fetch single user by ID
router.get("/:id", async (req, res, next) => {
	try {
		res.json({ success: true, data: await getUserById(req.params.id) });
	} catch (err) {
		next(err);
	}
});

// Updates user role
router.patch("/:id/role", validate(roleValidatorSchema), async (req, res, next) => {
	try {
		res.json({
			success: true,
			data: await updateRole(req.params.id, req.body.role),
		});
	} catch (err) {
		next(err);
	}
});

// Updates user active status
router.patch("/:id/status", validate(statusValidatorSchema), async (req, res, next) => {
	try {
		res.json({
			success: true,
			data: await updateStatus(req.params.id, req.body.active),
		});
	} catch (err) {
		next(err);
	}
});

export default router;
