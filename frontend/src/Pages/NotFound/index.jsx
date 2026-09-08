import { useLocation } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const location = useLocation();
  const from = location.state?.from;

  console.log("Página inexistente:", from);
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>

        <h1>Page not found</h1>

        <p>The page you're looking for doesn't exist or may have been moved.</p>

        <p>
          Redirected from:
          <code>
            {from ? ` ${from.pathname}${from.search}${from.hash}` : " unknown"}
          </code>
        </p>

        <a href="/">Return to home</a>
      </div>
    </div>
  );
}
