"use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onNavAction,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[],
  onNavAction?: (nav: 'all' | 'chat' | 'map' | 'set') => void
}) {
  // Map nav titles to view keys
  const handleClick = (title: string) => {
    if (!onNavAction) return;
    if (title === 'Chatbot') onNavAction('chat');
    else if (title === 'Map') onNavAction('map');
    else if (title === 'Home') onNavAction('all');
    else if (title === 'Settings') onNavAction('set');
  };
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} onClick={() => handleClick(item.title)}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
