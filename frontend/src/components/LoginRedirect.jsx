import { Navigate, useLocation } from "react-router-dom";

function LoginRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to="/login"
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

export default LoginRedirect;
