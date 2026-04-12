import type * as React from "react"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { RouteObject } from "@/app/reducers/uiReducer"
import UserDropdown from "@/components/custom/system/UserDropdown"
import ServerStatus from "@/components/custom/system/ServerStatus"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  data: {
    versions: Array<string>
    navMain: Array<RouteObject>
  }
  onSideBarItemClick?: (route: Array<RouteObject>) => void
}

export function AppSidebar({
  data,
  onSideBarItemClick,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar {...props} className={"border-border"}>
      <SidebarHeader>
        <VersionSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map(item => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items?.map(subItem => (
                  <SidebarMenuItem key={subItem.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={subItem.active}
                      onClick={() => onSideBarItemClick?.([item, subItem])}
                    >
                      <a href="#">{subItem.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail className={"after:!border-border"} />
      <SidebarFooter>
        <ServerStatus />
        <UserDropdown />
      </SidebarFooter>
    </Sidebar>
  )
}
