import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Tag,
  Users,
  UserPlus,
  Loader2,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

type CategoriaRol = {
  id: string;
  rol: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type SubcategoriaRol = {
  id: string;
  categoriaRolId: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type UsuarioBasico = {
  id: string;
  nombre: string;
  email: string;
  profileImageUrl?: string;
};

const ROLES_BASE = [
  { value: "local", label: "Local Comercial" },
  { value: "policia", label: "Policía" },
  { value: "samu", label: "SAMU" },
  { value: "taxi", label: "Taxi" },
  { value: "buses", label: "Buses" },
  { value: "serenazgo", label: "Serenazgo" },
  { value: "bomberos", label: "Bomberos" },
];

const categoriaSchema = z.object({
  rol: z.string().min(1, "Rol base requerido"),
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  icono: z.string().optional(),
  orden: z.preprocess((v) => v === "" ? 0 : Number(v), z.number().min(0)),
  activo: z.boolean().default(true),
});

const subcategoriaSchema = z.object({
  categoriaRolId: z.string().min(1, "Categoría requerida"),
  nombre: z.string().min(1, "Nombre requerido"),
  descripcion: z.string().optional(),
  orden: z.preprocess((v) => v === "" ? 0 : Number(v), z.number().min(0)),
  activo: z.boolean().default(true),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;
type SubcategoriaFormData = z.infer<typeof subcategoriaSchema>;

export default function CategoriasRolSection() {
  const { toast } = useToast();
  const [rolSeleccionado, setRolSeleccionado] = useState<string>("policia");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [isCategoriaDialogOpen, setIsCategoriaDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaRol | null>(null);
  
  const [isSubcategoriaDialogOpen, setIsSubcategoriaDialogOpen] = useState(false);
  const [editingSubcategoria, setEditingSubcategoria] = useState<SubcategoriaRol | null>(null);
  const [categoriaParaSubcategoria, setCategoriaParaSubcategoria] = useState<string | null>(null);
  
  // Estados para modal de usuarios
  const [isUsuariosDialogOpen, setIsUsuariosDialogOpen] = useState(false);
  const [subcategoriaParaUsuarios, setSubcategoriaParaUsuarios] = useState<SubcategoriaRol | null>(null);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());

  const categoriaForm = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      rol: rolSeleccionado,
      nombre: "",
      descripcion: "",
      icono: "",
      orden: 0,
      activo: true,
    },
  });

  const subcategoriaForm = useForm<SubcategoriaFormData>({
    resolver: zodResolver(subcategoriaSchema),
    defaultValues: {
      categoriaRolId: "",
      nombre: "",
      descripcion: "",
      orden: 0,
      activo: true,
    },
  });

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery<CategoriaRol[]>({
    queryKey: ["/api/categorias-rol", { rol: rolSeleccionado }],
    queryFn: async () => {
      const res = await fetch(`/api/categorias-rol?rolBase=${rolSeleccionado}`);
      if (!res.ok) throw new Error("Error al cargar categorías");
      return res.json();
    },
  });

  const { data: subcategorias = [] } = useQuery<SubcategoriaRol[]>({
    queryKey: ["/api/subcategorias-rol"],
  });

  // Query para obtener todos los usuarios disponibles
  const { data: usuariosDisponibles = [], isLoading: loadingUsuarios } = useQuery<UsuarioBasico[]>({
    queryKey: ["/api/usuarios-basico"],
    queryFn: async () => {
      const res = await fetch("/api/usuarios-basico");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      return res.json();
    },
    enabled: isUsuariosDialogOpen,
  });

  // Query para obtener usuarios asignados a una subcategoría
  const { data: usuariosAsignados = [], refetch: refetchUsuariosAsignados } = useQuery<UsuarioBasico[]>({
    queryKey: ["/api/subcategorias-rol", subcategoriaParaUsuarios?.id, "usuarios"],
    queryFn: async () => {
      if (!subcategoriaParaUsuarios) return [];
      const res = await fetch(`/api/subcategorias-rol/${subcategoriaParaUsuarios.id}/usuarios`);
      if (!res.ok) throw new Error("Error al cargar usuarios asignados");
      return res.json();
    },
    enabled: !!subcategoriaParaUsuarios && isUsuariosDialogOpen,
  });

  const createCategoriaMutation = useMutation({
    mutationFn: async (data: CategoriaFormData) => {
      return await apiRequest("POST", "/api/categorias-rol", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-rol"] });
      toast({ title: "Categoría creada", description: "La categoría se creó correctamente" });
      setIsCategoriaDialogOpen(false);
      categoriaForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la categoría", variant: "destructive" });
    },
  });

  const updateCategoriaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoriaFormData> }) => {
      return await apiRequest("PATCH", `/api/categorias-rol/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-rol"] });
      toast({ title: "Categoría actualizada", description: "La categoría se actualizó correctamente" });
      setIsCategoriaDialogOpen(false);
      setEditingCategoria(null);
      categoriaForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la categoría", variant: "destructive" });
    },
  });

  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/categorias-rol/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias-rol"] });
      toast({ title: "Categoría eliminada", description: "La categoría se eliminó correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar la categoría", variant: "destructive" });
    },
  });

  const createSubcategoriaMutation = useMutation({
    mutationFn: async (data: SubcategoriaFormData) => {
      return await apiRequest("POST", "/api/subcategorias-rol", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategorias-rol"] });
      toast({ title: "Subcategoría creada", description: "La subcategoría se creó correctamente" });
      setIsSubcategoriaDialogOpen(false);
      subcategoriaForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear la subcategoría", variant: "destructive" });
    },
  });

  const updateSubcategoriaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubcategoriaFormData> }) => {
      return await apiRequest("PATCH", `/api/subcategorias-rol/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategorias-rol"] });
      toast({ title: "Subcategoría actualizada", description: "La subcategoría se actualizó correctamente" });
      setIsSubcategoriaDialogOpen(false);
      setEditingSubcategoria(null);
      subcategoriaForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar la subcategoría", variant: "destructive" });
    },
  });

  const deleteSubcategoriaMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/subcategorias-rol/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategorias-rol"] });
      toast({ title: "Subcategoría eliminada", description: "La subcategoría se eliminó correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar la subcategoría", variant: "destructive" });
    },
  });

  // Mutation para asignar usuarios a una subcategoría
  const asignarUsuariosMutation = useMutation({
    mutationFn: async ({ subcategoriaId, usuarioIds }: { subcategoriaId: string; usuarioIds: string[] }) => {
      return await apiRequest("POST", `/api/subcategorias-rol/${subcategoriaId}/usuarios`, { usuarioIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategorias-rol"] });
      refetchUsuariosAsignados();
      toast({ title: "Usuarios asignados", description: "Los usuarios fueron asignados correctamente y recibirán una notificación." });
      setIsUsuariosDialogOpen(false);
      setUsuariosSeleccionados(new Set());
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudieron asignar los usuarios", variant: "destructive" });
    },
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const openNewCategoriaDialog = () => {
    setEditingCategoria(null);
    categoriaForm.reset({
      rol: rolSeleccionado,
      nombre: "",
      descripcion: "",
      icono: "",
      orden: 0,
      activo: true,
    });
    setIsCategoriaDialogOpen(true);
  };

  const openEditCategoriaDialog = (categoria: CategoriaRol) => {
    setEditingCategoria(categoria);
    categoriaForm.reset({
      rol: categoria.rol,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
      icono: categoria.icono || "",
      orden: categoria.orden,
      activo: categoria.activo,
    });
    setIsCategoriaDialogOpen(true);
  };

  const openNewSubcategoriaDialog = (categoriaId: string) => {
    setEditingSubcategoria(null);
    setCategoriaParaSubcategoria(categoriaId);
    subcategoriaForm.reset({
      categoriaRolId: categoriaId,
      nombre: "",
      descripcion: "",
      orden: 0,
      activo: true,
    });
    setIsSubcategoriaDialogOpen(true);
  };

  const openEditSubcategoriaDialog = (subcategoria: SubcategoriaRol) => {
    setEditingSubcategoria(subcategoria);
    setCategoriaParaSubcategoria(subcategoria.categoriaRolId);
    subcategoriaForm.reset({
      categoriaRolId: subcategoria.categoriaRolId,
      nombre: subcategoria.nombre,
      descripcion: subcategoria.descripcion || "",
      orden: subcategoria.orden,
      activo: subcategoria.activo,
    });
    setIsSubcategoriaDialogOpen(true);
  };

  const handleCategoriaSubmit = (data: CategoriaFormData) => {
    if (editingCategoria) {
      updateCategoriaMutation.mutate({ id: editingCategoria.id, data });
    } else {
      createCategoriaMutation.mutate(data);
    }
  };

  const handleSubcategoriaSubmit = (data: SubcategoriaFormData) => {
    if (editingSubcategoria) {
      updateSubcategoriaMutation.mutate({ id: editingSubcategoria.id, data });
    } else {
      createSubcategoriaMutation.mutate(data);
    }
  };

  const openUsuariosDialog = (subcategoria: SubcategoriaRol) => {
    setSubcategoriaParaUsuarios(subcategoria);
    setUsuariosSeleccionados(new Set());
    setIsUsuariosDialogOpen(true);
  };

  const toggleUsuarioSeleccionado = (usuarioId: string) => {
    setUsuariosSeleccionados((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(usuarioId)) {
        newSet.delete(usuarioId);
      } else {
        newSet.add(usuarioId);
      }
      return newSet;
    });
  };

  const handleAsignarUsuarios = () => {
    if (subcategoriaParaUsuarios && usuariosSeleccionados.size > 0) {
      asignarUsuariosMutation.mutate({
        subcategoriaId: subcategoriaParaUsuarios.id,
        usuarioIds: Array.from(usuariosSeleccionados),
      });
    }
  };

  const getSubcategoriasDeCategoria = (categoriaId: string) => {
    return subcategorias.filter((s) => s.categoriaRolId === categoriaId);
  };

  const rolLabel = ROLES_BASE.find((r) => r.value === rolSeleccionado)?.label || rolSeleccionado;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Categorías de Roles
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={rolSeleccionado} onValueChange={setRolSeleccionado}>
              <SelectTrigger className="w-[180px]" data-testid="select-rol-base">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLES_BASE.map((rol) => (
                  <SelectItem key={rol.value} value={rol.value}>
                    {rol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openNewCategoriaDialog} data-testid="button-nueva-categoria">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCategorias ? (
            <div className="text-center py-8 text-muted-foreground">Cargando categorías...</div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay categorías para {rolLabel}. Crea la primera categoría.
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {categorias.map((categoria) => (
                  <Collapsible
                    key={categoria.id}
                    open={expandedCategories.has(categoria.id)}
                    onOpenChange={() => toggleCategory(categoria.id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 hover-elevate cursor-pointer">
                          <div className="flex items-center gap-2">
                            {expandedCategories.has(categoria.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <FolderOpen className="h-4 w-4 text-primary" />
                            <span className="font-medium">{categoria.nombre}</span>
                            <Badge variant={categoria.activo ? "default" : "secondary"}>
                              {categoria.activo ? "Activo" : "Inactivo"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ({getSubcategoriasDeCategoria(categoria.id).length} subcategorías)
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNewSubcategoriaDialog(categoria.id);
                              }}
                              data-testid={`button-add-subcategoria-${categoria.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCategoriaDialog(categoria);
                              }}
                              data-testid={`button-edit-categoria-${categoria.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("¿Eliminar esta categoría?")) {
                                  deleteCategoriaMutation.mutate(categoria.id);
                                }
                              }}
                              data-testid={`button-delete-categoria-${categoria.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t bg-muted/30 p-3">
                          {categoria.descripcion && (
                            <p className="text-sm text-muted-foreground mb-3">{categoria.descripcion}</p>
                          )}
                          <div className="space-y-2">
                            {getSubcategoriasDeCategoria(categoria.id).length === 0 ? (
                              <div className="text-sm text-muted-foreground italic">
                                No hay subcategorías. Haz clic en + para agregar una.
                              </div>
                            ) : (
                              getSubcategoriasDeCategoria(categoria.id).map((subcategoria) => (
                                <div
                                  key={subcategoria.id}
                                  className="flex items-center justify-between p-2 bg-background rounded-md border"
                                >
                                  <div className="flex items-center gap-2">
                                    <Tag className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{subcategoria.nombre}</span>
                                    <Badge variant={subcategoria.activo ? "outline" : "secondary"} className="text-xs">
                                      {subcategoria.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openUsuariosDialog(subcategoria)}
                                      data-testid={`button-usuarios-subcategoria-${subcategoria.id}`}
                                    >
                                      <UserPlus className="h-3 w-3 mr-1" />
                                      Usuarios
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => openEditSubcategoriaDialog(subcategoria)}
                                      data-testid={`button-edit-subcategoria-${subcategoria.id}`}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        if (confirm("¿Eliminar esta subcategoría?")) {
                                          deleteSubcategoriaMutation.mutate(subcategoria.id);
                                        }
                                      }}
                                      data-testid={`button-delete-subcategoria-${subcategoria.id}`}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCategoriaDialogOpen} onOpenChange={setIsCategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={categoriaForm.handleSubmit(handleCategoriaSubmit)}>
            <div className="space-y-4">
              <div>
                <Label>Rol Base</Label>
                <Select
                  value={categoriaForm.watch("rol")}
                  onValueChange={(v) => categoriaForm.setValue("rol", v)}
                >
                  <SelectTrigger data-testid="select-categoria-rol-base">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES_BASE.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoriaForm.formState.errors.rol && (
                  <p className="text-destructive text-sm">{categoriaForm.formState.errors.rol.message}</p>
                )}
              </div>
              <div>
                <Label>Nombre</Label>
                <Input
                  {...categoriaForm.register("nombre")}
                  placeholder="Ej: Comisaría Norte"
                  data-testid="input-categoria-nombre"
                />
                {categoriaForm.formState.errors.nombre && (
                  <p className="text-destructive text-sm">{categoriaForm.formState.errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  {...categoriaForm.register("descripcion")}
                  placeholder="Descripción de la categoría..."
                  data-testid="input-categoria-descripcion"
                />
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  {...categoriaForm.register("orden")}
                  placeholder="0"
                  data-testid="input-categoria-orden"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={categoriaForm.watch("activo")}
                  onCheckedChange={(v) => categoriaForm.setValue("activo", v)}
                  data-testid="switch-categoria-activo"
                />
                <Label>Activo</Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCategoriaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCategoriaMutation.isPending || updateCategoriaMutation.isPending}
                data-testid="button-guardar-categoria"
              >
                {editingCategoria ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubcategoriaDialogOpen} onOpenChange={setIsSubcategoriaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubcategoria ? "Editar Subcategoría" : "Nueva Subcategoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={subcategoriaForm.handleSubmit(handleSubcategoriaSubmit)}>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  {...subcategoriaForm.register("nombre")}
                  placeholder="Ej: Patrulleros, Tránsito, Motos"
                  data-testid="input-subcategoria-nombre"
                />
                {subcategoriaForm.formState.errors.nombre && (
                  <p className="text-destructive text-sm">{subcategoriaForm.formState.errors.nombre.message}</p>
                )}
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  {...subcategoriaForm.register("descripcion")}
                  placeholder="Descripción de la subcategoría..."
                  data-testid="input-subcategoria-descripcion"
                />
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  {...subcategoriaForm.register("orden")}
                  placeholder="0"
                  data-testid="input-subcategoria-orden"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={subcategoriaForm.watch("activo")}
                  onCheckedChange={(v) => subcategoriaForm.setValue("activo", v)}
                  data-testid="switch-subcategoria-activo"
                />
                <Label>Activo</Label>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsSubcategoriaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createSubcategoriaMutation.isPending || updateSubcategoriaMutation.isPending}
                data-testid="button-guardar-subcategoria"
              >
                {editingSubcategoria ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para asignar usuarios a subcategoría */}
      <Dialog open={isUsuariosDialogOpen} onOpenChange={setIsUsuariosDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Asignar Usuarios a: {subcategoriaParaUsuarios?.nombre}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Usuarios ya asignados */}
            {usuariosAsignados.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Usuarios asignados actualmente:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {usuariosAsignados.map((usuario) => (
                    <Badge key={usuario.id} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={usuario.profileImageUrl} />
                        <AvatarFallback className="text-xs">
                          {usuario.nombre?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {usuario.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de usuarios disponibles */}
            <div>
              <Label className="text-sm font-medium">
                Seleccionar usuarios para agregar ({usuariosSeleccionados.size} seleccionados):
              </Label>
              <ScrollArea className="h-[300px] mt-2 border rounded-md p-2">
                {loadingUsuarios ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : usuariosDisponibles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios disponibles
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usuariosDisponibles
                      .filter((u) => !usuariosAsignados.some((ua) => ua.id === u.id))
                      .map((usuario) => (
                        <div
                          key={usuario.id}
                          className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer border"
                          onClick={() => toggleUsuarioSeleccionado(usuario.id)}
                          data-testid={`checkbox-usuario-${usuario.id}`}
                        >
                          <Checkbox
                            checked={usuariosSeleccionados.has(usuario.id)}
                            onCheckedChange={() => toggleUsuarioSeleccionado(usuario.id)}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={usuario.profileImageUrl} />
                            <AvatarFallback>
                              {usuario.nombre?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{usuario.nombre}</div>
                            <div className="text-xs text-muted-foreground">{usuario.email}</div>
                          </div>
                          {usuariosSeleccionados.has(usuario.id) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsUsuariosDialogOpen(false);
                setUsuariosSeleccionados(new Set());
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAsignarUsuarios}
              disabled={usuariosSeleccionados.size === 0 || asignarUsuariosMutation.isPending}
              data-testid="button-confirmar-usuarios"
            >
              {asignarUsuariosMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Asignar {usuariosSeleccionados.size} Usuario(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
