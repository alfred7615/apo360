import { useState } from "react";
import { Store, Phone, MapPin, Clock, ChevronLeft, FolderOpen, Heart, Star, Share2, MessageCircle, ShoppingBag, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SiWhatsapp } from "react-icons/si";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CategoriaServicio, LogoServicio, ProductoServicio } from "@shared/schema";

interface SubcategoriaServicio {
  id: string;
  categoriaId: string;
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  icono?: string | null;
  orden?: number | null;
  estado?: string | null;
}

type ViewMode = "categorias" | "subcategorias" | "logos" | "detalle";

interface ViewState {
  mode: ViewMode;
  selectedCategoria?: CategoriaServicio;
  selectedSubcategoria?: SubcategoriaServicio;
  selectedLogo?: LogoServicio;
}

export default function GaleriaServiciosLocales() {
  const [viewState, setViewState] = useState<ViewState>({ mode: "categorias" });
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: categorias = [], isLoading: loadingCategorias } = useQuery<CategoriaServicio[]>({
    queryKey: ["/api/categorias-servicio"],
  });

  const { data: subcategorias = [] } = useQuery<SubcategoriaServicio[]>({
    queryKey: ["/api/subcategorias-servicio"],
  });

  const { data: logos = [] } = useQuery<LogoServicio[]>({
    queryKey: ["/api/logos-servicio"],
  });

  const selectedLogoId = viewState.selectedLogo?.id;
  const { data: productos = [] } = useQuery<ProductoServicio[]>({
    queryKey: ["/api/logos-servicio", selectedLogoId, "productos"],
    queryFn: async () => {
      if (!selectedLogoId) return [];
      const res = await apiRequest("GET", `/api/logos-servicio/${selectedLogoId}/productos`);
      return res.json();
    },
    enabled: !!selectedLogoId,
  });

  const likeMutation = useMutation({
    mutationFn: async (logoId: string) => {
      const res = await apiRequest("POST", `/api/logos-servicio/${logoId}/like`);
      return res.json();
    },
    onSuccess: (data: { totalLikes: number }, logoId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio"] });
      if (viewState.selectedLogo && viewState.selectedLogo.id === logoId) {
        setViewState({
          ...viewState,
          selectedLogo: {
            ...viewState.selectedLogo,
            totalLikes: data.totalLikes
          }
        });
      }
      toast({ title: "Me gusta", description: "Has dado me gusta a este negocio" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo registrar tu me gusta", variant: "destructive" });
    }
  });

  const favoritoMutation = useMutation({
    mutationFn: async (logoId: string) => {
      const res = await apiRequest("POST", `/api/logos-servicio/${logoId}/favorito`);
      return res.json();
    },
    onSuccess: (data: { totalFavoritos: number }, logoId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/logos-servicio"] });
      if (viewState.selectedLogo && viewState.selectedLogo.id === logoId) {
        setViewState({
          ...viewState,
          selectedLogo: {
            ...viewState.selectedLogo,
            totalFavoritos: data.totalFavoritos
          }
        });
      }
      toast({ title: "Favorito", description: "Has agregado este negocio a tus favoritos" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo agregar a favoritos", variant: "destructive" });
    }
  });

  const categoriasActivas = categorias.filter(c => c.estado === "activo");

  const subcategoriasDeCategoria = (categoriaId: string) => 
    subcategorias.filter(s => s.categoriaId === categoriaId && s.estado === "activo");

  const logosDeSubcategoria = (subcategoriaId: string) => 
    logos.filter(l => (l as any).subcategoriaId === subcategoriaId && l.estado === "activo");

  const logosDeCategoria = (categoriaId: string) => 
    logos.filter(l => l.categoriaId === categoriaId && l.estado === "activo");

  const handleSelectCategoria = (cat: CategoriaServicio) => {
    const subs = subcategoriasDeCategoria(cat.id);
    if (subs.length > 0) {
      setViewState({ mode: "subcategorias", selectedCategoria: cat });
    } else {
      setViewState({ mode: "logos", selectedCategoria: cat });
    }
  };

  const handleSelectSubcategoria = (sub: SubcategoriaServicio) => {
    setViewState({ ...viewState, mode: "logos", selectedSubcategoria: sub });
  };

  const handleSelectLogo = (logo: LogoServicio) => {
    setViewState({ ...viewState, selectedLogo: logo });
    setShowDetalleModal(true);
  };

  const handleBack = () => {
    if (viewState.mode === "logos") {
      if (viewState.selectedSubcategoria) {
        setViewState({ mode: "subcategorias", selectedCategoria: viewState.selectedCategoria });
      } else {
        setViewState({ mode: "categorias" });
      }
    } else if (viewState.mode === "subcategorias") {
      setViewState({ mode: "categorias" });
    }
  };

  const currentLogos = viewState.selectedSubcategoria 
    ? logosDeSubcategoria(viewState.selectedSubcategoria.id)
    : viewState.selectedCategoria 
      ? logosDeCategoria(viewState.selectedCategoria.id)
      : [];

  if (loadingCategorias) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {[...Array(7)].map((_, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-14 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 bg-gradient-to-b from-background to-muted/30" data-testid="section-servicios-locales">
        <div className="container mx-auto px-4">
          {viewState.mode === "categorias" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-1">Servicios Locales</h2>
                <p className="text-sm text-muted-foreground">
                  Encuentra comercios y negocios cerca de ti
                </p>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-6 pb-4 justify-center">
                  {categoriasActivas.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategoria(cat)}
                      className="flex flex-col items-center gap-2 group min-w-[70px]"
                      data-testid={`button-categoria-${cat.id}`}
                    >
                      <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary transition-all group-hover:scale-110">
                        <AvatarImage src={cat.imagenUrl || ""} alt={cat.nombre} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-primary font-bold">
                          {cat.nombre.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-center max-w-[70px] truncate">
                        {cat.nombre}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {logosDeCategoria(cat.id).length}
                      </Badge>
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </>
          )}

          {viewState.mode === "subcategorias" && viewState.selectedCategoria && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Button size="icon" variant="ghost" onClick={handleBack} data-testid="button-back">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold">{viewState.selectedCategoria.nombre}</h2>
                  <p className="text-sm text-muted-foreground">Selecciona una subcategoria</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {subcategoriasDeCategoria(viewState.selectedCategoria.id).map((sub) => (
                  <Card 
                    key={sub.id} 
                    className="hover-elevate cursor-pointer"
                    onClick={() => handleSelectSubcategoria(sub)}
                    data-testid={`card-subcategoria-${sub.id}`}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
                        <FolderOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm">{sub.nombre}</h3>
                      <span className="text-xs text-muted-foreground mt-1">
                        {logosDeSubcategoria(sub.id).length} negocio(s)
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {viewState.mode === "logos" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Button size="icon" variant="ghost" onClick={handleBack} data-testid="button-back-logos">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold">
                    {viewState.selectedSubcategoria?.nombre || viewState.selectedCategoria?.nombre}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentLogos.length} negocio(s) disponible(s)
                  </p>
                </div>
              </div>
              {currentLogos.length === 0 ? (
                <div className="text-center py-12">
                  <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay negocios en esta categoria</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {currentLogos.map((logo) => (
                    <Card 
                      key={logo.id} 
                      className="hover-elevate cursor-pointer"
                      onClick={() => handleSelectLogo(logo)}
                      data-testid={`card-logo-${logo.id}`}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <div className="relative">
                          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                            <AvatarImage src={logo.logoUrl || ""} alt={logo.nombre} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-primary text-lg font-bold">
                              {logo.nombre.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {logo.verificado && (
                            <CheckCircle className="absolute bottom-0 right-0 h-5 w-5 text-green-500 bg-white rounded-full" />
                          )}
                        </div>
                        <h3 className="font-medium text-sm mt-2 truncate w-full">{logo.nombre}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-0.5">
                            <Heart className="h-3 w-3" /> {logo.totalLikes || 0}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3" /> {logo.totalFavoritos || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={showDetalleModal} onOpenChange={setShowDetalleModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-detalle-negocio">
          {viewState.selectedLogo && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                      <AvatarImage src={viewState.selectedLogo.logoUrl || ""} alt={viewState.selectedLogo.nombre} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-primary text-xl font-bold">
                        {viewState.selectedLogo.nombre.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {viewState.selectedLogo.verificado && (
                      <CheckCircle className="absolute bottom-0 right-0 h-6 w-6 text-green-500 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl" data-testid="text-negocio-nombre">
                      {viewState.selectedLogo.nombre}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {viewState.selectedLogo.descripcion}
                    </DialogDescription>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (!user) {
                            toast({ title: "Inicia sesion", description: "Debes iniciar sesion para dar me gusta", variant: "destructive" });
                            return;
                          }
                          likeMutation.mutate(viewState.selectedLogo!.id);
                        }}
                        data-testid="button-like"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        {viewState.selectedLogo.totalLikes || 0}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (!user) {
                            toast({ title: "Inicia sesion", description: "Debes iniciar sesion para agregar a favoritos", variant: "destructive" });
                            return;
                          }
                          favoritoMutation.mutate(viewState.selectedLogo!.id);
                        }}
                        data-testid="button-favorito"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        {viewState.selectedLogo.totalFavoritos || 0}
                      </Button>
                      <Button size="sm" variant="ghost" data-testid="button-compartir">
                        <Share2 className="h-4 w-4 mr-1" />
                        Compartir
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Informacion</TabsTrigger>
                  <TabsTrigger value="productos">
                    Productos ({productos.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  {viewState.selectedLogo.direccion && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Direccion</p>
                        <p className="text-sm text-muted-foreground">{viewState.selectedLogo.direccion}</p>
                      </div>
                    </div>
                  )}

                  {viewState.selectedLogo.telefono && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Telefono</p>
                        <a href={`tel:${viewState.selectedLogo.telefono}`} className="text-sm text-primary hover:underline">
                          {viewState.selectedLogo.telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {viewState.selectedLogo.horario && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Horario</p>
                        <p className="text-sm text-muted-foreground">{viewState.selectedLogo.horario}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {viewState.selectedLogo.whatsapp && (
                      <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                        <a href={`https://wa.me/${viewState.selectedLogo.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <SiWhatsapp className="h-4 w-4 mr-2" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    {viewState.selectedLogo.telefono && (
                      <Button variant="outline" asChild className="flex-1">
                        <a href={`tel:${viewState.selectedLogo.telefono}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Llamar
                        </a>
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="productos" className="mt-4">
                  {productos.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Este negocio aun no tiene productos</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {productos.filter(p => p.disponible).map((producto) => (
                        <Card key={producto.id} className="p-3" data-testid={`card-producto-${producto.id}`}>
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{producto.nombre}</p>
                              {producto.descripcion && (
                                <p className="text-xs text-muted-foreground mt-1">{producto.descripcion}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-primary">
                                S/ {Number(producto.precio).toFixed(2)}
                              </p>
                              {producto.precioOferta && Number(producto.precioOferta) > 0 && (
                                <p className="text-xs text-muted-foreground line-through">
                                  S/ {Number(producto.precioOferta).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
