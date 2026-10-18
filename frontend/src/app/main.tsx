import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Providers } from "./providers";
import { router } from "./router";
import "@/styles/globals.css";

const rootEl = document.getElementById("root");

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </React.StrictMode>,
  );
}
