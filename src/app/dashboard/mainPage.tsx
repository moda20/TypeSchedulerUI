import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Outlet, RouterProvider, useNavigate } from "react-router"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAppDispatch, useAppSelector } from "@/app/hooks"
import {
  changeRoute,
  routes,
  currentRoute,
  RouteObject,
} from "@/app/reducers/uiReducer"
import { useEffect } from "react"

import DrawerMenuConfigurator from "@/components/custom/DrawerMenuConfigurator"
import SearchBar from "@/components/custom/SearchBar"
import JobsStatusCount from "@/components/custom/dashboard/JobsStatusCount"
import JobEventsCount from "@/components/custom/dashboard/JobEventsCount"

export default function MainPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const routesList = useAppSelector(routes)
  const activeRoute = useAppSelector(currentRoute)
  const navigateToRoute = (route: Array<RouteObject>) => {
    dispatch(changeRoute(route))
    navigate(route[1].url)
  }

  useEffect(() => {
    const urlRoute = window.location.pathname.split("/").pop()
    const matchedRoute = routesList?.find(route =>
      route?.items?.some(subRoute => subRoute.url === `/${urlRoute}`),
    )
    if (matchedRoute) {
      const subRoute = matchedRoute?.items?.find(
        subRoute => subRoute.url === `/${urlRoute}`,
      )
      dispatch(changeRoute([matchedRoute, subRoute!]))
    }
  }, [])

  return (
    <SidebarProvider>
      {routesList && (
        <AppSidebar
          data={{
            versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
            navMain: routesList,
          }}
          onSideBarItemClick={navigateToRoute}
        />
      )}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 text-foreground bg-background shadow-md border-border sticky top-0 z-40">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  {activeRoute?.[0]?.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeRoute?.[1]?.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex gap-2">
            <JobEventsCount />
            <JobsStatusCount />
            <SearchBar />
            <ThemeToggle className={"border-border"} />
            <DrawerMenuConfigurator />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 text-foreground">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
