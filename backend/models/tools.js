import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema.Types;

const toolSchema = new mongoose.Schema(
  {
    id: { type: ObjectId, auto: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String, required: true },
    url: { type: String, required: true },
    status: { type: String, required: true },
    functional: { type: Boolean, required: true },
    featured: { type: Boolean, required: true },
    tags: { type: [String], required: true },
  },
  {
    collection: "Tools-merc_tools",
    timestamps: true,
  },
);

const ToolsDB = mongoose.model("Tools", toolSchema);
export default ToolsDB;
