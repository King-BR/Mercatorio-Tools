import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import NotFoundRedirect from "../components/NotFoundRedirect";

// Detects all pages within Pages/*/index.jsx automatically
const pages = import.meta.glob("../Pages/*/index.jsx", {
  eager: true,
});

function getRoutePath(filePath) {
  const match = filePath.match(/\.\.\/Pages\/([^/]+)\/index\.jsx$/);

  if (!match) {
    return null;
  }

  const pageName = match[1];

  // Sets Home page to "/"
  if (pageName.toLowerCase() === "home") {
    return "/";
  }

  // Example: ProductionPlanner -> /production-planner
  return pageName.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export default function AppRoutes() {
  return (
    <Routes>
      {Object.entries(pages).map(([filePath, module]) => {
        const Component = module.default;

        if (!Component) {
          console.error(`Page "${filePath}" does not have a default export.`);

          return null;
        }

        const path = getRoutePath(filePath);

        if (!path) {
          return null;
        }

        const config = module.routeConfig ?? {};

        const element = <Component />;

        if (config.auth) {
          return (
            <Route
              key={filePath}
              path={path}
              element={<ProtectedRoute>{element}</ProtectedRoute>}
            />
          );
        }

        return <Route key={filePath} path={path} element={element} />;
      })}

      {/* Page not found */}
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
