export default function BaseNode({ title, type, children, className = "" }) {
  return (
    <div className={`notification-node ${className}`}>
      <div className="notification-node-header">
        <span>{title}</span>

        <span className="notification-node-type">{type}</span>
      </div>

      <div className="notification-node-content">{children}</div>
    </div>
  );
}
