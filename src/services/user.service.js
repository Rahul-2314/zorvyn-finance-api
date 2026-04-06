import User from "../models/user.model.js";

// remove [password and version-key] from query result
const safeFields = "-password -__v";

// get all users
export const getAllUsers = () => {
    return User.find().select(safeFields).lean();
}

// get user by ID
export const getUserById = async(id) => {
    const user = await User.findById(id).select(safeFields).lean();
    if(!user) throw {status: 404, message: "User not found"};
    return user;
}

// update role of user by ID
export const updateRole = async (id, role) => {
    const user = await User.findByIdAndUpdate(
        id,
		{ $set: { role } },
		{ new: true, runValidators: true },
	).select(safeFields);
    if(!user) throw {status: 404, message: "User not found"};
    return user;
}

// update status of user by ID
export const updateStatus = async (id, active) => {
    const user = await User.findByIdAndUpdate(
        id,
		{ $set: { active } },
		{ new: true, runValidators: true },
	).select(safeFields);
    if(!user) throw {status: 404, message: "User not found"};
    return user;
}
