import { useState } from "react";
import { Send, Facebook, Twitter, Instagram, Youtube, MapPin, Mail, Phone, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PiePagina() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const { toast } = useToast();

  const sugerenciaMutation = useMutation({
    mutationFn: async (datos: any) => {
      return await apiRequest("POST", "/api/sugerencias", datos);
    },
    onSuccess: () => {
      toast({
        title: "✓ Sugerencia Enviada",
        description: "Gracias por tu mensaje. Te responderemos pronto.",
        className: "bg-success text-success-foreground",
      });
      setNombre("");
      setEmail("");
      setMensaje("");
    },
    onError: () => {
      toast({
        title: "Error al enviar",
        description: "No se pudo enviar tu sugerencia. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const enviarSugerencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email || !mensaje) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos del formulario.",
        variant: "destructive",
      });
      return;
    }
    sugerenciaMutation.mutate({ nombre, email, mensaje });
  };

  const redesSociales = [
    { nombre: "Facebook", icono: Facebook, url: "https://facebook.com", color: "hover:text-blue-600" },
    { nombre: "Twitter", icono: Twitter, url: "https://twitter.com", color: "hover:text-sky-500" },
    { nombre: "Instagram", icono: Instagram, url: "https://instagram.com", color: "hover:text-pink-600" },
    { nombre: "YouTube", icono: Youtube, url: "https://youtube.com", color: "hover:text-red-600" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-16" data-testid="footer-main">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Sección: Sobre APO-360 */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z"/>
                </svg>
              </div>
              Sobre APO-360
            </h3>
            <p className="text-sm text-gray-300" data-testid="text-footer-description">
              Sistema integral de seguridad comunitaria que conecta a vecinos, servicios de emergencia y comercios locales para crear comunidades más seguras y conectadas.
            </p>
            <div className="pt-2">
              <p className="text-xs text-gray-400">
                <MapPin className="inline h-3 w-3 mr-1" />
                Tacna, Perú
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <Phone className="inline h-3 w-3 mr-1" />
                +51 952 123 456
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <Mail className="inline h-3 w-3 mr-1" />
                contacto@apo360.net
              </p>
            </div>
          </div>

          {/* Sección: Enlaces Rápidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Enlaces Rápidos</h3>
            <nav className="flex flex-col gap-2">
              <a href="/" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2 hover-elevate rounded px-2 py-1" data-testid="link-footer-home">
                <Home className="h-4 w-4" />
                Inicio
              </a>
              <a href="/servicios" className="text-sm text-gray-300 hover:text-white transition-colors hover-elevate rounded px-2 py-1" data-testid="link-footer-services">
                Servicios
              </a>
              <a href="/taxi" className="text-sm text-gray-300 hover:text-white transition-colors hover-elevate rounded px-2 py-1" data-testid="link-footer-taxi">
                Taxi
              </a>
              <a href="/chat" className="text-sm text-gray-300 hover:text-white transition-colors hover-elevate rounded px-2 py-1" data-testid="link-footer-chat">
                Chat Comunitario
              </a>
            </nav>
          </div>

          {/* Sección: Formulario de Sugerencias */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Sugerencias</h3>
            <form onSubmit={enviarSugerencia} className="space-y-3">
              <Input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                data-testid="input-suggestion-name"
              />
              <Input
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                data-testid="input-suggestion-email"
              />
              <Textarea
                placeholder="Tu mensaje o sugerencia"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                data-testid="input-suggestion-message"
              />
              <Button
                type="submit"
                variant="default"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={sugerenciaMutation.isPending}
                data-testid="button-send-suggestion"
              >
                <Send className="mr-2 h-4 w-4" />
                {sugerenciaMutation.isPending ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </div>

          {/* Sección: Síguenos */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Síguenos</h3>
            <div className="flex gap-3">
              {redesSociales.map((red) => {
                const IconoRed = red.icono;
                return (
                  <a
                    key={red.nombre}
                    href={red.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-white/20 hover:scale-110 ${red.color}`}
                    data-testid={`link-social-${red.nombre.toLowerCase()}`}
                    aria-label={red.nombre}
                  >
                    <IconoRed className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
            <div className="pt-4">
              <p className="text-xs text-gray-400 mb-2">Horario de atención:</p>
              <p className="text-sm text-gray-300">Lunes - Domingo: 24/7</p>
              <p className="text-xs text-gray-400 mt-2">Emergencias: Disponible siempre</p>
            </div>
          </div>
        </div>

        {/* Línea separadora */}
        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400" data-testid="text-copyright">
              © {new Date().getFullYear()} APO-360. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/terminos" className="hover:text-white transition-colors">Términos de Uso</a>
              <a href="/privacidad" className="hover:text-white transition-colors">Privacidad</a>
              <a href="/libro-reclamaciones" className="hover:text-white transition-colors">Libro de Reclamaciones</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
