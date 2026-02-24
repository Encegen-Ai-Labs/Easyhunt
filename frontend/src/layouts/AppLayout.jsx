import React, { createContext, useState } from "react";
import { Outlet } from "react-router-dom";

export const FooterContext = createContext(null);

export default function AppLayout() {
  const [footerButtons, setFooterButtons] = useState(null);

  return (
    <FooterContext.Provider value={{ footerButtons, setFooterButtons }}>
      <Outlet />
    </FooterContext.Provider>
  );
}