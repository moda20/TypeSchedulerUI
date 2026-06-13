import { Inbox, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationType } from "@/models/notifications"
import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"
import useDialogueManager from "@/hooks/useDialogManager"
import { useCallback } from "react"

interface NotificationSidebarProps {
  activeView: NotificationType
  onViewChange: (view: NotificationType) => void
}

const sidebarItems = [
  {
    view: "services" as const,
    icon: Inbox,
    label: "Notification Services (⌘⌥1)",
    keyBinding: "meta+alt+1",
  },
  {
    view: "globalEventHandlers" as const,
    icon: Circle,
    label: "Global Event Handlers (⌘⌥2)",
    keyBinding: "meta+alt+2",
  },
]

export function NotificationAside({
  activeView,
  onViewChange,
}: NotificationSidebarProps) {
  // isTopOfTheStack here, will act as a tell whether a modal is open on top of the page or not
  const { isTopOfTheStack } = useDialogueManager()

  const handleNotificationButton = useCallback(
    (view: NotificationType) => {
      return () => {
        if (isTopOfTheStack) {
          onViewChange(view)
        }
      }
    },
    [onViewChange, isTopOfTheStack],
  )
  return (
    <aside className="flex flex-col h-full w-12 lg:w-16 gap-4 border-r-2 border-border bg-card  p-2 pl-0 items-center">
      {sidebarItems.map(item => (
        <ButtonWithTooltip
          tooltipContent={item.label}
          key={item.view}
          variant={activeView === item.view ? "default" : "ghost"}
          size="icon"
          onClick={handleNotificationButton(item.view)}
          className={cn(
            "relative transition-all",
            activeView === item.view && "shadow-md",
          )}
          tooltipDelay={0}
          aria-label={item.label}
          keyBinding={item.keyBinding}
          hideKeyboardShortcut={true}
          useInForm={true}
        >
          <item.icon className="h-5 w-5" />
          {activeView === item.view && (
            <span className="absolute inset-0 rounded-lg ring-2 ring-ring ring-offset-2 ring-offset-background" />
          )}
        </ButtonWithTooltip>
      ))}
    </aside>
  )
}
