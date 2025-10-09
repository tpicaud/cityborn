"use client";

import { useState, ReactNode, createContext, useContext } from "react";

type View = "home" | "play";

interface Props {
  homeView: ReactNode;
  playView: ReactNode;
}

const ViewContext = createContext<{ setView: (v: View) => void } | null>(null);

export const MenuViewSwitcher = ({ homeView, playView }: Props) => {
  const [view, setView] = useState<View>("home");

  return (
    <ViewContext.Provider value={{ setView }}>
      {view === "home" ? homeView : playView}
    </ViewContext.Provider>
  );
};

MenuViewSwitcher.Trigger = function Trigger({
  view,
  children,
}: {
  view: View;
  children: ReactNode;
}) {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("MenuViewSwitcher.Trigger must be used inside MenuViewSwitcher");

  return (
    <span onClick={() => ctx.setView(view)} className="cursor-pointer">
      {children}
    </span>
  );
};
