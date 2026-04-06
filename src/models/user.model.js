import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 60,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
            type: String,
            required: true
        },
		role: {
			type: String,
			enum: ["viewer", "analyst", "admin"],
			default: "viewer",
		},
		active: {
            type: Boolean,
            default: true
        },
	},
	{ timestamps: true },
);

userSchema.methods.withoutPassword = function () {
	const obj = this.toObject();
	delete obj.password;
	delete obj.__v;
	return obj;
};

export default mongoose.model("User", userSchema);
