import ToolCard from "../ToolCard/ToolCard";
import "./ToolGrid.css";

function ToolGrid({ tools, featured = false }) {
  if (tools.length === 0) {
    return (
      <div className="no-tools">
        <span>🔎</span>

        <h3>No tools found</h3>

        <p>Try searching for another name or category.</p>
      </div>
    );
  }

  return (
    <div className={`tool-grid ${featured ? "featured-grid" : ""}`}>
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} featured={featured} />
      ))}
    </div>
  );
}

export default ToolGrid;
