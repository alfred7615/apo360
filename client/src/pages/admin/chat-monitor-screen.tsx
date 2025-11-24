import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function ChatMonitorScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Chat Monitor</h2>
        <p className="text-muted-foreground">
          Monitoreo y gestión de conversaciones en tiempo real
        </p>
      </div>

      <Card data-testid="card-chat-monitor">
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <CardTitle>Monitor de Chat</CardTitle>
              <CardDescription>Visualiza y gestiona todas las conversaciones activas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Pantalla en desarrollo - Chat Monitor
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
