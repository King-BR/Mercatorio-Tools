import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import TopNavbar from "../../components/TopNavbar/TopNavbar";

import NotificationsManager from "./components/NotificationsManager";
import NotificationEditor from "./components/NotificationEditor";

import "./Notifications.css";

export const routeConfig = {
  auth: true,
};

export default function Notifications() {
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();

  const notificationId = searchParams.get("id");

  const [refreshKey, setRefreshKey] = useState(0);

  function handleCreate() {
    navigate("/notifications?create=1");
  }

  function handleEdit(id) {
    navigate(`/notifications?id=${encodeURIComponent(id)}`);
  }

  function handleCloseEditor() {
    // navigate back to manager and clear url query
    setSearchParams({});
    navigate("/notifications");

    setRefreshKey((current) => current + 1);
  }

  const creating = searchParams.get("create") === "1";

  return (
    <>
      <TopNavbar />

      {!notificationId && !creating ? (
        <NotificationsManager
          key={refreshKey}
          onCreate={handleCreate}
          onEdit={handleEdit}
        />
      ) : (
        <NotificationEditor
          notificationId={notificationId}
          onClose={handleCloseEditor}
        />
      )}
    </>
  );
}
