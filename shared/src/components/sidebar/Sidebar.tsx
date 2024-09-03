import { Button, Flex } from "@radix-ui/themes";
import { createContext, PropsWithChildren, ReactNode, useContext } from "react";
import style from "./page.module.css";
import React from "react";

const SidebarContext = createContext<{
  pathname: string;
  onClick: (path: string) => void;
}>({
  pathname: "",
  onClick: () => {},
});

function SidebarRoot(
  props: PropsWithChildren & {
    pathname: string;
    onClick: (path: string) => void;
  }
) {
  return (
    <SidebarContext.Provider
      value={{ pathname: props.pathname, onClick: props.onClick }}
    >
      <Flex direction="column" gap="2" className={style["sidebar"]}>
        {props.children}
      </Flex>
    </SidebarContext.Provider>
  );
}

function SidebarButton({
  label,
  slug,
  route,
  icon,
}: {
  label: string;
  slug: string;
  route: string;
  icon: ReactNode;
}) {
  const { pathname, onClick } = useContext(SidebarContext);

  const selected = pathname.includes(slug);

  return (
    <Button
      className={style[selected ? "sidebar-button-selected" : "sidebar-button"]}
      onClick={() => onClick(route)}
    >
      {icon}
      {label}
    </Button>
  );
}

export const Sidebar = { Root: SidebarRoot, Button: SidebarButton };
