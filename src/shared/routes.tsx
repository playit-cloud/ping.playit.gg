import { Navigate, createBrowserRouter } from "react-router-dom";
import LatencyTesterPage from "@/pages/LatencyTesterPage";
import SharedResultsPage from "@/pages/SharedResultsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LatencyTesterPage />,
  },
  {
    path: "/shared/:shareId",
    element: <SharedResultsPage />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
