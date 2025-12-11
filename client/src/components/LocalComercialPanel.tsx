import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, Package, Plus, Edit, Trash2, Save, MapPin, Phone, Globe, 
  Instagram, Facebook, Image as ImageIcon, Loader2, UtensilsCrossed,
  CheckCircle, XCircle
} from "lucide-react";

interface DatosNegocio {
  id: string;
  usuarioId: string;
  nombreNegocio: string;
  descripcion?: string;
  logoUrl?: string;
  bannerUrl?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  horarioAtencion?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  paginaWeb?: string;
  tipoNegocio?: string;
  activo?: boolean;
  verificado?: boolean;
}

interface ItemCatalogo {
  id: string;
  negocioId: string;
  usuarioId: string;
  nombre: string;
  descripcion?: string;
  precio?: string;
  precioOferta?: string;
  imagenUrl?: string;
  categoria?: string;
  disponible?: boolean;
  destacado?: boolean;
  tipoItem?: string;
  ingredientes?: string;
  tiempoPreparacion?: string;
}

export default function LocalComercialPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("negocio");
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCatalogo | null>(null);

  const [negocioForm, setNegocioForm] = useState<Partial<DatosNegocio>>({
    nombreNegocio: "",
    descripcion: "",
    direccion: "",
    telefono: "",
    whatsapp: "",
    email: "",
    horarioAtencion: "",
    facebook: "",
    instagram: "",
    paginaWeb: "",
    tipoNegocio: "tienda",
  });

  const [itemForm, setItemForm] = useState<Partial<ItemCatalogo>>({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    tipoItem: "producto",
  });

  const { data: miNegocio, isLoading: loadingNegocio } = useQuery<DatosNegocio | null>({
    queryKey: ["/api/mi-negocio"],
  });

  const { data: miCatalogo = [], isLoading: loadingCatalogo } = useQuery<ItemCatalogo[]>({
    queryKey: ["/api/mi-catalogo"],
  });

  const guardarNegocioMutation = useMutation({
    mutationFn: (data: Partial<DatosNegocio>) => apiRequest("POST", "/api/mi-negocio", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-negocio"] });
      toast({ title: "Datos guardados correctamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    },
  });

  const guardarItemMutation = useMutation({
    mutationFn: (data: Partial<ItemCatalogo>) => {
      if (editingItem) {
        return apiRequest("PATCH", `/api/mi-catalogo/${editingItem.id}`, data);
      }
      return apiRequest("POST", "/api/mi-catalogo", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo"] });
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({ nombre: "", descripcion: "", precio: "", categoria: "", tipoItem: "producto" });
      toast({ title: editingItem ? "Item actualizado" : "Item agregado al catálogo" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const eliminarItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/mi-catalogo/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mi-catalogo"] });
      toast({ title: "Item eliminado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleGuardarNegocio = () => {
    if (!negocioForm.nombreNegocio?.trim()) {
      toast({ title: "El nombre del negocio es requerido", variant: "destructive" });
      return;
    }
    guardarNegocioMutation.mutate(negocioForm);
  };

  const handleAgregarItem = () => {
    setEditingItem(null);
    setItemForm({ nombre: "", descripcion: "", precio: "", categoria: "", tipoItem: "producto" });
    setShowItemModal(true);
  };

  const handleEditarItem = (item: ItemCatalogo) => {
    setEditingItem(item);
    setItemForm({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      precio: item.precio || "",
      categoria: item.categoria || "",
      tipoItem: item.tipoItem || "producto",
      ingredientes: item.ingredientes || "",
      tiempoPreparacion: item.tiempoPreparacion || "",
    });
    setShowItemModal(true);
  };

  const handleGuardarItem = () => {
    if (!itemForm.nombre?.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" });
      return;
    }
    guardarItemMutation.mutate(itemForm);
  };

  if (loadingNegocio) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (miNegocio && !negocioForm.nombreNegocio) {
    setNegocioForm({
      nombreNegocio: miNegocio.nombreNegocio || "",
      descripcion: miNegocio.descripcion || "",
      direccion: miNegocio.direccion || "",
      telefono: miNegocio.telefono || "",
      whatsapp: miNegocio.whatsapp || "",
      email: miNegocio.email || "",
      horarioAtencion: miNegocio.horarioAtencion || "",
      facebook: miNegocio.facebook || "",
      instagram: miNegocio.instagram || "",
      paginaWeb: miNegocio.paginaWeb || "",
      tipoNegocio: miNegocio.tipoNegocio || "tienda",
    });
  }

  return (
    <Card data-testid="panel-local-comercial">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Mi Negocio
        </CardTitle>
        <CardDescription>
          Gestiona los datos de tu negocio, catálogo de productos y menú
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="negocio" data-testid="tab-datos-negocio">
              <Store className="h-4 w-4 mr-2" />
              Datos del Negocio
            </TabsTrigger>
            <TabsTrigger value="catalogo" data-testid="tab-catalogo">
              <Package className="h-4 w-4 mr-2" />
              Catálogo / Menú
            </TabsTrigger>
          </TabsList>

          <TabsContent value="negocio" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreNegocio">Nombre del Negocio *</Label>
                <Input
                  id="nombreNegocio"
                  value={negocioForm.nombreNegocio || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, nombreNegocio: e.target.value })}
                  placeholder="Nombre de tu negocio"
                  data-testid="input-nombre-negocio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoNegocio">Tipo de Negocio</Label>
                <Select
                  value={negocioForm.tipoNegocio || "tienda"}
                  onValueChange={(value) => setNegocioForm({ ...negocioForm, tipoNegocio: value })}
                >
                  <SelectTrigger data-testid="select-tipo-negocio">
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurante">Restaurante</SelectItem>
                    <SelectItem value="tienda">Tienda</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                    <SelectItem value="cafe">Cafetería</SelectItem>
                    <SelectItem value="farmacia">Farmacia</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={negocioForm.descripcion || ""}
                onChange={(e) => setNegocioForm({ ...negocioForm, descripcion: e.target.value })}
                placeholder="Describe tu negocio..."
                className="min-h-[100px]"
                data-testid="input-descripcion-negocio"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direccion" className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Dirección
                </Label>
                <Input
                  id="direccion"
                  value={negocioForm.direccion || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, direccion: e.target.value })}
                  placeholder="Av. Principal 123"
                  data-testid="input-direccion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={negocioForm.telefono || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, telefono: e.target.value })}
                  placeholder="+51 999 999 999"
                  data-testid="input-telefono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={negocioForm.whatsapp || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, whatsapp: e.target.value })}
                  placeholder="+51 999 999 999"
                  data-testid="input-whatsapp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={negocioForm.email || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, email: e.target.value })}
                  placeholder="contacto@minegocio.com"
                  data-testid="input-email-negocio"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">Horario de Atención</Label>
              <Input
                id="horario"
                value={negocioForm.horarioAtencion || ""}
                onChange={(e) => setNegocioForm({ ...negocioForm, horarioAtencion: e.target.value })}
                placeholder="Lun-Vie: 9:00 - 18:00, Sáb: 9:00 - 13:00"
                data-testid="input-horario"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-1">
                  <Facebook className="h-4 w-4" /> Facebook
                </Label>
                <Input
                  id="facebook"
                  value={negocioForm.facebook || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, facebook: e.target.value })}
                  placeholder="facebook.com/minegocio"
                  data-testid="input-facebook"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-1">
                  <Instagram className="h-4 w-4" /> Instagram
                </Label>
                <Input
                  id="instagram"
                  value={negocioForm.instagram || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, instagram: e.target.value })}
                  placeholder="@minegocio"
                  data-testid="input-instagram"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paginaWeb" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" /> Página Web
                </Label>
                <Input
                  id="paginaWeb"
                  value={negocioForm.paginaWeb || ""}
                  onChange={(e) => setNegocioForm({ ...negocioForm, paginaWeb: e.target.value })}
                  placeholder="www.minegocio.com"
                  data-testid="input-pagina-web"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleGuardarNegocio} 
                disabled={guardarNegocioMutation.isPending}
                data-testid="button-guardar-negocio"
              >
                {guardarNegocioMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Datos
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="catalogo" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                {negocioForm.tipoNegocio === "restaurante" ? "Menú" : "Catálogo de Productos"}
              </h3>
              <Button onClick={handleAgregarItem} size="sm" data-testid="button-agregar-item">
                <Plus className="h-4 w-4 mr-2" />
                Agregar {negocioForm.tipoNegocio === "restaurante" ? "Plato" : "Producto"}
              </Button>
            </div>

            {!miNegocio ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Primero debes configurar los datos de tu negocio
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("negocio")}
                  >
                    Ir a Datos del Negocio
                  </Button>
                </CardContent>
              </Card>
            ) : loadingCatalogo ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : miCatalogo.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aún no tienes productos en tu catálogo
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {miCatalogo.map((item) => (
                  <Card key={item.id} className="hover-elevate" data-testid={`card-item-${item.id}`}>
                    <CardContent className="p-4">
                      {item.imagenUrl && (
                        <img 
                          src={item.imagenUrl} 
                          alt={item.nombre}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.nombre}</h4>
                          {item.descripcion && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                        <Badge variant={item.disponible ? "default" : "secondary"}>
                          {item.disponible ? "Disponible" : "Agotado"}
                        </Badge>
                      </div>
                      {item.precio && (
                        <p className="text-lg font-bold text-primary mt-2">
                          S/ {item.precio}
                        </p>
                      )}
                      {item.categoria && (
                        <Badge variant="outline" className="mt-2">
                          {item.categoria}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleEditarItem(item)}
                          data-testid={`button-editar-item-${item.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => eliminarItemMutation.mutate(item.id)}
                          data-testid={`button-eliminar-item-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar" : "Agregar"} {negocioForm.tipoNegocio === "restaurante" ? "Plato" : "Producto"}
              </DialogTitle>
              <DialogDescription>
                Completa los datos del item para tu catálogo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemNombre">Nombre *</Label>
                <Input
                  id="itemNombre"
                  value={itemForm.nombre || ""}
                  onChange={(e) => setItemForm({ ...itemForm, nombre: e.target.value })}
                  placeholder="Nombre del producto/plato"
                  data-testid="input-item-nombre"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemDescripcion">Descripción</Label>
                <Textarea
                  id="itemDescripcion"
                  value={itemForm.descripcion || ""}
                  onChange={(e) => setItemForm({ ...itemForm, descripcion: e.target.value })}
                  placeholder="Descripción del item..."
                  data-testid="input-item-descripcion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="itemPrecio">Precio (S/)</Label>
                  <Input
                    id="itemPrecio"
                    type="number"
                    step="0.01"
                    value={itemForm.precio || ""}
                    onChange={(e) => setItemForm({ ...itemForm, precio: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-item-precio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="itemCategoria">Categoría</Label>
                  <Input
                    id="itemCategoria"
                    value={itemForm.categoria || ""}
                    onChange={(e) => setItemForm({ ...itemForm, categoria: e.target.value })}
                    placeholder="Ej: Bebidas, Entradas"
                    data-testid="input-item-categoria"
                  />
                </div>
              </div>

              {negocioForm.tipoNegocio === "restaurante" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="itemIngredientes">Ingredientes</Label>
                    <Textarea
                      id="itemIngredientes"
                      value={itemForm.ingredientes || ""}
                      onChange={(e) => setItemForm({ ...itemForm, ingredientes: e.target.value })}
                      placeholder="Lista de ingredientes..."
                      data-testid="input-item-ingredientes"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="itemTiempo">Tiempo de Preparación</Label>
                    <Input
                      id="itemTiempo"
                      value={itemForm.tiempoPreparacion || ""}
                      onChange={(e) => setItemForm({ ...itemForm, tiempoPreparacion: e.target.value })}
                      placeholder="Ej: 15-20 min"
                      data-testid="input-item-tiempo"
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGuardarItem}
                disabled={guardarItemMutation.isPending}
                data-testid="button-guardar-item"
              >
                {guardarItemMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}