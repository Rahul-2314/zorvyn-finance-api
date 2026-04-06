import { id } from "zod/v4/locales";
import Record from "../models/record.model.js";
import mongoose from "mongoose";

// ignore deleted(soft) records
const notDeleted = { deletedAt: { $eq: null } };

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// add new record
export const addRecord = (body, userId) => {
    return Record.create({...body, owner: userId, date: new Date(body.date)});
};

// get records
export const getRecords = async (query) => {
    const filter = {...notDeleted};

    // if present in query -> validate
    if(query.type) filter.type = query.type;
    if(query.category) filter.category = new RegExp(query.category, "i");
    if(query.from || query.to){
        filter.date = {};
        if (query.from) filter.date.$gte = new Date(query.from);
		if (query.to) filter.date.$lte = new Date(query.to);
    }

    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 20);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
		Record.aggregate([
			{ $match: filter },
			{ $sort: { date: -1 } },
			{ $skip: skip },
			{ $limit: limit },
			{
				$lookup: {
					from: "users",
					localField: "owner",
					foreignField: "_id",
					as: "owner",
					pipeline: [{ $project: { name: 1, email: 1 } }],
				},
			},
			{ $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
		]),
		Record.countDocuments(filter),
	]);

    return {data: rows, total, page, pages: Math.ceil(total/limit)};
};

// get record by ID
export const getRecordById = async (id) => {
    if (!isValidId(id)) throw { status: 404, message: "Record not found" };
    const record = await Record.findOne({
        _id: id,
        ...notDeleted
    }).populate("owner", "name email");

    if(!record) throw {status: 404, message: "Record not found"};
    return record;
};

// modify record by ID
export const modifyRecord = async (id, body) => {
    if (!isValidId(id)) throw { status: 404, message: "Record not found" };
    if(body.date) body.date = new Date(body.date);

    const record = await Record.findByIdAndUpdate(
        {_id: id, ...notDeleted},
        { $set: body },
        {new: true, runValidators: true}
    );
    
    if(!record) throw {status: 404, message: "Record not found"};
    return record;
};

// remove record by ID
export const removeRecord = async (id) => {
    if (!isValidId(id)) throw { status: 404, message: "Record not found" };
    const existing = await Record.findOne({ _id: id, deletedAt: null });
    if(!existing) throw {status: 404, message: "Record not found"};
    await Record.updateOne({_id: id}, {$set: {deletedAt: new Date()}});
};