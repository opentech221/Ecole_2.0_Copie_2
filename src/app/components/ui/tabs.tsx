"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-slate-100/90 text-slate-600 inline-flex h-10 w-fit items-center justify-center rounded-2xl border border-slate-300/80 p-1 shadow-sm shadow-slate-950/5 backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300 dark:shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-sm font-semibold tracking-wide whitespace-nowrap transition-[color,box-shadow,transform,background-color] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-200/70 data-[state=inactive]:hover:text-slate-950 dark:data-[state=inactive]:text-slate-300 dark:data-[state=inactive]:hover:bg-slate-800/70 dark:data-[state=inactive]:hover:text-slate-50 data-[state=active]:border-slate-300 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-slate-50 dark:data-[state=active]:shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
