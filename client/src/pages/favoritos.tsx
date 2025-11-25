import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, Star, Store, Package, Image, MapPin, Phone, 
  ExternalLink, Trash2, Share2
} from "lucide-react";
import { Link } from "wouter";

export default function FavoritosPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("todos");
  const { toast } = useToast();

  const { data: favoritos = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/favoritos"],
    enabled: isAuthenticated,
  });

  const quitarFavoritoMutation = useMutation({
    mutationFn: (data: { tipoContenido: string; contenidoId: string }) => 
      apiRequest("POST", "/api/interacciones", {
        tipoContenido: data.tipoContenido,
        contenidoId: data.contenidoId,
        tipoInteraccion: 'favorito'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favoritos"] });
      toast({ title: "Eliminado de favoritos" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Mis Favoritos</h2>
            <p className="text-muted-foreground mb-4">
              Inicia sesión para ver y gestionar tus favoritos
            </p>
            <Link href="/iniciar-sesion">
              <Button data-testid="button-login">Iniciar Sesión</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const favoritosLogos = favoritos.filter(f => f.tipoContenido === 'logo_servicio');
  const favoritosProductos = favoritos.filter(f => f.tipoContenido === 'producto_servicio');
  const favoritosPopups = favoritos.filter(f => f.tipoContenido === 'popup');

  const getFavoritosPorTab = () => {
    switch (activeTab) {
      case 'negocios': return favoritosLogos;
      case 'productos': return favoritosProductos;
      case 'popups': return favoritosPopups;
      default: return favoritos;
    }
  };

  const handleQuitarFavorito = (tipoContenido: string, contenidoId: string) => {
    quitarFavoritoMutation.mutate({ tipoContenido, contenidoId });
  };

  const compartirMutation = useMutation({
    mutationFn: (data: { tipoContenido: string; contenidoId: string }) => 
      apiRequest("POST", "/api/interacciones", {
        tipoContenido: data.tipoContenido,
        contenidoId: data.contenidoId,
        tipoInteraccion: 'compartir'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favoritos"] });
    },
  });

  const handleCompartir = async (item: any) => {
    const url = window.location.origin;
    const texto = `Mira ${item.detalle?.nombre || 'este contenido'} en SEG-APO`;
    
    try {
      await compartirMutation.mutateAsync({ 
        tipoContenido: item.tipoContenido, 
        contenidoId: item.contenidoId 
      });
      
      if (navigator.share) {
        try {
          await navigator.share({ title: texto, url });
          toast({ title: "Contenido compartido" });
        } catch (err) {
          console.log('Error al compartir:', err);
          toast({ title: "Compartido registrado" });
        }
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Enlace copiado al portapapeles" });
      }
    } catch (err) {
      console.error('Error al registrar compartir:', err);
      toast({ title: "Error al compartir", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6" data-testid="screen-favoritos">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <Star className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mis Favoritos</h1>
          <p className="text-muted-foreground">Contenido que has guardado</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-bold">{favoritos.length}</span>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-bold text-blue-500">{favoritosLogos.length}</span>
            <p className="text-sm text-muted-foreground">Negocios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-bold text-green-500">{favoritosProductos.length}</span>
            <p className="text-sm text-muted-foreground">Productos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl font-bold text-purple-500">{favoritosPopups.length}</span>
            <p className="text-sm text-muted-foreground">Publicaciones</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="todos" data-testid="tab-todos">
            <Star className="h-4 w-4 mr-2" />
            Todos ({favoritos.length})
          </TabsTrigger>
          <TabsTrigger value="negocios" data-testid="tab-negocios">
            <Store className="h-4 w-4 mr-2" />
            Negocios ({favoritosLogos.length})
          </TabsTrigger>
          <TabsTrigger value="productos" data-testid="tab-productos">
            <Package className="h-4 w-4 mr-2" />
            Productos ({favoritosProductos.length})
          </TabsTrigger>
          <TabsTrigger value="popups" data-testid="tab-popups">
            <Image className="h-4 w-4 mr-2" />
            Publicaciones ({favoritosPopups.length})
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando favoritos...
            </div>
          ) : getFavoritosPorTab().length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Sin favoritos</h3>
                <p className="text-muted-foreground text-sm">
                  Explora negocios y productos para agregarlos a tus favoritos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFavoritosPorTab().map((fav) => (
                <Card key={fav.id} className="hover-elevate" data-testid={`card-favorito-${fav.id}`}>
                  <CardContent className="p-4">
                    {fav.tipoContenido === 'logo_servicio' && fav.detalle && (
                      <div className="flex items-start gap-3">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                          <AvatarImage src={fav.detalle.logoUrl || ""} alt={fav.detalle.nombre} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {fav.detalle.nombre?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{fav.detalle.nombre}</h3>
                          {fav.detalle.direccion && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {fav.detalle.direccion}
                            </p>
                          )}
                          {fav.detalle.telefono && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {fav.detalle.telefono}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Heart className="h-3 w-3" /> {fav.detalle.totalLikes || 0}
                            <Star className="h-3 w-3 ml-2" /> {fav.detalle.totalFavoritos || 0}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          <Store className="h-3 w-3" />
                        </Badge>
                      </div>
                    )}

                    {fav.tipoContenido === 'producto_servicio' && fav.detalle && (
                      <div>
                        {fav.detalle.imagenUrl && (
                          <img 
                            src={fav.detalle.imagenUrl} 
                            alt={fav.detalle.nombre} 
                            className="w-full h-32 object-cover rounded mb-3" 
                          />
                        )}
                        <h3 className="font-medium truncate">{fav.detalle.nombre}</h3>
                        {fav.detalle.descripcion && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {fav.detalle.descripcion}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-primary">
                            S/. {fav.detalle.precio || "0.00"}
                          </span>
                          <Badge variant={fav.detalle.disponible ? "default" : "secondary"}>
                            {fav.detalle.disponible ? "Disponible" : "Agotado"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" /> {fav.detalle.totalLikes || 0}
                          <Star className="h-3 w-3 ml-2" /> {fav.detalle.totalFavoritos || 0}
                        </div>
                      </div>
                    )}

                    {fav.tipoContenido === 'popup' && fav.detalle && (
                      <div>
                        {fav.detalle.imagenUrl && (
                          <img 
                            src={fav.detalle.imagenUrl} 
                            alt={fav.detalle.titulo} 
                            className="w-full h-32 object-cover rounded mb-3" 
                          />
                        )}
                        <h3 className="font-medium truncate">{fav.detalle.titulo}</h3>
                        <Badge variant="outline" className="mt-1">
                          {fav.detalle.tipo || "publicidad"}
                        </Badge>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" /> {fav.detalle.totalLikes || 0}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleCompartir(fav)}
                        data-testid={`button-compartir-${fav.id}`}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Compartir
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleQuitarFavorito(fav.tipoContenido, fav.contenidoId)}
                        disabled={quitarFavoritoMutation.isPending}
                        data-testid={`button-quitar-favorito-${fav.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
