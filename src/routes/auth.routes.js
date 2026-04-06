import { Router } from "express";
import validate from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { registerUser, loginUser} from "../services/auth.service.js";
import { success } from "zod";

const router = Router();

// Register routes
router.post("/register", validate(registerSchema), async(req, res, next) => {
    try {
        const result = await registerUser(req.body);
        res.status(201).json({success: true, ...result});
    }
    catch(err) {
        next(err);
    }
});

// Login routes
router.post("/login", validate(loginSchema), async(req, res, next) => {
    try {
        const result = await loginUser(req.body);
        res.json({success: true, ...result});
    }
    catch(err) {
        next(err);
    }
});

export default router;

