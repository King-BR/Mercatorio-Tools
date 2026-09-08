import "./ToolCard.css";

function ToolCard({ tool, featured = false }) {
  var isFunctional = tool.functional;
  var status = null;

  switch (tool.status) {
    case "available":
      status = "Available";
      break;
    case "dev":
      status = "In development";
      break;
    case "planned":
      status = "Planned";
      break;
    case "deprecated":
      status = "Deprecated";
      break;
    default:
      status = "Unknown";
  }

  const handleClick = () => {
    if (!isFunctional) {
      return;
    }

    // if tool is external open in new tab
    if (tool.external) {
      window.open(tool.url, "_blank", "noopener,noreferrer");
    } else {
      window.location.assign(tool.url);
    }
  };

  return (
    <article className={`tool-card ${featured ? "featured" : ""}`}>
      <div className="tool-card-header">
        <div className="tool-icon">{tool.icon}</div>

        <span className={`tool-status ${tool.status}`}>
          <span className="status-dot" />

          {status}
        </span>
      </div>

      <div className="tool-card-content">
        <h3>{tool.name}</h3>

        <p>{tool.description}</p>
      </div>

      <div className="tool-card-creator">
        Created by: {tool.creator}
        {tool.manteiner && (
          <>
            <br />
            Maintained by: {tool.manteiner}
          </>
        )}
      </div>

      <div className="tool-card-footer">
        {isFunctional ? (
          <button className="tool-button" onClick={handleClick}>
            Open tool
            <span>→</span>
          </button>
        ) : (
          <button className="tool-button disabled" disabled>
            Coming soon
          </button>
        )}
        {tool.sourceCode && (
          <button
            className="tool-button"
            onClick={() => window.open(tool.sourceCode, "_blank")}
          >
            View source code
            <span>→</span>
          </button>
        )}
      </div>
    </article>
  );
}

export default ToolCard;
