import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, UserCog, Search, Plus, Edit, Trash2, Shield, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function GestionUsuariosScreen() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["/api/usuarios"],
  });

  const filteredUsuarios = (usuarios as any[]).filter((u: any) => 
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const admins = filteredUsuarios.filter((u: any) => 
    u.rol === "super_admin" || u.rol === "admin_cartera" || u.rol === "admin_operaciones" || u.rol === "supervisor"
  );

  const regularUsers = filteredUsuarios.filter((u: any) => 
    u.rol === "usuario" || u.rol === "conductor" || u.rol === "local"
  );

  const getRolBadge = (rol: string) => {
    const colors: Record<string, string> = {
      super_admin: "bg-purple-500",
      admin_cartera: "bg-blue-500",
      admin_operaciones: "bg-green-500",
      supervisor: "bg-yellow-500",
      usuario: "bg-gray-500",
      conductor: "bg-orange-500",
      local: "bg-pink-500",
    };
    return colors[rol] || "bg-gray-500";
  };

  return (
    <div className="space-y-6" data-testid="screen-gestion-usuarios">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Gestión de Usuarios y Administradores</h2>
          <p className="text-muted-foreground">Administra usuarios, roles y permisos del sistema</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-usuarios"
          />
        </div>
        <Button data-testid="button-nuevo-usuario">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="usuarios" data-testid="tab-usuarios">
            <User className="h-4 w-4 mr-2" />
            Usuarios ({regularUsers.length})
          </TabsTrigger>
          <TabsTrigger value="administradores" data-testid="tab-administradores">
            <Shield className="h-4 w-4 mr-2" />
            Administradores ({admins.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Sistema</CardTitle>
              <CardDescription>Usuarios regulares, conductores y locales comerciales</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
              ) : regularUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay usuarios registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {regularUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{user.nombre || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRolBadge(user.rol)}>{user.rol}</Badge>
                        <Button size="icon" variant="ghost" data-testid={`button-edit-user-${user.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-delete-user-${user.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="administradores" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Administradores</CardTitle>
              <CardDescription>Super admins, admins de cartera, operaciones y supervisores</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando administradores...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay administradores configurados.
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin: any) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{admin.nombre || "Sin nombre"}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRolBadge(admin.rol)}>{admin.rol}</Badge>
                        <Button size="icon" variant="ghost" data-testid={`button-edit-admin-${admin.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
