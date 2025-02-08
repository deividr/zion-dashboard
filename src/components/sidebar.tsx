"use client";

import {
  ChevronUp,
  Home,
  LogOut,
  ShoppingCart,
  SquareChartGantt,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const items = [
  {
    title: "Início",
    url: "/",
    icon: Home,
  },
  {
    title: "Pedidos",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Clientes",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Produtos",
    url: "/products",
    icon: SquareChartGantt,
  },
];

export function AppSidebar() {
  const { signOut, user } = useClerk();
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-gray-200 bg-gradient-to-b from-white to-gray-50">
      <SidebarHeader>
        <SidebarMenu className="flex flex-row items-center justify-center gap-3 p-4">
          <Avatar className="h-10 w-10 border-2 border-orange-200">
            <AvatarImage src="/images/logo.png" alt="La Buonapasta" />
            <AvatarFallback className="bg-orange-100 text-orange-700">
              LB
            </AvatarFallback>
          </Avatar>
          <SidebarMenuItem className="font-bold text-lg text-gray-800">
            LaBuonapasta
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="opacity-50" />

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "transition-all duration-200 hover:bg-orange-50",
                      (pathname === item.url ||
                        pathname.startsWith(`${item.url}/`)) &&
                        "bg-orange-100 text-orange-800 font-bold shadow-sm border-r-4 border-r-orange-800",
                    )}
                  >
                    <a
                      href={item.url}
                      className="flex items-center gap-4 px-5 py-4 rounded-lg text-lg"
                    >
                      <item.icon className="size-12" />
                      <span className="text-lg tracking-wide">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 bg-gray-50">
        <SidebarMenu className="p-2">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full p-5 hover:bg-orange-200">
                  <div className="flex items-center gap-3 py-1">
                    <Avatar className="h-8 w-8 border border-orange-200">
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || "User"}
                      />
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        {user?.fullName?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-700">
                        {user?.firstName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4 text-gray-500" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" className="w-[200px] p-2">
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
