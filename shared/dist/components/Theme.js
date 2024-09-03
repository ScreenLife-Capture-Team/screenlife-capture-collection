import { Theme as RadixTheme } from "@radix-ui/themes";
import React from "react";
export function Theme(props) {
    return React.createElement(RadixTheme, { accentColor: "grass" }, props.children);
}
//# sourceMappingURL=Theme.js.map