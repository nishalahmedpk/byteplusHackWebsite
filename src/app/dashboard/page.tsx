"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import MapComponent from "@/components/map-component"
import ChatComponent from "@/components/chat-component"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"
import { Card } from "@/components/ui/card";
import SettingsComponent from "@/components/settings-component";



export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'all' | 'chat' | 'map' | 'set'>('all');

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  // Handler for navigation (to be passed to sidebar)
  const handleNavAction = (nav: 'all' | 'chat' | 'map' | 'set') => setView(nav);

  const getTitle = (view: 'all' | 'chat' | 'map' | 'set') => {
    switch (view) {
      case 'chat':
        return "Chatbot";
      case 'map':
        return "Map";
      case 'set':
        return "Settings";
      default:
        return "Home";
    }
  }

  if (!user) return (
    <div className="flex items-center justify-center h-screen">
      <p>Not authorized. Please login first.</p>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden">
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" user={{ name: "user", email: user.email, avatar: "#" }} onNavAction={handleNavAction} />
        <SidebarInset className="flex flex-col ">
          <SiteHeader title={getTitle(view)} />
          <div className="flex-1 overflow-hidden">
            <div className="@container/main h-full">
              <div className="h-full p-4 md:p-6">
                {/* Show both by default, or only one if selected */}
                {view === 'all' && (
                    <div className="grid grid-cols-1 gap-4 h-full @xl/main:grid-cols-2 ">
                        <Card className="@container/card flex flex-col overflow-hidden p-0">
                            <ChatComponent />
                        </Card>
                        <Card className="@container/card flex flex-col overflow-hidden p-0">
                            <MapComponent/>
                        </Card>
                    </div>
                )}
                {view === 'chat' && (
                  <div className="h-full">
                    <Card className="h-full flex flex-col overflow-hidden p-0">
                      <ChatComponent />
                    </Card>
                  </div>
                )}
                {view === 'map' && (
                  <div className="h-full">
                    <Card className="h-full flex flex-col overflow-hidden p-0">
                      <MapComponent />
                    </Card>
                  </div>
                )}
                {view === 'set' && (
                  <div className="h-full">
                    <Card className="h-full flex flex-col overflow-hidden p-0">
                      <SettingsComponent />
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
