import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import TopNavbar from "../../components/TopNavbar/TopNavbar";

import NotificationsManager from "./components/NotificationsManager";

import "./Notifications.css";

export const routeConfig = {
  auth: true,
};

export default function Notifications() {
  const navigate = useNavigate();

  function handleCreate() {
    navigate("/notifications/new");
  }

  function handleEdit(id) {
    navigate(`/notifications/${encodeURIComponent(id)}`);
  }

  return (
    <>
      <TopNavbar />

      <NotificationsManager onCreate={handleCreate} onEdit={handleEdit} />
    </>
  );
}
