import { ButtonWithTooltip } from "@/components/custom/general/ButtonWithTooltip"
import useDialogueManager from "@/hooks/useDialogManager"
import { Bell, FileText, Plus, Settings } from "lucide-react"
import { useCallback } from "react"
import { cn } from "@/lib/utils"
import { ConfigViewType } from "@/models/configs"

interface ConfigAsideProps {
  activeView: ConfigViewType
  onViewChange: (view: ConfigViewType) => void
}

const sidebarItems = [
  {
    view: "system" as const,
    icon: Settings,
    label: "System (⌘⌥1)",
    keyBinding: "meta+alt+1",
  },
  {
    view: "logging" as const,
    icon: FileText,
    label: "Logging (⌘⌥2)",
    keyBinding: "meta+alt+2",
  },
  {
    view: "notifications" as const,
    icon: Bell,
    label: "Notifications (⌘⌥3)",
    keyBinding: "meta+alt+3",
  },
  {
    view: "custom" as const,
    icon: Plus,
    label: "Custom (⌘⌥4)",
    keyBinding: "meta+alt+4",
  },
]

export function ConfigAside({ activeView, onViewChange }: ConfigAsideProps) {
  const { isTopOfTheStack } = useDialogueManager()

  const handleConfigButton = useCallback(
    (view: ConfigViewType) => {
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
          onClick={handleConfigButton(item.view)}
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
