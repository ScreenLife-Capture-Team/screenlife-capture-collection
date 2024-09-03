import { Theme as RadixTheme } from "@radix-ui/themes";
import React from "react";
import { PropsWithChildren } from "react";

export function Theme(props: PropsWithChildren) {
  return <RadixTheme accentColor="grass">{props.children}</RadixTheme>;
}
