import { PropsWithChildren, ReactNode } from "react";
import React from "react";
declare function SidebarRoot(props: PropsWithChildren & {
    pathname: string;
    onClick: (path: string) => void;
}): React.JSX.Element;
declare function SidebarButton({ label, slug, route, icon, }: {
    label: string;
    slug: string;
    route: string;
    icon: ReactNode;
}): React.JSX.Element;
export declare const Sidebar: {
    Root: typeof SidebarRoot;
    Button: typeof SidebarButton;
};
export {};
//# sourceMappingURL=Sidebar.d.ts.map