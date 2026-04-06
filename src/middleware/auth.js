import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { success } from "zod";

// Authentication middleware
export const protect = async (req, res, next) => {
    const bearer = req.headers.authorization;
    if(!bearer?.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "No token provided"
        });
    }

    try {
        const payload = jwt.verify(bearer.split(" ")[1], process.env.JWT_SECRET);
        const found = await User.findById(payload.id).select("-password -__v");
        if(!found || !found.active){
            return res.status(401).json({
                success: false,
                message: "Account not found or deactivated"
            });
        }

        // found
        req.user = found;
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

const roleWt = {viewer: 1, analyst: 2, admin: 3};

// Authorization middleware
export const allow = (...mini) => (req, res, next) => {
    const required = Math.min(...mini.map((r) => roleWt[r]));
    if(roleWt[req.user.role] >= required) return next();
    res.status(403).json({
        success: false,
        message: "You do not have permission for this action"
    });
};