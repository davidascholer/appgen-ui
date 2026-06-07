import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";

import App from "./App.tsx";
import Components from "./Components.tsx";
import ElementPlayground from "./ElementPlayground.tsx";
import Elements from "./Elements.tsx";
import Playground from "./Playground.tsx";
import { ErrorFallback } from "./ErrorFallback.tsx";

import "./main.css";
import "./styles/theme.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    {window.location.pathname === "/playground" ? (
      <Playground />
    ) :
    window.location.pathname === "/elements/playground" ||
    window.location.pathname === "/element/playground" ? (
      <ElementPlayground />
    ) : window.location.pathname === "/components" ? (
      <Components />
    ) : window.location.pathname === "/elements" ? (
      <Elements />
    ) : (
      <App />
    )}
  </ErrorBoundary>,
);
