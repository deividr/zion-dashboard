"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useHeaderStore } from "@/stores/header-store";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "./ui/breadcrumb";

export function SiteHeader() {
    const titles = useHeaderStore((state) => state.titles);

    return (
        <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {titles.map((title, index) => (
                            <div key={index} className="flex items-center">
                                <BreadcrumbItem className={index !== titles.length - 1 ? "hidden md:block" : ""}>
                                    {index !== titles.length - 1 ? (
                                        <BreadcrumbLink href="#">{title}</BreadcrumbLink>
                                    ) : (
                                        <h1 className="text-base font-medium">{title}</h1>
                                    )}
                                </BreadcrumbItem>
                                {index !== titles.length - 1 && <BreadcrumbSeparator className="hidden md:block" />}
                            </div>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </header>
    );
}
