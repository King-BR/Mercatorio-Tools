const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const toolSchema = new mongoose.Schema(
  {
    slug: { type: String },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String, required: true },
    url: { type: String, required: true },
    sourceCode: { type: String },
    status: { type: String, required: true },
    functional: { type: Boolean, required: true },
    featured: { type: Boolean, required: true },
    external: { type: Boolean, required: true },
    creator: { type: String, required: true },
    manteiner: { type: String },
    tags: { type: [String], required: true },
  },
  {
    collection: "Tools-merc_tools",
    timestamps: true,
  },
);

toolSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-");
  }
  next();
});

const ToolsDB = mongoose.model("Tools", toolSchema);
module.exports = ToolsDB;
