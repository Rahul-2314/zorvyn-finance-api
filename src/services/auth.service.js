import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// generate jwt token
const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
};

// register user
export const registerUser = async(body) => {
    const isTaken = await User.findOne({email: body.email});
    if(isTaken) throw {status: 409, message: "Email is already Registered"};

    const hashed = await bcrypt.hash(body.password, 10);
    const user = await User.create({...body, password: hashed});

    return {token: signToken(user._id), user: user.withoutPassword()};
};

// login user
export const loginUser = async({email, password}) => {
    const user  = await User.findOne({email});
    if(!user || !user.active) throw {status: 401, message: "Invalid credentials"};

    const match = await bcrypt.compare(password, user.password);
    if(!match) throw {status: 401, message: "Invalid credentials"};

    return {token: signToken(user._id), user: user.withoutPassword()};
};
