import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        date: {
            type: Date,
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
            maxlength: 500,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
)

recordSchema.index({
	type: 1,
	category: 1,
	date: -1,
	deletedAt: 1,
});

export default mongoose.model("Record", recordSchema);