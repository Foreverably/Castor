import mongoose from "mongoose";

const schema = new mongoose.Schema({
	userId: { type: String },
	username: { type: String },
	createdAt: { type: Number, default: Date.now },
	balance: { type: Number, default: 0 },
	search: { type: Object, default: { next: 0, count: 0, amount: 0 } }
});

const User = mongoose.models?.User || mongoose.model("User", schema);

export default User;
