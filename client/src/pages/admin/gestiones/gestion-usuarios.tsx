import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Users, UserCog, Search, Plus, Edit, Trash2, Shield, User, 
  Star, MoreVertical, Ban, AlertTriangle, Eye, Check, 
  Car, Store, Filter, RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { UsuarioEditModal } from "@/components/admin/usuario-edit-modal";
import { UsuarioDetailDrawer } from "@/components/admin/usuario-detail-drawer";
import type { Usuario } from "@shared/schema";

const FILTROS_ROL = [
  { value: "todos", label: "Todos los roles" },
  { value: "usuario", label: "Usuarios" },
  { value: "conductor", label: "Conductores" },
  { value: "local", label: "Locales comerciales" },
  { value: "serenazgo", label: "Serenazgo" },
  { value: "policia", label: "Policía" },
  { value: "bombero", label: "Bomberos" },
  { value: "samu", label: "SAMU" },
  { value: "supervisor", label: "Supervisores" },
  { value: "admin_operaciones", label: "Admins Operaciones" },
  { value: "admin_cartera", label: "Admins Cartera" },
  { value: "super_admin", label: "Super Admins" },
];

const FILTROS_ESTADO = [
  { value: "todos", label: "Todos los estados" },
  { value: "activo", label: "Activos" },
  { value: "suspendido", label: "Suspendidos" },
  { value: "bloqueado", label: "Bloqueados" },
];

const calcularNivelUsuario = (usuario: any): number => {
  let nivel = 1;
  
  if (usuario.firstName && usuario.lastName && usuario.telefono && usuario.dni) {
    nivel = 2;
  }
  if (nivel >= 2 && usuario.pais && usuario.departamento && usuario.distrito) {
    nivel = 3;
  }
  if (nivel >= 3 && usuario.direccion && usuario.gpsLatitud && usuario.gpsLongitud) {
    nivel = 4;
  }
  if (nivel >= 4 && usuario.nombreLocal && usuario.ruc) {
    nivel = 5;
  }
  
  return nivel;
};

const renderEstrellas = (nivel: number) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${n <= nivel ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

export default function GestionUsuariosScreen() {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: usuarios = [], isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ["/api/usuarios"],
  });

  const filteredUsuarios = (usuarios as Usuario[]).filter((u) => {
    const matchSearch = 
      (u.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.telefono || "").includes(searchTerm) ||
      (u.dni || "").includes(searchTerm);
    
    const matchRol = filtroRol === "todos" || u.rol === filtroRol;
    const matchEstado = filtroEstado === "todos" || u.estado === filtroEstado;
    
    return matchSearch && matchRol && matchEstado;
  });

  const admins = filteredUsuarios.filter((u) => 
    u.rol === "super_admin" || u.rol === "admin_cartera" || u.rol === "admin_operaciones" || 
    u.rol === "supervisor" || u.rol === "admin_publicidad" || u.rol === "admin_radio"
  );

  const regularUsers = filteredUsuarios.filter((u) => 
    u.rol === "usuario" || u.rol === "conductor" || u.rol === "local" ||
    u.rol === "serenazgo" || u.rol === "policia" || u.rol === "bombero" || u.rol === "samu"
  );

  const getRolBadge = (rol: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      super_admin: { color: "bg-purple-500", icon: Shield },
      admin_cartera: { color: "bg-blue-500", icon: Shield },
      admin_operaciones: { color: "bg-green-500", icon: Shield },
      admin_publicidad: { color: "bg-pink-500", icon: Shield },
      admin_radio: { color: "bg-indigo-500", icon: Shield },
      supervisor: { color: "bg-yellow-500", icon: UserCog },
      usuario: { color: "bg-gray-500", icon: User },
      conductor: { color: "bg-orange-500", icon: Car },
      local: { color: "bg-pink-500", icon: Store },
      serenazgo: { color: "bg-blue-600", icon: Shield },
      policia: { color: "bg-blue-700", icon: Shield },
      bombero: { color: "bg-red-500", icon: Shield },
      samu: { color: "bg-red-600", icon: Shield },
    };
    return config[rol] || { color: "bg-gray-500", icon: User };
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "activo":
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Activo</Badge>;
      case "suspendido":
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Suspendido</Badge>;
      case "bloqueado":
        return <Badge className="bg-red-500"><Ban className="h-3 w-3 mr-1" />Bloqueado</Badge>;
      default:
        return <Badge className="bg-gray-500">{estado || "activo"}</Badge>;
    }
  };

  const handleEditUser = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalOpen(true);
  };

  const handleViewUser = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setDrawerOpen(true);
  };

  const renderUserCard = (user: Usuario, isAdmin = false) => {
    const rolConfig = getRolBadge(user.rol);
    const RolIcon = rolConfig.icon;
    const nivelUsuario = calcularNivelUsuario(user);
    const nombreCompleto = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sin nombre";
    const iniciales = nombreCompleto.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div 
        key={user.id} 
        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
        data-testid={`card-usuario-${user.id}`}
      >
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.profileImageUrl || undefined} alt={nombreCompleto} />
            <AvatarFallback className={isAdmin ? "bg-primary/10 text-primary" : "bg-muted"}>
              {iniciales || <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">{nombreCompleto}</p>
              {renderEstrellas(nivelUsuario)}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {user.telefono && <span>{user.telefono}</span>}
              {user.dni && <span>DNI: {user.dni}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-1">
            <Badge className={rolConfig.color}>
              <RolIcon className="h-3 w-3 mr-1" />
              {user.rol}
            </Badge>
            {getEstadoBadge(user.estado || "activo")}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid={`button-menu-user-${user.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleEditUser(user)}
                data-testid={`menu-editar-${user.id}`}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Usuario
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleViewUser(user)}
                data-testid={`menu-ver-${user.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.estado !== "suspendido" && (
                <DropdownMenuItem 
                  className="text-yellow-600"
                  onClick={() => handleEditUser(user)}
                  data-testid={`menu-suspender-${user.id}`}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Suspender
                </DropdownMenuItem>
              )}
              {user.estado !== "bloqueado" && (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleEditUser(user)}
                  data-testid={`menu-bloquear-${user.id}`}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Bloquear
                </DropdownMenuItem>
              )}
              {(user.estado === "suspendido" || user.estado === "bloqueado") && (
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => handleEditUser(user)}
                  data-testid={`menu-activar-${user.id}`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Reactivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  const estadisticas = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.estado === "activo" || !u.estado).length,
    suspendidos: usuarios.filter(u => u.estado === "suspendido").length,
    bloqueados: usuarios.filter(u => u.estado === "bloqueado").length,
    conductores: usuarios.filter(u => u.rol === "conductor" || u.modoTaxi === "conductor").length,
    locales: usuarios.filter(u => u.rol === "local").length,
    admins: usuarios.filter(u => u.rol?.includes("admin") || u.rol === "super_admin").length,
  };

  return (
    <div className="space-y-6" data-testid="screen-gestion-usuarios">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gestión de Usuarios y Administradores</h2>
            <p className="text-muted-foreground">Administra usuarios, roles, niveles y permisos del sistema</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => refetch()}
          data-testid="button-refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{estadisticas.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
          <div className="text-sm text-muted-foreground">Activos</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{estadisticas.suspendidos}</div>
          <div className="text-sm text-muted-foreground">Suspendidos</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{estadisticas.bloqueados}</div>
          <div className="text-sm text-muted-foreground">Bloqueados</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{estadisticas.conductores}</div>
          <div className="text-sm text-muted-foreground">Conductores</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-pink-600">{estadisticas.locales}</div>
          <div className="text-sm text-muted-foreground">Locales</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">{estadisticas.admins}</div>
          <div className="text-sm text-muted-foreground">Admins</div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, teléfono o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-usuarios"
          />
        </div>
        
        <Select value={filtroRol} onValueChange={setFiltroRol}>
          <SelectTrigger className="w-[180px]" data-testid="select-filtro-rol">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            {FILTROS_ROL.map((filtro) => (
              <SelectItem key={filtro.value} value={filtro.value}>
                {filtro.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]" data-testid="select-filtro-estado">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            {FILTROS_ESTADO.map((filtro) => (
              <SelectItem key={filtro.value} value={filtro.value}>
                {filtro.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
              <CardDescription>
                Usuarios regulares, conductores, locales comerciales y personal de emergencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
              ) : regularUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || filtroRol !== "todos" || filtroEstado !== "todos" 
                    ? "No se encontraron usuarios con los filtros aplicados."
                    : "No hay usuarios registrados."}
                </div>
              ) : (
                <div className="space-y-3">
                  {regularUsers.map((user) => renderUserCard(user))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="administradores" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Administradores</CardTitle>
              <CardDescription>Super admins, admins de cartera, operaciones, publicidad, radio y supervisores</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando administradores...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || filtroRol !== "todos" || filtroEstado !== "todos" 
                    ? "No se encontraron administradores con los filtros aplicados."
                    : "No hay administradores configurados."}
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => renderUserCard(admin, true))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UsuarioEditModal
        usuario={usuarioSeleccionado}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setUsuarioSeleccionado(null);
        }}
      />

      <UsuarioDetailDrawer
        usuario={usuarioSeleccionado}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setUsuarioSeleccionado(null);
        }}
      />
    </div>
  );
}
