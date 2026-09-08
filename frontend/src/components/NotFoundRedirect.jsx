import { Navigate, useLocation } from "react-router-dom";

function NotFoundRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to="/not-found"
      replace
      state={{
        from: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
      }}
    />
  );
}

export default NotFoundRedirect;
