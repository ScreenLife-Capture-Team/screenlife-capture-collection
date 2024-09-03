import { Button, Flex } from "@radix-ui/themes";
import { createContext, useContext } from "react";
import style from "./page.module.css";
import React from "react";
const SidebarContext = createContext({
    pathname: "",
    onClick: () => { },
});
function SidebarRoot(props) {
    return (React.createElement(SidebarContext.Provider, { value: { pathname: props.pathname, onClick: props.onClick } },
        React.createElement(Flex, { direction: "column", gap: "2", className: style["sidebar"] }, props.children)));
}
function SidebarButton({ label, slug, route, icon, }) {
    const { pathname, onClick } = useContext(SidebarContext);
    const selected = pathname.includes(slug);
    return (React.createElement(Button, { className: style[selected ? "sidebar-button-selected" : "sidebar-button"], onClick: () => onClick(route) },
        icon,
        label));
}
export const Sidebar = { Root: SidebarRoot, Button: SidebarButton };
//# sourceMappingURL=Sidebar.js.map