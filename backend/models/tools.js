const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const categorySchema = new mongoose.Schema(
  {
    slug: { type: String },
    name: { type: String, required: true },
  },
  {
    collection: "ToolsCategories-merc_tools",
    timestamps: true,
  },
);

const toolSchema = new mongoose.Schema(
  {
    slug: { type: String },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: ObjectId, ref: "ToolsCategories", required: true },
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

const ToolsCategoriesDB = mongoose.model("ToolsCategories", categorySchema);
const ToolsDB = mongoose.model("Tools", toolSchema);
module.exports = {
  ToolsDB,
  ToolsCategoriesDB,
};
