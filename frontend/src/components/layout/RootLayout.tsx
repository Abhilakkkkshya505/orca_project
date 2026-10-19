import React from "react";
import { Outlet } from "react-router-dom";
import { ConsentBanner } from "./ConsentBanner";

/** Root layout — always inside the router, so Link works in ConsentBanner */
export const RootLayout: React.FC = () => (
  <>
    <Outlet />
    <ConsentBanner />
  </>
);
