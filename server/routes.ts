import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createUploadMiddleware, getPublicUrl } from "./uploadConfigByEndpoint";
import { requireSuperAdmin } from "./authMiddleware";
import { 
  insertPublicidadSchema, 
  insertServicioSchema, 
  insertProductoDeliverySchema, 
  insertGrupoChatSchema, 
  insertMensajeSchema, 
  insertEmergenciaSchema, 
  insertViajeTaxiSchema, 
  insertPedidoDeliverySchema, 
  insertRadioOnlineSchema, 
  insertListaMp3Schema,
  insertArchivoMp3Schema,
  insertRegistroBasicoSchema,
  insertRegistroChatSchema,
  insertRegistroUbicacionSchema,
  insertRegistroDireccionSchema,
  insertRegistroMarketplaceSchema,
  insertCredencialesConductorSchema,
  rolesRegistroValidos,
  rolesConAprobacion,
} from "@shared/schema";
import { registerAdminRoutes } from "./routes-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación
  await setupAuth(app);

  // Servir archivos estáticos
  const publicPath = path.join(process.cwd(), 'public');
  app.use('/assets', express.static(path.join(publicPath, 'assets')));

  // ============================================================
  // RUTAS DE PERFIL DE USUARIO (debe ir ANTES de rutas admin)
  // Las rutas /api/usuarios/me deben registrarse antes de /api/usuarios/:id
  // ============================================================

  app.get('/api/usuarios/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({ message: "Error al obtener perfil" });
    }
  });

  app.patch('/api/usuarios/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUser(userId, req.body);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      res.status(400).json({ message: error.message || "Error al actualizar perfil" });
    }
  });

  // Registrar rutas de administración
  registerAdminRoutes(app);

  // ============================================================
  // RUTAS DE UPLOAD DE ARCHIVOS
  // ============================================================

  app.post('/api/upload/publicidad', isAuthenticated, requireSuperAdmin, createUploadMiddleware('carrusel', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de publicidad:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/galeria', isAuthenticated, requireSuperAdmin, createUploadMiddleware('galeria', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de galería:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/servicios', isAuthenticated, requireSuperAdmin, createUploadMiddleware('servicios', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de servicios:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/documentos', isAuthenticated, createUploadMiddleware('documentos', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        tipo: req.body.tipoDocumento || 'general',
      });
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      res.status(500).json({ message: error.message || 'Error al subir documento' });
    }
  });

  // ============================================================
  // RUTAS DE AUTENTICACIÓN
  // ============================================================

  // Helper para generar configuración fail-closed (solo usuario habilitado)
  const getFailClosedConfig = (): Record<string, { habilitado: boolean }> => {
    const config: Record<string, { habilitado: boolean }> = {};
    rolesRegistroValidos.forEach(rol => {
      config[rol] = { habilitado: rol === "usuario" };
    });
    return config;
  };

  // Helper para validar estructura de configuración de roles
  // Devuelve null si inválida, o el objeto validado si es correcto
  const validateAndGetRolesConfig = (valorConfig: string | null | undefined): Record<string, { habilitado: boolean }> | null => {
    // Valor nulo, undefined o vacío = inválido
    if (!valorConfig || valorConfig.trim() === '') {
      return null;
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(valorConfig);
    } catch {
      return null; // Error parsing = inválido
    }
    
    // Debe ser objeto no nulo y NO un array
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    
    // Objeto vacío {} = inválido (no es primera vez, es config corrupta/limpiada)
    if (Object.keys(parsed).length === 0) {
      return null;
    }
    
    // Validar que cada entrada de rol conocido tenga estructura correcta
    for (const [key, value] of Object.entries(parsed)) {
      if (!(rolesRegistroValidos as readonly string[]).includes(key)) continue;
      if (typeof value !== 'object' || value === null) return null;
      if (typeof (value as any).habilitado !== 'boolean') return null;
    }
    
    return parsed as Record<string, { habilitado: boolean }>;
  };

  // Helper unificado para verificar si un rol específico está habilitado
  // Devuelve: true si habilitado, false si no, null si es primera vez (sin config)
  const isRolHabilitadoEnConfig = async (rolId: string): Promise<{ habilitado: boolean; primeraVez: boolean }> => {
    // Rol "usuario" siempre está habilitado
    if (rolId === "usuario") {
      return { habilitado: true, primeraVez: false };
    }
    
    try {
      const configRoles = await storage.getConfiguracion('roles_habilitados');
      
      // CASO: No existe registro en BD = primera vez, permitir todos
      if (configRoles === null || configRoles === undefined) {
        return { habilitado: true, primeraVez: true };
      }
      
      // CASO: Existe registro, validar contenido
      const configValidada = validateAndGetRolesConfig(configRoles.valor);
      
      if (configValidada === null) {
        // Config inválida/corrupta/vacía = fail-closed
        return { habilitado: false, primeraVez: false };
      }
      
      // Config válida: verificar que el rol esté explícitamente habilitado
      if (rolId in configValidada && configValidada[rolId]?.habilitado === true) {
        return { habilitado: true, primeraVez: false };
      }
      
      // Rol no existe en config o no está habilitado = fail-closed
      return { habilitado: false, primeraVez: false };
    } catch (error) {
      console.error("Error de BD al verificar rol habilitado:", error);
      // Error de BD = fail-closed
      return { habilitado: false, primeraVez: false };
    }
  };

  // Endpoint para obtener configuración de roles habilitados
  app.get('/api/configuracion/roles', async (req, res) => {
    try {
      const configRoles = await storage.getConfiguracion('roles_habilitados');
      
      // CASO: No existe registro en BD = primera vez, todos habilitados
      if (configRoles === null || configRoles === undefined) {
        const defaultConfig: Record<string, { habilitado: boolean }> = {};
        rolesRegistroValidos.forEach(rol => {
          defaultConfig[rol] = { habilitado: true };
        });
        return res.json(defaultConfig);
      }
      
      // CASO: Existe registro, validar usando helper unificado
      const configValidada = validateAndGetRolesConfig(configRoles.valor);
      
      if (configValidada === null) {
        // Config inválida/corrupta/vacía = fail-closed
        console.warn("Configuración de roles inválida en GET, aplicando fail-closed");
        return res.json(getFailClosedConfig());
      }
      
      // Config válida con contenido
      return res.json(configValidada);
    } catch (error) {
      console.error("Error de BD al obtener configuración de roles:", error);
      // Error de BD = fail-closed
      res.json(getFailClosedConfig());
    }
  });

  // Endpoint para actualizar configuración de roles (solo super admin)
  app.put('/api/configuracion/roles', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const rolesConfig = req.body;
      
      // Validar estructura del JSON antes de guardar usando helper unificado
      // Serializamos y re-validamos para asegurar consistencia
      const jsonString = JSON.stringify(rolesConfig);
      const configValidada = validateAndGetRolesConfig(jsonString);
      
      if (configValidada === null) {
        return res.status(400).json({ 
          message: "Estructura de configuración inválida. Debe ser {rol: {habilitado: boolean}} con al menos un rol" 
        });
      }
      
      await storage.setConfiguracion({
        clave: 'roles_habilitados',
        valor: jsonString,
        tipo: 'json',
      });
      res.json({ message: "Configuración de roles actualizada", config: configValidada });
    } catch (error: any) {
      console.error("Error al actualizar configuración de roles:", error);
      res.status(500).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  // ============================================================
  // RUTA DE LOGIN (autenticación local con email/password)
  // ============================================================
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Verificar contraseña
      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      if (user.passwordHash !== passwordHash) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Verificar estado del usuario
      if (user.estado === 'inactivo' || user.estado === 'suspendido') {
        return res.status(403).json({ message: "Tu cuenta está suspendida o inactiva. Contacta al administrador." });
      }

      if (user.estado === 'pendiente_aprobacion') {
        return res.status(403).json({ message: "Tu cuenta está pendiente de aprobación por un administrador." });
      }

      // Crear sesión del usuario
      if (!req.session) {
        return res.status(500).json({ message: "Error al crear sesión" });
      }

      // Guardar datos en sesión (compatible con el sistema existente)
      const session = req.session as any;
      session.userId = user.id;
      session.user = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          rol: user.rol,
        }
      };

      // Persistir la sesión antes de responder
      session.save((err: any) => {
        if (err) {
          console.error("Error al guardar sesión:", err);
          return res.status(500).json({ message: "Error al crear sesión" });
        }

        res.json({
          message: "Login exitoso",
          user: {
            id: user.id,
            nombre: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.firstName || user.lastName || user.alias || 'Usuario',
            email: user.email,
            rol: user.rol,
            nivelUsuario: user.nivelUsuario,
            estado: user.estado,
            profileImageUrl: user.profileImageUrl,
          }
        });
      });
    } catch (error: any) {
      console.error("Error en login:", error);
      res.status(500).json({ message: error.message || "Error al iniciar sesión" });
    }
  });

  app.post('/api/auth/registro', async (req, res) => {
    try {
      const { 
        alias, email, password, nivelUsuario, rol, telefono,
        firstName, lastName, dni,
        dniImagenFrente, dniImagenPosterior, dniEmision, dniCaducidad,
        profileImageUrl, pais, departamento, distrito, sector,
        direccion, manzanaLote, avenidaCalle, gpsLatitud, gpsLongitud,
        nombreLocal, direccionLocal, gpsLocalLatitud, gpsLocalLongitud, ruc
      } = req.body;

      if (!alias || !email || !password) {
        return res.status(400).json({ message: "Alias, email y contraseña son requeridos" });
      }

      if (alias.length < 3 || alias.length > 50) {
        return res.status(400).json({ message: "El alias debe tener entre 3 y 50 caracteres" });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(alias)) {
        return res.status(400).json({ message: "El alias solo puede contener letras, números y guión bajo" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Usar helpers compartidos para validar rol
      const rolSeleccionado = rol && (rolesRegistroValidos as readonly string[]).includes(rol) 
        ? rol 
        : "usuario";
      
      // Validar que el rol esté habilitado usando helper unificado (fail-closed approach)
      const { habilitado: rolHabilitado } = await isRolHabilitadoEnConfig(rolSeleccionado);
      
      if (!rolHabilitado) {
        return res.status(400).json({ 
          message: "Este tipo de cuenta no está disponible actualmente. Por favor, selecciona otro rol o contacta al administrador." 
        });
      }
      
      // Usar helper compartido para determinar si requiere aprobación
      const requiereAprobacion = (rolesConAprobacion as readonly string[]).includes(rolSeleccionado);
      const estadoUsuario = requiereAprobacion ? "pendiente_aprobacion" : "activo";

      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const id = crypto.randomUUID();

      const userData: Partial<any> & { id: string } = {
        id,
        alias,
        email,
        telefono: telefono || null,
        passwordHash,
        nivelUsuario: nivelUsuario || 1,
        rol: rolSeleccionado,
        estado: estadoUsuario,
      };

      if (nivelUsuario >= 2) {
        userData.firstName = firstName;
        userData.lastName = lastName;
        userData.dni = dni;
        userData.dniImagenFrente = dniImagenFrente;
        userData.dniImagenPosterior = dniImagenPosterior;
        if (dniEmision) userData.dniEmision = dniEmision;
        if (dniCaducidad) userData.dniCaducidad = dniCaducidad;
        userData.profileImageUrl = profileImageUrl;
      }

      if (nivelUsuario >= 3) {
        userData.pais = pais;
        userData.departamento = departamento;
        userData.distrito = distrito;
        userData.sector = sector;
      }

      if (nivelUsuario >= 4) {
        userData.direccion = direccion;
        userData.manzanaLote = manzanaLote;
        userData.avenidaCalle = avenidaCalle;
        if (gpsLatitud) userData.gpsLatitud = parseFloat(gpsLatitud);
        if (gpsLongitud) userData.gpsLongitud = parseFloat(gpsLongitud);
      }

      if (nivelUsuario >= 5) {
        userData.nombreLocal = nombreLocal;
        userData.direccionLocal = direccionLocal;
        if (gpsLocalLatitud) userData.gpsLocalLatitud = parseFloat(gpsLocalLatitud);
        if (gpsLocalLongitud) userData.gpsLocalLongitud = parseFloat(gpsLocalLongitud);
        userData.ruc = ruc;
      }

      const newUser = await storage.createUser(userData);
      
      res.status(201).json({ 
        message: requiereAprobacion 
          ? "Registro enviado. Tu solicitud será revisada por un administrador."
          : "Usuario registrado exitosamente",
        user: {
          id: newUser.id,
          alias: newUser.alias,
          email: newUser.email,
          nivelUsuario: newUser.nivelUsuario,
          rol: newUser.rol,
          estado: newUser.estado,
        },
        requiereAprobacion,
      });
    } catch (error: any) {
      console.error("Error en registro:", error);
      res.status(500).json({ message: error.message || "Error al registrar usuario" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const authUser = {
        id: user.id,
        nombre: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName || user.lastName || 'Usuario',
        email: user.email || '',
        rol: user.rol,
        rolesSuperAdmin: user.rol === 'super_admin',
        telefono: user.telefono || undefined,
        ubicacionLatitud: user.latitud || undefined,
        ubicacionLongitud: user.longitud || undefined,
        modoTaxi: user.modoTaxi === 'conductor',
        activo: user.estado === 'activo',
        imagenPerfil: user.profileImageUrl || undefined,
        primerNombre: user.firstName || undefined,
        apellido: user.lastName || undefined,
      };
      
      res.json(authUser);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  // Ruta para subir foto de perfil (separada porque tiene middleware de upload)
  app.post('/api/usuarios/:id/foto', isAuthenticated, createUploadMiddleware('perfiles', 'imagen'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      if (id !== userId && req.user.claims.rol !== 'super_admin') {
        return res.status(403).json({ message: "No autorizado" });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      }

      const url = getPublicUrl(req.file.path);
      const user = await storage.updateUser(id, { profileImageUrl: url });
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({ 
        profileImageUrl: url,
        message: "Foto de perfil actualizada"
      });
    } catch (error: any) {
      console.error("Error al subir foto de perfil:", error);
      res.status(500).json({ message: error.message || "Error al subir foto de perfil" });
    }
  });

  // ============================================================
  // RUTAS DE ESTADÍSTICAS PÚBLICAS
  // ============================================================

  app.get('/api/estadisticas/publicas', async (req, res) => {
    try {
      const stats = await storage.getEstadisticasPublicas();
      res.json(stats);
    } catch (error) {
      console.error("Error al obtener estadísticas públicas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // ============================================================
  // RUTAS DE PUBLICIDAD
  // ============================================================

  app.get('/api/publicidad', async (req, res) => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const publicidades = await storage.getPublicidades(tipo);
      res.json(publicidades);
    } catch (error) {
      console.error("Error al obtener publicidad:", error);
      res.status(500).json({ message: "Error al obtener publicidad" });
    }
  });

  app.post('/api/publicidad', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convertir fechas de string a Date si es necesario
      const body = { ...req.body };
      if (body.fechaInicio && typeof body.fechaInicio === 'string') {
        body.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
      }
      if (body.fechaFin && typeof body.fechaFin === 'string') {
        body.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
      }
      if (body.fechaCaducidad && typeof body.fechaCaducidad === 'string') {
        body.fechaCaducidad = body.fechaCaducidad ? new Date(body.fechaCaducidad) : null;
      }
      
      const data = insertPublicidadSchema.parse(body);
      const publicidad = await storage.createPublicidad({
        ...data,
        usuarioId: userId,
      });
      res.json(publicidad);
    } catch (error: any) {
      console.error("Error al crear publicidad:", error);
      res.status(400).json({ message: error.message || "Error al crear publicidad" });
    }
  });

  app.patch('/api/publicidad/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convertir fechas de string a Date si es necesario
      const body = { ...req.body };
      if (body.fechaInicio && typeof body.fechaInicio === 'string') {
        body.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
      }
      if (body.fechaFin && typeof body.fechaFin === 'string') {
        body.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
      }
      if (body.fechaCaducidad && typeof body.fechaCaducidad === 'string') {
        body.fechaCaducidad = body.fechaCaducidad ? new Date(body.fechaCaducidad) : null;
      }
      
      const publicidad = await storage.updatePublicidad(id, body);
      if (!publicidad) {
        return res.status(404).json({ message: "Publicidad no encontrada" });
      }
      res.json(publicidad);
    } catch (error) {
      console.error("Error al actualizar publicidad:", error);
      res.status(500).json({ message: "Error al actualizar publicidad" });
    }
  });

  app.delete('/api/publicidad/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePublicidad(id);
      res.json({ message: "Publicidad eliminada" });
    } catch (error) {
      console.error("Error al eliminar publicidad:", error);
      res.status(500).json({ message: "Error al eliminar publicidad" });
    }
  });

  // ============================================================
  // RUTAS DE INTERACCIONES DE PUBLICIDAD
  // ============================================================

  // Obtener contadores de una publicidad
  app.get('/api/publicidad/:id/contadores', async (req, res) => {
    try {
      const { id } = req.params;
      const contadores = await storage.getContadoresPublicidad(id);
      res.json(contadores || { likes: 0, favoritos: 0, compartidos: 0, impresiones: 0, comentarios: 0, agendados: 0 });
    } catch (error) {
      console.error("Error al obtener contadores:", error);
      res.status(500).json({ message: "Error al obtener contadores" });
    }
  });

  // Verificar si el usuario ha interactuado (like, favorito)
  app.get('/api/publicidad/:id/mis-interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const interacciones = await storage.getInteraccionesUsuario(id, userId);
      res.json(interacciones);
    } catch (error) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  // Toggle like
  app.post('/api/publicidad/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.toggleLikePublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al dar like:", error);
      res.status(500).json({ message: "Error al dar like" });
    }
  });

  // Toggle favorito
  app.post('/api/publicidad/:id/favorito', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.toggleFavoritoPublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al marcar favorito:", error);
      res.status(500).json({ message: "Error al marcar favorito" });
    }
  });

  // Registrar compartido
  app.post('/api/publicidad/:id/compartir', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { redSocial } = req.body;
      const resultado = await storage.registrarCompartidoPublicidad(id, userId, redSocial);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar compartido:", error);
      res.status(500).json({ message: "Error al registrar compartido" });
    }
  });

  // Registrar impresión (imprimir)
  app.post('/api/publicidad/:id/impresion', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.registrarImpresionPublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar impresión:", error);
      res.status(500).json({ message: "Error al registrar impresión" });
    }
  });

  // Registrar agenda (Google Calendar)
  app.post('/api/publicidad/:id/agenda', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.registrarAgendaPublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar agenda:", error);
      res.status(500).json({ message: "Error al registrar agenda" });
    }
  });

  // Obtener comentarios de una publicidad
  app.get('/api/publicidad/:id/comentarios', async (req, res) => {
    try {
      const { id } = req.params;
      const comentarios = await storage.getComentariosPublicidad(id);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // Crear comentario
  app.post('/api/publicidad/:id/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { contenido } = req.body;
      
      if (!contenido || contenido.trim().length === 0) {
        return res.status(400).json({ message: "El comentario no puede estar vacío" });
      }
      
      const comentario = await storage.crearComentarioPublicidad(id, userId, contenido);
      res.json(comentario);
    } catch (error) {
      console.error("Error al crear comentario:", error);
      res.status(500).json({ message: "Error al crear comentario" });
    }
  });

  // Eliminar comentario (solo el autor)
  app.delete('/api/publicidad/:publicidadId/comentarios/:comentarioId', isAuthenticated, async (req: any, res) => {
    try {
      const { comentarioId } = req.params;
      const userId = req.user.claims.sub;
      await storage.eliminarComentarioPublicidad(comentarioId, userId);
      res.json({ message: "Comentario eliminado" });
    } catch (error: any) {
      console.error("Error al eliminar comentario:", error);
      res.status(400).json({ message: error.message || "Error al eliminar comentario" });
    }
  });

  // Obtener favoritos del usuario
  app.get('/api/usuarios/me/favoritos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoritos = await storage.getFavoritosUsuario(userId);
      res.json(favoritos);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ message: "Error al obtener favoritos" });
    }
  });

  // ============================================================
  // RUTAS DE CHAT COMUNITARIO
  // ============================================================

  // Obtener todos los grupos de chat (admin)
  app.get('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const grupos = await storage.getGruposChat();
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      res.status(500).json({ message: "Error al obtener grupos de chat" });
    }
  });

  // Obtener grupos de chat del usuario autenticado
  app.get('/api/chat/mis-grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grupos = await storage.getGruposPorUsuario(userId);
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos del usuario:", error);
      res.status(500).json({ message: "Error al obtener tus grupos" });
    }
  });

  // Obtener grupos de emergencia (policía, bomberos, etc.)
  app.get('/api/chat/grupos-emergencia', async (req, res) => {
    try {
      const grupos = await storage.getGruposEmergencia();
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos de emergencia:", error);
      res.status(500).json({ message: "Error al obtener grupos de emergencia" });
    }
  });

  // Obtener un grupo específico
  app.get('/api/chat/grupos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const grupo = await storage.getGrupo(id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      res.json(grupo);
    } catch (error) {
      console.error("Error al obtener grupo:", error);
      res.status(500).json({ message: "Error al obtener grupo" });
    }
  });

  // Verificar si usuario puede acceder a un grupo
  app.get('/api/chat/grupos/:id/acceso', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.puedeAccederChat(userId, id);
      res.json(resultado);
    } catch (error) {
      console.error("Error al verificar acceso:", error);
      res.status(500).json({ message: "Error al verificar acceso" });
    }
  });

  // Crear grupo de chat
  app.post('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGrupoChatSchema.parse(req.body);
      const grupo = await storage.createGrupo({
        ...data,
        creadorId: userId,
        adminGrupoId: userId,
      });
      res.json(grupo);
    } catch (error: any) {
      console.error("Error al crear grupo:", error);
      res.status(400).json({ message: error.message || "Error al crear grupo" });
    }
  });

  // Actualizar grupo de chat
  app.patch('/api/chat/grupos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que sea admin del grupo o super_admin
      const grupo = await storage.getGrupo(id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      
      const miembro = await storage.getMiembroGrupo(id, userId);
      const user = await storage.getUser(userId);
      
      if (!miembro || (miembro.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para editar este grupo" });
      }
      
      const grupoActualizado = await storage.updateGrupoChat(id, req.body);
      res.json(grupoActualizado);
    } catch (error: any) {
      console.error("Error al actualizar grupo:", error);
      res.status(400).json({ message: error.message || "Error al actualizar grupo" });
    }
  });

  // Suspender grupo de chat
  app.post('/api/chat/grupos/:id/suspender', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const grupo = await storage.suspenderGrupo(id, motivo || "Suspendido por administrador");
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      res.json(grupo);
    } catch (error) {
      console.error("Error al suspender grupo:", error);
      res.status(500).json({ message: "Error al suspender grupo" });
    }
  });

  // Activar grupo de chat
  app.post('/api/chat/grupos/:id/activar', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const grupo = await storage.activarGrupo(id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      res.json(grupo);
    } catch (error) {
      console.error("Error al activar grupo:", error);
      res.status(500).json({ message: "Error al activar grupo" });
    }
  });

  // Eliminar grupo de chat
  app.delete('/api/chat/grupos/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGrupoChat(id);
      res.json({ message: "Grupo eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
      res.status(500).json({ message: "Error al eliminar grupo" });
    }
  });

  // ============================================================
  // MIEMBROS DE GRUPO
  // ============================================================

  // Obtener miembros de un grupo
  app.get('/api/chat/grupos/:grupoId/miembros', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const miembros = await storage.getMiembrosGrupo(grupoId);
      res.json(miembros);
    } catch (error) {
      console.error("Error al obtener miembros:", error);
      res.status(500).json({ message: "Error al obtener miembros" });
    }
  });

  // Agregar miembro a grupo
  app.post('/api/chat/grupos/:grupoId/miembros', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const { usuarioId, rol = 'miembro' } = req.body;
      const userId = req.user.claims.sub;
      
      // Verificar que sea admin del grupo
      const miembroActual = await storage.getMiembroGrupo(grupoId, userId);
      const user = await storage.getUser(userId);
      
      if (!miembroActual || (miembroActual.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para agregar miembros" });
      }
      
      const miembro = await storage.agregarMiembroGrupo({
        grupoId,
        usuarioId,
        rol,
      });
      res.json(miembro);
    } catch (error: any) {
      console.error("Error al agregar miembro:", error);
      res.status(400).json({ message: error.message || "Error al agregar miembro" });
    }
  });

  // Unirse a un grupo (usuario se une a sí mismo)
  app.post('/api/chat/grupos/:grupoId/unirse', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que pueda acceder
      const acceso = await storage.puedeAccederChat(userId, grupoId);
      if (acceso.puede) {
        return res.status(400).json({ message: "Ya eres miembro de este grupo" });
      }
      
      // Verificar nivel de estrellas
      const nivelUsuario = await storage.verificarNivelUsuario(userId);
      const grupo = await storage.getGrupo(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      
      if (nivelUsuario < (grupo.estrellasMinimas || 3)) {
        return res.status(403).json({ 
          message: `Necesitas ${grupo.estrellasMinimas || 3} estrellas para unirte. Tienes ${nivelUsuario} estrellas.` 
        });
      }
      
      const miembro = await storage.agregarMiembroGrupo({
        grupoId,
        usuarioId: userId,
        rol: 'miembro',
      });
      res.json(miembro);
    } catch (error: any) {
      console.error("Error al unirse al grupo:", error);
      res.status(400).json({ message: error.message || "Error al unirse al grupo" });
    }
  });

  // Actualizar rol de miembro
  app.patch('/api/chat/grupos/:grupoId/miembros/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId, usuarioId } = req.params;
      const adminId = req.user.claims.sub;
      
      const miembroAdmin = await storage.getMiembroGrupo(grupoId, adminId);
      const user = await storage.getUser(adminId);
      
      if (!miembroAdmin || (miembroAdmin.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para editar miembros" });
      }
      
      const miembro = await storage.updateMiembroGrupo(grupoId, usuarioId, req.body);
      if (!miembro) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      res.json(miembro);
    } catch (error: any) {
      console.error("Error al actualizar miembro:", error);
      res.status(400).json({ message: error.message || "Error al actualizar miembro" });
    }
  });

  // Suspender miembro
  app.post('/api/chat/grupos/:grupoId/miembros/:usuarioId/suspender', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId, usuarioId } = req.params;
      const { motivo } = req.body;
      const adminId = req.user.claims.sub;
      
      const miembroAdmin = await storage.getMiembroGrupo(grupoId, adminId);
      const user = await storage.getUser(adminId);
      
      if (!miembroAdmin || (miembroAdmin.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para suspender miembros" });
      }
      
      const miembro = await storage.suspenderMiembroGrupo(grupoId, usuarioId, motivo || "Suspendido por administrador del grupo");
      if (!miembro) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      res.json(miembro);
    } catch (error) {
      console.error("Error al suspender miembro:", error);
      res.status(500).json({ message: "Error al suspender miembro" });
    }
  });

  // Remover miembro del grupo
  app.delete('/api/chat/grupos/:grupoId/miembros/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId, usuarioId } = req.params;
      const adminId = req.user.claims.sub;
      
      // Permitir que el usuario se remueva a sí mismo
      if (usuarioId === adminId) {
        await storage.removerMiembroGrupo(grupoId, usuarioId);
        return res.json({ message: "Has salido del grupo" });
      }
      
      const miembroAdmin = await storage.getMiembroGrupo(grupoId, adminId);
      const user = await storage.getUser(adminId);
      
      if (!miembroAdmin || (miembroAdmin.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para remover miembros" });
      }
      
      await storage.removerMiembroGrupo(grupoId, usuarioId);
      res.json({ message: "Miembro removido del grupo" });
    } catch (error) {
      console.error("Error al remover miembro:", error);
      res.status(500).json({ message: "Error al remover miembro" });
    }
  });

  // ============================================================
  // MENSAJES DE CHAT
  // ============================================================

  // Obtener mensajes de un grupo
  app.get('/api/chat/grupos/:grupoId/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      const limite = parseInt(req.query.limite as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Verificar acceso
      const acceso = await storage.puedeAccederChat(userId, grupoId);
      if (!acceso.puede) {
        return res.status(403).json({ message: acceso.razon });
      }
      
      const mensajes = await storage.getMensajesGrupoConPaginacion(grupoId, limite, offset);
      
      // Marcar mensajes como leídos
      await storage.marcarMensajesComoLeidos(grupoId, userId);
      
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  // Enviar mensaje a un grupo
  app.post('/api/chat/grupos/:grupoId/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar acceso
      const acceso = await storage.puedeAccederChat(userId, grupoId);
      if (!acceso.puede) {
        return res.status(403).json({ message: acceso.razon });
      }
      
      const user = await storage.getUser(userId);
      
      const mensaje = await storage.createMensaje({
        grupoId,
        remitenteId: userId,
        contenido: req.body.contenido,
        tipo: req.body.tipoContenido || 'texto',
        archivoUrl: req.body.archivoUrl,
        gpsLatitud: req.body.gpsLatitud,
        gpsLongitud: req.body.gpsLongitud,
        metadataFoto: req.body.metadataFoto ? {
          nombreUsuario: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Usuario',
          logoUrl: user?.profileImageUrl,
          fechaHora: new Date().toISOString(),
        } : undefined,
      });
      
      res.json(mensaje);
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      res.status(400).json({ message: error.message || "Error al enviar mensaje" });
    }
  });

  // Subir archivo para mensaje (imagen, audio, documento)
  app.post('/api/chat/upload', isAuthenticated, createUploadMiddleware('chat', 'archivo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error: any) {
      console.error('Error al subir archivo de chat:', error);
      res.status(500).json({ message: error.message || 'Error al subir archivo' });
    }
  });

  // Eliminar mensaje (soft delete)
  app.delete('/api/chat/mensajes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const mensaje = await storage.eliminarMensaje(id, userId);
      if (!mensaje) {
        return res.status(404).json({ message: "Mensaje no encontrado" });
      }
      res.json({ message: "Mensaje eliminado" });
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
      res.status(500).json({ message: "Error al eliminar mensaje" });
    }
  });

  // Historial de mensajes (últimos 30 días)
  app.get('/api/chat/grupos/:grupoId/historial', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { grupoId } = req.params;
      const dias = parseInt(req.query.dias as string) || 30;
      
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - dias);
      
      const mensajes = await storage.getMensajesHistorico(grupoId, fechaDesde);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({ message: "Error al obtener historial" });
    }
  });

  // ============================================================
  // RUTAS DE CONTACTOS E INVITACIONES
  // ============================================================

  // Obtener contactos del usuario (simulado - en producción conectaría con Google Contacts)
  app.get('/api/contactos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Obtener todos los usuarios registrados como "contactos potenciales"
      const usuarios = await storage.getAllUsers();
      
      const contactos = usuarios
        .filter(u => u.id !== userId)
        .map(u => ({
          id: u.id,
          nombre: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email?.split('@')[0] || 'Usuario',
          email: u.email || '',
          telefono: u.telefono,
          avatarUrl: u.profileImageUrl,
          registrado: true,
        }));
      
      res.json(contactos);
    } catch (error) {
      console.error("Error al obtener contactos:", error);
      res.status(500).json({ message: "Error al obtener contactos" });
    }
  });

  // Enviar invitación por correo o WhatsApp
  app.post('/api/invitaciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email, telefono, metodo } = req.body;
      
      if (metodo === 'whatsapp') {
        if (!telefono) {
          return res.status(400).json({ message: "Número de teléfono requerido" });
        }
        
        // Limpiar número de teléfono y agregar prefijo de Perú si no tiene
        let numeroLimpio = telefono.replace(/[^0-9+]/g, '');
        
        // Si empieza con 0, quitarlo (ej: 052 -> 52)
        if (numeroLimpio.startsWith('0')) {
          numeroLimpio = numeroLimpio.substring(1);
        }
        
        // Si no tiene prefijo de país, agregar +51 (Perú)
        if (!numeroLimpio.startsWith('+') && !numeroLimpio.startsWith('51')) {
          numeroLimpio = '51' + numeroLimpio;
        } else if (numeroLimpio.startsWith('+')) {
          numeroLimpio = numeroLimpio.substring(1);
        }
        
        // Para WhatsApp, generamos el enlace de invitación
        const enlace = `${req.protocol}://${req.get('host')}/registro`;
        const mensaje = encodeURIComponent(`¡Hola! Te invito a unirte a SEG-APO, la app de seguridad comunitaria de Tacna. Regístrate aquí: ${enlace}`);
        const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensaje}`;
        
        console.log(`📱 Invitación WhatsApp generada para ${numeroLimpio}`);
        
        return res.json({ 
          message: "Enlace de WhatsApp generado",
          whatsappUrl,
          numeroFormateado: numeroLimpio,
          enviada: true
        });
      }
      
      // Invitación por email
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Email inválido" });
      }
      
      // Verificar si ya está registrado
      const usuarioExistente = await storage.getUserByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ message: "Este usuario ya está registrado en SEG-APO" });
      }
      
      const remitente = await storage.getUser(userId);
      const nombreRemitente = `${remitente?.firstName || ''} ${remitente?.lastName || ''}`.trim() || 'Un usuario';
      
      // En producción, aquí enviaríamos el correo con nodemailer
      console.log(`📧 Invitación enviada a ${email} por ${nombreRemitente}`);
      
      res.json({ 
        message: "Invitación enviada exitosamente",
        email,
        enviada: true
      });
    } catch (error) {
      console.error("Error al enviar invitación:", error);
      res.status(500).json({ message: "Error al enviar invitación" });
    }
  });

  // Crear o obtener conversación privada 1-a-1
  app.post('/api/chat/conversaciones-privadas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactoId } = req.body;
      
      if (!contactoId) {
        return res.status(400).json({ message: "Se requiere el ID del contacto" });
      }

      // Verificar que el contacto existe
      const contacto = await storage.getUser(contactoId);
      if (!contacto) {
        return res.status(404).json({ message: "Contacto no encontrado" });
      }

      // Buscar si ya existe una conversación privada entre estos dos usuarios
      const gruposUsuario = await storage.getGruposPorUsuario(userId);
      let grupoPrivado = gruposUsuario.find(g => {
        if (g.tipo !== 'privado') return false;
        // El nombre del grupo privado tiene formato: "privado_userId1_userId2"
        const ids = [userId, contactoId].sort();
        return g.nombre === `privado_${ids[0]}_${ids[1]}`;
      });

      if (!grupoPrivado) {
        // Crear nuevo grupo privado
        const ids = [userId, contactoId].sort();
        const nuevoGrupo = await storage.createGrupo({
          nombre: `privado_${ids[0]}_${ids[1]}`,
          tipo: 'privado',
          descripcion: 'Conversación privada',
          creadorId: userId,
        });

        // Agregar al contacto como miembro (el creador ya se agrega automáticamente en createGrupo)
        await storage.agregarMiembroGrupo({
          grupoId: nuevoGrupo.id,
          usuarioId: contactoId,
          rol: 'miembro',
        });

        grupoPrivado = nuevoGrupo;
      }

      // Enriquecer con datos del contacto para mostrar en UI
      const nombreContacto = `${contacto.firstName || ''} ${contacto.lastName || ''}`.trim() || contacto.email?.split('@')[0] || 'Usuario';

      res.json({
        ...grupoPrivado,
        nombreMostrar: nombreContacto,
        avatarContacto: contacto.profileImageUrl,
        contactoId: contacto.id,
      });
    } catch (error) {
      console.error("Error al crear conversación privada:", error);
      res.status(500).json({ message: "Error al crear conversación privada" });
    }
  });

  // ============================================================
  // RUTAS DE SERVICIOS
  // ============================================================

  app.get('/api/servicios', async (req, res) => {
    try {
      const servicios = await storage.getServicios();
      res.json(servicios);
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      res.status(500).json({ message: "Error al obtener servicios" });
    }
  });

  app.get('/api/servicios/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const servicio = await storage.getServicio(id);
      if (!servicio) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }
      res.json(servicio);
    } catch (error) {
      console.error("Error al obtener servicio:", error);
      res.status(500).json({ message: "Error al obtener servicio" });
    }
  });

  app.get('/api/servicios/:id/productos', async (req, res) => {
    try {
      const { id } = req.params;
      const productos = await storage.getProductosPorServicio(id);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.post('/api/servicios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertServicioSchema.parse(req.body);
      const servicio = await storage.createServicio({
        ...data,
        usuarioId: userId,
      });
      res.json(servicio);
    } catch (error: any) {
      console.error("Error al crear servicio:", error);
      res.status(400).json({ message: error.message || "Error al crear servicio" });
    }
  });

  // ============================================================
  // RUTAS DE CHAT
  // ============================================================

  app.get('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grupos = await storage.getGruposPorUsuario(userId);
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      res.status(500).json({ message: "Error al obtener grupos" });
    }
  });

  app.post('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGrupoChatSchema.parse(req.body);
      const grupo = await storage.createGrupo({
        ...data,
        creadorId: userId,
      });
      
      // Agregar al creador como miembro
      await storage.agregarMiembroGrupo({
        grupoId: grupo.id,
        usuarioId: userId,
        rol: 'admin',
      });
      
      res.json(grupo);
    } catch (error: any) {
      console.error("Error al crear grupo:", error);
      res.status(400).json({ message: error.message || "Error al crear grupo" });
    }
  });

  app.get('/api/chat/mensajes/:grupoId', isAuthenticated, async (req, res) => {
    try {
      const { grupoId } = req.params;
      const mensajes = await storage.getMensajesPorGrupo(grupoId);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.post('/api/chat/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertMensajeSchema.parse(req.body);
      const mensaje = await storage.createMensaje({
        ...data,
        remitenteId: userId,
      });
      
      // Emitir mensaje a través de WebSocket (se manejará después)
      res.json(mensaje);
    } catch (error: any) {
      console.error("Error al crear mensaje:", error);
      res.status(400).json({ message: error.message || "Error al crear mensaje" });
    }
  });

  // ============================================================
  // RUTAS DE EMERGENCIAS
  // ============================================================

  app.get('/api/emergencias', isAuthenticated, async (req, res) => {
    try {
      const emergencias = await storage.getEmergencias();
      res.json(emergencias);
    } catch (error) {
      console.error("Error al obtener emergencias:", error);
      res.status(500).json({ message: "Error al obtener emergencias" });
    }
  });

  app.get('/api/emergencias/recientes', async (req, res) => {
    try {
      const limite = parseInt(req.query.limite as string) || 10;
      const emergencias = await storage.getEmergenciasRecientes(limite);
      res.json(emergencias);
    } catch (error) {
      console.error("Error al obtener emergencias recientes:", error);
      res.status(500).json({ message: "Error al obtener emergencias recientes" });
    }
  });

  app.post('/api/emergencias', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertEmergenciaSchema.parse(req.body);
      const emergencia = await storage.createEmergencia({
        ...data,
        usuarioId: userId,
      });
      
      // TODO: Enviar notificaciones a grupos y entidades
      res.json(emergencia);
    } catch (error: any) {
      console.error("Error al crear emergencia:", error);
      res.status(400).json({ message: error.message || "Error al crear emergencia" });
    }
  });

  app.patch('/api/emergencias/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const emergencia = await storage.updateEmergencia(id, req.body);
      if (!emergencia) {
        return res.status(404).json({ message: "Emergencia no encontrada" });
      }
      res.json(emergencia);
    } catch (error) {
      console.error("Error al actualizar emergencia:", error);
      res.status(500).json({ message: "Error al actualizar emergencia" });
    }
  });

  // ============================================================
  // RUTAS DE TAXI
  // ============================================================

  app.get('/api/taxi/viajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const viajes = await storage.getViajesTaxi(userId);
      res.json(viajes);
    } catch (error) {
      console.error("Error al obtener viajes:", error);
      res.status(500).json({ message: "Error al obtener viajes" });
    }
  });

  app.post('/api/taxi/viajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertViajeTaxiSchema.parse(req.body);
      const viaje = await storage.createViajeTaxi({
        ...data,
        pasajeroId: userId,
      });
      res.json(viaje);
    } catch (error: any) {
      console.error("Error al crear viaje:", error);
      res.status(400).json({ message: error.message || "Error al crear viaje" });
    }
  });

  app.patch('/api/taxi/viajes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const viaje = await storage.updateViajeTaxi(id, req.body);
      if (!viaje) {
        return res.status(404).json({ message: "Viaje no encontrado" });
      }
      res.json(viaje);
    } catch (error) {
      console.error("Error al actualizar viaje:", error);
      res.status(500).json({ message: "Error al actualizar viaje" });
    }
  });

  app.get('/api/taxi/conductores', isAuthenticated, async (req, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      const conductores = usuarios.filter(u => u.rol === 'conductor' || u.modoTaxi === 'conductor');
      res.json(conductores.map(c => ({
        id: c.id,
        nombre: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}`.trim() : c.firstName || c.lastName || 'Conductor',
        telefono: c.telefono || '',
        activo: c.estado === 'activo',
        email: c.email,
      })));
    } catch (error) {
      console.error("Error al obtener conductores:", error);
      res.status(500).json({ message: "Error al obtener conductores" });
    }
  });

  // ============================================================
  // RUTAS DE DELIVERY
  // ============================================================

  app.get('/api/delivery/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pedidos = await storage.getPedidosDelivery(userId);
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  });

  app.post('/api/delivery/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPedidoDeliverySchema.parse(req.body);
      const pedido = await storage.createPedidoDelivery({
        ...data,
        usuarioId: userId,
      });
      res.json(pedido);
    } catch (error: any) {
      console.error("Error al crear pedido:", error);
      res.status(400).json({ message: error.message || "Error al crear pedido" });
    }
  });

  app.patch('/api/delivery/pedidos/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await storage.updatePedidoDelivery(id, req.body);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      res.json(pedido);
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      res.status(500).json({ message: "Error al actualizar pedido" });
    }
  });

  // ============================================================
  // RUTAS DE RADIOS ONLINE
  // ============================================================

  app.get('/api/radios-online', async (req, res) => {
    try {
      const radios = await storage.getRadiosOnline();
      res.json(radios);
    } catch (error) {
      console.error("Error al obtener radios:", error);
      res.status(500).json({ message: "Error al obtener radios" });
    }
  });

  app.get('/api/radios-online/predeterminada', async (req, res) => {
    try {
      const radio = await storage.getRadioPredeterminada();
      res.json(radio || null);
    } catch (error) {
      console.error("Error al obtener radio predeterminada:", error);
      res.status(500).json({ message: "Error al obtener radio predeterminada" });
    }
  });

  app.get('/api/radios-online/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const radio = await storage.getRadioOnline(id);
      if (!radio) {
        return res.status(404).json({ message: "Radio no encontrada" });
      }
      res.json(radio);
    } catch (error) {
      console.error("Error al obtener radio:", error);
      res.status(500).json({ message: "Error al obtener radio" });
    }
  });

  app.post('/api/radios-online', isAuthenticated, async (req, res) => {
    try {
      const data = insertRadioOnlineSchema.parse(req.body);
      const radio = await storage.createRadioOnline(data);
      res.status(201).json(radio);
    } catch (error: any) {
      console.error("Error al crear radio:", error);
      res.status(400).json({ message: error.message || "Error al crear radio" });
    }
  });

  app.patch('/api/radios-online/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const radio = await storage.updateRadioOnline(id, req.body);
      if (!radio) {
        return res.status(404).json({ message: "Radio no encontrada" });
      }
      res.json(radio);
    } catch (error: any) {
      console.error("Error al actualizar radio:", error);
      res.status(400).json({ message: error.message || "Error al actualizar radio" });
    }
  });

  app.delete('/api/radios-online/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRadioOnline(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error al eliminar radio:", error);
      res.status(400).json({ message: error.message || "Error al eliminar radio" });
    }
  });

  // ============================================================
  // RUTAS DE LISTAS MP3
  // ============================================================

  app.get('/api/listas-mp3', async (req, res) => {
    try {
      const listas = await storage.getListasMp3();
      res.json(listas);
    } catch (error) {
      console.error("Error al obtener listas MP3:", error);
      res.status(500).json({ message: "Error al obtener listas MP3" });
    }
  });

  app.get('/api/listas-mp3/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lista = await storage.getListaMp3(id);
      if (!lista) {
        return res.status(404).json({ message: "Lista no encontrada" });
      }
      res.json(lista);
    } catch (error) {
      console.error("Error al obtener lista MP3:", error);
      res.status(500).json({ message: "Error al obtener lista MP3" });
    }
  });

  app.post('/api/listas-mp3', isAuthenticated, async (req, res) => {
    try {
      const data = insertListaMp3Schema.parse(req.body);
      const lista = await storage.createListaMp3(data);
      res.status(201).json(lista);
    } catch (error: any) {
      console.error("Error al crear lista MP3:", error);
      res.status(400).json({ message: error.message || "Error al crear lista MP3" });
    }
  });

  app.patch('/api/listas-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lista = await storage.updateListaMp3(id, req.body);
      if (!lista) {
        return res.status(404).json({ message: "Lista no encontrada" });
      }
      res.json(lista);
    } catch (error: any) {
      console.error("Error al actualizar lista MP3:", error);
      res.status(400).json({ message: error.message || "Error al actualizar lista MP3" });
    }
  });

  app.delete('/api/listas-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteListaMp3(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error al eliminar lista MP3:", error);
      res.status(400).json({ message: error.message || "Error al eliminar lista MP3" });
    }
  });

  // ============================================================
  // RUTAS DE ARCHIVOS MP3
  // ============================================================

  app.get('/api/archivos-mp3', async (req, res) => {
    try {
      const { listaId } = req.query;
      let archivos;
      if (listaId) {
        archivos = await storage.getArchivosMp3PorLista(parseInt(listaId as string));
      } else {
        archivos = await storage.getArchivosMp3();
      }
      res.json(archivos);
    } catch (error) {
      console.error("Error al obtener archivos MP3:", error);
      res.status(500).json({ message: "Error al obtener archivos MP3" });
    }
  });

  app.post('/api/archivos-mp3', isAuthenticated, async (req, res) => {
    try {
      const data = insertArchivoMp3Schema.parse(req.body);
      const archivo = await storage.createArchivoMp3(data);
      res.status(201).json(archivo);
    } catch (error: any) {
      console.error("Error al crear archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al crear archivo MP3" });
    }
  });

  app.patch('/api/archivos-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const archivo = await storage.updateArchivoMp3(id, req.body);
      if (!archivo) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }
      res.json(archivo);
    } catch (error: any) {
      console.error("Error al actualizar archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al actualizar archivo MP3" });
    }
  });

  app.delete('/api/archivos-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArchivoMp3(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error al eliminar archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al eliminar archivo MP3" });
    }
  });

  // ============================================================
  // RUTAS DE CONFIGURACIÓN
  // ============================================================

  app.get('/api/configuracion/:clave', async (req, res) => {
    try {
      const { clave } = req.params;
      const config = await storage.getConfiguracion(clave);
      res.json(config || null);
    } catch (error) {
      console.error("Error al obtener configuración:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.post('/api/configuracion', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.setConfiguracion(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      res.status(500).json({ message: "Error al guardar configuración" });
    }
  });

  // Ruta de sugerencias (envío de formulario)
  app.post('/api/sugerencias', async (req, res) => {
    try {
      // TODO: Implementar envío de email con las sugerencias
      console.log("Nueva sugerencia recibida:", req.body);
      res.json({ message: "Sugerencia recibida correctamente" });
    } catch (error) {
      console.error("Error al procesar sugerencia:", error);
      res.status(500).json({ message: "Error al procesar sugerencia" });
    }
  });

  // ============================================================
  // MIGRACIÓN DE DATOS: Backfill miembros_grupo
  // ============================================================
  
  app.post('/api/admin/backfill-miembros', isAuthenticated, async (req: any, res) => {
    try {
      // Solo super_admin puede ejecutar backfill
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      console.log('🔄 Iniciando backfill de miembros_grupo...');
      
      // Obtener todos los grupos con miembros JSON legacy
      const grupos = await storage.getAllGruposConMiembrosLegacy();
      let migrados = 0;
      let errores = 0;
      
      for (const grupo of grupos) {
        try {
          // Migrar miembros del JSON a la tabla normalizada
          if (grupo.miembros && Array.isArray(grupo.miembros)) {
            for (const usuarioId of grupo.miembros) {
              try {
                await storage.agregarMiembroGrupo({
                  grupoId: grupo.id,
                  usuarioId: usuarioId as string,
                  rol: usuarioId === grupo.creadorId ? 'admin' : 'miembro',
                });
                migrados++;
              } catch (error) {
                console.error(`Error al agregar miembro ${usuarioId} al grupo ${grupo.id}:`, error);
                errores++;
              }
            }
          }
        } catch (error) {
          console.error(`Error al procesar grupo ${grupo.id}:`, error);
          errores++;
        }
      }

      console.log(`✅ Backfill completado: ${migrados} miembros migrados, ${errores} errores`);
      res.json({
        success: true,
        migrados,
        errores,
        message: `Backfill completado: ${migrados} miembros migrados`,
      });
    } catch (error) {
      console.error('❌ Error en backfill:', error);
      res.status(500).json({ message: 'Error en backfill' });
    }
  });

  // ============================================================
  // SISTEMA DE REGISTRO POR NIVELES (5 ESTRELLAS)
  // ============================================================

  // Obtener nivel actual del usuario
  app.get('/api/registro/nivel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const nivel = await storage.getNivelRegistro(userId);
      res.json({ nivel });
    } catch (error) {
      console.error("Error al obtener nivel de registro:", error);
      res.status(500).json({ message: "Error al obtener nivel de registro" });
    }
  });

  // NIVEL 1: Registro Básico
  app.get('/api/registro/basico', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroBasico(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro básico:", error);
      res.status(500).json({ message: "Error al obtener registro básico" });
    }
  });

  app.post('/api/registro/basico', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertRegistroBasicoSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroBasico(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro básico:", error);
      res.status(400).json({ message: error.message || "Error al crear registro básico" });
    }
  });

  // NIVEL 2: Servicio Chat
  app.get('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroChat(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro chat:", error);
      res.status(500).json({ message: "Error al obtener registro chat" });
    }
  });

  app.post('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 1 exactamente (verificar existencia de registro_basico)
      const registroBasico = await storage.getRegistroBasico(userId);
      if (!registroBasico) {
        return res.status(400).json({ message: "Debe completar el nivel 1 (registro básico) primero" });
      }
      
      const data = insertRegistroChatSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroChat(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro chat:", error);
      res.status(400).json({ message: error.message || "Error al crear registro chat" });
    }
  });

  app.patch('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroChat(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro chat:", error);
      res.status(500).json({ message: "Error al actualizar registro chat" });
    }
  });

  // NIVEL 3: Ubicación
  app.get('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroUbicacion(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro ubicación:", error);
      res.status(500).json({ message: "Error al obtener registro ubicación" });
    }
  });

  app.post('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 2 exactamente (verificar existencia de registro_chat)
      const registroChat = await storage.getRegistroChat(userId);
      if (!registroChat) {
        return res.status(400).json({ message: "Debe completar el nivel 2 (registro chat) primero" });
      }
      
      const data = insertRegistroUbicacionSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroUbicacion(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro ubicación:", error);
      res.status(400).json({ message: error.message || "Error al crear registro ubicación" });
    }
  });

  app.patch('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroUbicacion(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro ubicación:", error);
      res.status(500).json({ message: "Error al actualizar registro ubicación" });
    }
  });

  // NIVEL 4: Dirección
  app.get('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroDireccion(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro dirección:", error);
      res.status(500).json({ message: "Error al obtener registro dirección" });
    }
  });

  app.post('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 3 exactamente (verificar existencia de registro_ubicacion)
      const registroUbicacion = await storage.getRegistroUbicacion(userId);
      if (!registroUbicacion) {
        return res.status(400).json({ message: "Debe completar el nivel 3 (registro ubicación) primero" });
      }
      
      const data = insertRegistroDireccionSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroDireccion(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro dirección:", error);
      res.status(400).json({ message: error.message || "Error al crear registro dirección" });
    }
  });

  app.patch('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroDireccion(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro dirección:", error);
      res.status(500).json({ message: "Error al actualizar registro dirección" });
    }
  });

  // NIVEL 5: Marketplace
  app.get('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroMarketplace(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro marketplace:", error);
      res.status(500).json({ message: "Error al obtener registro marketplace" });
    }
  });

  app.post('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 4 exactamente (verificar existencia de registro_direccion)
      const registroDireccion = await storage.getRegistroDireccion(userId);
      if (!registroDireccion) {
        return res.status(400).json({ message: "Debe completar el nivel 4 (registro dirección) primero" });
      }
      
      const data = insertRegistroMarketplaceSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroMarketplace(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro marketplace:", error);
      res.status(400).json({ message: error.message || "Error al crear registro marketplace" });
    }
  });

  app.patch('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroMarketplace(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro marketplace:", error);
      res.status(500).json({ message: "Error al actualizar registro marketplace" });
    }
  });

  // CREDENCIALES DE CONDUCTOR
  app.get('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credenciales = await storage.getCredencialesConductor(userId);
      res.json(credenciales || {});
    } catch (error) {
      console.error("Error al obtener credenciales conductor:", error);
      res.status(500).json({ message: "Error al obtener credenciales conductor" });
    }
  });

  app.post('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertCredencialesConductorSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const credenciales = await storage.createCredencialesConductor(data);
      res.json(credenciales);
    } catch (error: any) {
      console.error("Error al crear credenciales conductor:", error);
      res.status(400).json({ message: error.message || "Error al crear credenciales conductor" });
    }
  });

  app.patch('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credenciales = await storage.updateCredencialesConductor(userId, req.body);
      if (!credenciales) {
        return res.status(404).json({ message: "Credenciales no encontradas" });
      }
      res.json(credenciales);
    } catch (error) {
      console.error("Error al actualizar credenciales conductor:", error);
      res.status(500).json({ message: "Error al actualizar credenciales conductor" });
    }
  });

  // ============================================================
  // ENCUESTAS
  // ============================================================

  app.get('/api/encuestas', async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      res.json(encuestas);
    } catch (error) {
      console.error("Error al obtener encuestas:", error);
      res.status(500).json({ message: "Error al obtener encuestas" });
    }
  });

  app.get('/api/encuestas/activas', async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      const ahora = new Date();
      const activas = encuestas.filter(e => {
        if (e.estado !== 'activa') return false;
        const inicioValido = !e.fechaInicio || new Date(e.fechaInicio) <= ahora;
        const finValido = !e.fechaFin || new Date(e.fechaFin) >= ahora;
        return inicioValido && finValido;
      });
      res.json(activas);
    } catch (error) {
      console.error("Error al obtener encuestas activas:", error);
      res.status(500).json({ message: "Error al obtener encuestas activas" });
    }
  });

  app.get('/api/encuestas/:id', async (req, res) => {
    try {
      const encuesta = await storage.getEncuesta(req.params.id);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error) {
      console.error("Error al obtener encuesta:", error);
      res.status(500).json({ message: "Error al obtener encuesta" });
    }
  });

  app.get('/api/encuestas/:id/resultados', async (req, res) => {
    try {
      const encuesta = await storage.getEncuesta(req.params.id);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      const resultados = await storage.getResultadosEncuesta(req.params.id);
      res.json({ encuesta, resultados });
    } catch (error) {
      console.error("Error al obtener resultados:", error);
      res.status(500).json({ message: "Error al obtener resultados" });
    }
  });

  app.post('/api/encuestas', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        usuarioId: userId,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
      };
      const encuesta = await storage.createEncuesta(data);
      res.json(encuesta);
    } catch (error: any) {
      console.error("Error al crear encuesta:", error);
      res.status(400).json({ message: error.message || "Error al crear encuesta" });
    }
  });

  app.patch('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
      };
      const encuesta = await storage.updateEncuesta(req.params.id, data);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error: any) {
      console.error("Error al actualizar encuesta:", error);
      res.status(400).json({ message: error.message || "Error al actualizar encuesta" });
    }
  });

  app.delete('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteEncuesta(req.params.id);
      res.json({ message: "Encuesta eliminada" });
    } catch (error) {
      console.error("Error al eliminar encuesta:", error);
      res.status(500).json({ message: "Error al eliminar encuesta" });
    }
  });

  app.post('/api/encuestas/:id/responder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const encuestaId = req.params.id;
      
      const yaRespondio = await storage.verificarRespuestaUsuario(encuestaId, userId);
      if (yaRespondio) {
        return res.status(400).json({ message: "Ya has respondido esta encuesta" });
      }

      const respuesta = await storage.createRespuestaEncuesta({
        encuestaId,
        usuarioId: userId,
        respuestas: req.body.respuestas,
      });
      res.json(respuesta);
    } catch (error: any) {
      console.error("Error al responder encuesta:", error);
      res.status(400).json({ message: error.message || "Error al responder encuesta" });
    }
  });

  // ============================================================
  // POPUPS PUBLICITARIOS
  // ============================================================

  app.get('/api/popups', async (req, res) => {
    try {
      const popups = await storage.getPopups();
      res.json(popups);
    } catch (error) {
      console.error("Error al obtener popups:", error);
      res.status(500).json({ message: "Error al obtener popups" });
    }
  });

  app.get('/api/popups/activos', async (req, res) => {
    try {
      const popups = await storage.getPopupsActivos();
      res.json(popups);
    } catch (error) {
      console.error("Error al obtener popups activos:", error);
      res.status(500).json({ message: "Error al obtener popups activos" });
    }
  });

  app.get('/api/popups/:id', async (req, res) => {
    try {
      const popup = await storage.getPopup(req.params.id);
      if (!popup) {
        return res.status(404).json({ message: "Popup no encontrado" });
      }
      res.json(popup);
    } catch (error) {
      console.error("Error al obtener popup:", error);
      res.status(500).json({ message: "Error al obtener popup" });
    }
  });

  app.post('/api/popups', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        usuarioId: userId,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
      };
      const popup = await storage.createPopup(data);
      res.json(popup);
    } catch (error: any) {
      console.error("Error al crear popup:", error);
      res.status(400).json({ message: error.message || "Error al crear popup" });
    }
  });

  app.patch('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
      };
      const popup = await storage.updatePopup(req.params.id, data);
      if (!popup) {
        return res.status(404).json({ message: "Popup no encontrado" });
      }
      res.json(popup);
    } catch (error: any) {
      console.error("Error al actualizar popup:", error);
      res.status(400).json({ message: error.message || "Error al actualizar popup" });
    }
  });

  app.delete('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deletePopup(req.params.id);
      res.json({ message: "Popup eliminado" });
    } catch (error) {
      console.error("Error al eliminar popup:", error);
      res.status(500).json({ message: "Error al eliminar popup" });
    }
  });

  app.post('/api/popups/:id/vista', async (req, res) => {
    try {
      await storage.incrementarVistasPopup(req.params.id);
      res.json({ message: "Vista registrada" });
    } catch (error) {
      console.error("Error al registrar vista:", error);
      res.status(500).json({ message: "Error al registrar vista" });
    }
  });

  // ============================================================
  // INTERACCIONES SOCIALES (likes, favoritos, compartir, calendario)
  // ============================================================

  app.get('/api/interacciones/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const contadores = await storage.getContadoresInteracciones(tipoContenido, contenidoId);
      res.json(contadores);
    } catch (error) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  app.post('/api/interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, tipoInteraccion, valor } = req.body;
      
      const yaExiste = await storage.verificarInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
      if (yaExiste) {
        await storage.deleteInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
        return res.json({ message: "Interacción eliminada", accion: "eliminada" });
      }

      const interaccion = await storage.createInteraccion({
        tipoContenido,
        contenidoId,
        usuarioId: userId,
        tipoInteraccion,
        valor,
      });
      res.json({ ...interaccion, accion: "creada" });
    } catch (error: any) {
      console.error("Error al crear interacción:", error);
      res.status(400).json({ message: error.message || "Error al crear interacción" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId/usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId } = req.params;
      
      const tipos = ['like', 'favorito', 'compartir', 'calendario'];
      const interacciones: { [key: string]: boolean } = {};
      
      for (const tipo of tipos) {
        interacciones[tipo] = await storage.verificarInteraccion(userId, tipoContenido, contenidoId, tipo);
      }
      
      res.json(interacciones);
    } catch (error) {
      console.error("Error al verificar interacciones:", error);
      res.status(500).json({ message: "Error al verificar interacciones" });
    }
  });

  // ============================================================
  // COMENTARIOS
  // ============================================================

  app.get('/api/comentarios/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const comentarios = await storage.getComentarios(tipoContenido, contenidoId);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  app.post('/api/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, texto } = req.body;
      
      const comentario = await storage.createComentario({
        tipoContenido,
        contenidoId,
        usuarioId: userId,
        texto,
      });
      res.json(comentario);
    } catch (error: any) {
      console.error("Error al crear comentario:", error);
      res.status(400).json({ message: error.message || "Error al crear comentario" });
    }
  });

  app.delete('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteComentario(req.params.id);
      res.json({ message: "Comentario eliminado" });
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // ============================================================
  // CATEGORÍAS DE SERVICIOS LOCALES
  // ============================================================

  app.get('/api/categorias-servicio', async (req, res) => {
    try {
      const categorias = await storage.getCategoriasServicio();
      res.json(categorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  });

  app.get('/api/categorias-servicio/:id', async (req, res) => {
    try {
      const categoria = await storage.getCategoriaServicio(req.params.id);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error) {
      console.error("Error al obtener categoría:", error);
      res.status(500).json({ message: "Error al obtener categoría" });
    }
  });

  app.post('/api/categorias-servicio', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.createCategoriaServicio(req.body);
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      res.status(400).json({ message: error.message || "Error al crear categoría" });
    }
  });

  app.patch('/api/categorias-servicio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.updateCategoriaServicio(req.params.id, req.body);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al actualizar categoría:", error);
      res.status(400).json({ message: error.message || "Error al actualizar categoría" });
    }
  });

  app.delete('/api/categorias-servicio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteCategoriaServicio(req.params.id);
      res.json({ message: "Categoría eliminada" });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ message: "Error al eliminar categoría" });
    }
  });

  // ============================================================
  // LOGOS DE SERVICIOS (Negocios/Locales)
  // ============================================================

  app.get('/api/logos-servicio', async (req, res) => {
    try {
      const { categoriaId, estado } = req.query;
      const logos = await storage.getLogosServicio(categoriaId as string, estado as string);
      res.json(logos);
    } catch (error) {
      console.error("Error al obtener logos:", error);
      res.status(500).json({ message: "Error al obtener logos" });
    }
  });

  app.get('/api/logos-servicio/:id', async (req, res) => {
    try {
      const logo = await storage.getLogoServicio(req.params.id);
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      res.json(logo);
    } catch (error) {
      console.error("Error al obtener logo:", error);
      res.status(500).json({ message: "Error al obtener logo" });
    }
  });

  app.get('/api/logos-servicio/usuario/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const logos = await storage.getLogosServicioPorUsuario(req.params.usuarioId);
      res.json(logos);
    } catch (error) {
      console.error("Error al obtener logos del usuario:", error);
      res.status(500).json({ message: "Error al obtener logos del usuario" });
    }
  });

  app.post('/api/logos-servicio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body, usuarioId: userId };
      const logo = await storage.createLogoServicio(data);
      res.json(logo);
    } catch (error: any) {
      console.error("Error al crear logo:", error);
      res.status(400).json({ message: error.message || "Error al crear logo" });
    }
  });

  app.patch('/api/logos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const logo = await storage.getLogoServicio(req.params.id);
      
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para modificar este logo" });
      }
      
      const updatedLogo = await storage.updateLogoServicio(req.params.id, req.body);
      res.json(updatedLogo);
    } catch (error: any) {
      console.error("Error al actualizar logo:", error);
      res.status(400).json({ message: error.message || "Error al actualizar logo" });
    }
  });

  app.delete('/api/logos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const logo = await storage.getLogoServicio(req.params.id);
      
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      
      const esSuperAdmin = userRoles.includes('super_admin');
      
      if (!esSuperAdmin) {
        return res.status(403).json({ message: "Solo el super administrador puede eliminar logos" });
      }
      
      await storage.deleteLogoServicio(req.params.id);
      res.json({ message: "Logo eliminado" });
    } catch (error) {
      console.error("Error al eliminar logo:", error);
      res.status(500).json({ message: "Error al eliminar logo" });
    }
  });

  // ============================================================
  // PRODUCTOS DE SERVICIOS LOCALES
  // ============================================================

  app.get('/api/productos-servicio', async (req, res) => {
    try {
      const { logoServicioId, categoria, disponible } = req.query;
      const productos = await storage.getProductosServicio(
        logoServicioId as string, 
        categoria as string, 
        disponible === 'true'
      );
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.get('/api/productos-servicio/:id', async (req, res) => {
    try {
      const producto = await storage.getProductoServicio(req.params.id);
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(producto);
    } catch (error) {
      console.error("Error al obtener producto:", error);
      res.status(500).json({ message: "Error al obtener producto" });
    }
  });

  app.get('/api/logos-servicio/:logoId/productos', async (req, res) => {
    try {
      const productos = await storage.getProductosPorLogo(req.params.logoId);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos del logo:", error);
      res.status(500).json({ message: "Error al obtener productos del logo" });
    }
  });

  app.post('/api/productos-servicio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { logoServicioId } = req.body;
      
      const logo = await storage.getLogoServicio(logoServicioId);
      if (!logo) {
        return res.status(404).json({ message: "Logo de servicio no encontrado" });
      }
      
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para agregar productos a este servicio" });
      }
      
      const resultado = await storage.createProductoServicioConCobro(req.body, userId, esSuperAdmin);
      res.json(resultado);
    } catch (error: any) {
      console.error("Error al crear producto:", error);
      res.status(400).json({ message: error.message || "Error al crear producto" });
    }
  });

  app.patch('/api/productos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const producto = await storage.getProductoServicio(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      const logo = await storage.getLogoServicio(producto.logoServicioId);
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo?.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
      }
      
      const updatedProducto = await storage.updateProductoServicio(req.params.id, req.body);
      res.json(updatedProducto);
    } catch (error: any) {
      console.error("Error al actualizar producto:", error);
      res.status(400).json({ message: error.message || "Error al actualizar producto" });
    }
  });

  app.delete('/api/productos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const producto = await storage.getProductoServicio(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      const logo = await storage.getLogoServicio(producto.logoServicioId);
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo?.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
      }
      
      await storage.deleteProductoServicio(req.params.id);
      res.json({ message: "Producto eliminado" });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(500).json({ message: "Error al eliminar producto" });
    }
  });

  // ============================================================
  // INTERACCIONES SOCIALES (likes, favoritos, compartir)
  // ============================================================

  app.post('/api/interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, tipoInteraccion } = req.body;
      
      if (!tipoContenido || !contenidoId || !tipoInteraccion) {
        return res.status(400).json({ message: "Faltan campos requeridos" });
      }

      const interaccion = await storage.toggleInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
      res.json(interaccion);
    } catch (error: any) {
      console.error("Error en interacción:", error);
      res.status(400).json({ message: error.message || "Error en interacción" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const stats = await storage.getInteraccionesStats(tipoContenido, contenidoId);
      res.json(stats);
    } catch (error) {
      console.error("Error al obtener stats:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId/usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId } = req.params;
      const interacciones = await storage.getInteraccionesUsuario(userId, tipoContenido, contenidoId);
      res.json(interacciones);
    } catch (error) {
      console.error("Error al obtener interacciones del usuario:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  // ============================================================
  // COMENTARIOS
  // ============================================================

  app.get('/api/comentarios/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const comentarios = await storage.getComentarios(tipoContenido, contenidoId);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  app.post('/api/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, texto } = req.body;
      
      if (!tipoContenido || !contenidoId || !texto) {
        return res.status(400).json({ message: "Faltan campos requeridos" });
      }

      const comentario = await storage.createComentario({
        usuarioId: userId,
        tipoContenido,
        contenidoId,
        texto,
      });
      res.json(comentario);
    } catch (error: any) {
      console.error("Error al crear comentario:", error);
      res.status(400).json({ message: error.message || "Error al crear comentario" });
    }
  });

  app.patch('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const comentario = await storage.getComentario(req.params.id);
      if (!comentario) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      
      if (!esSuperAdmin && comentario.usuarioId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para editar este comentario" });
      }
      
      const { texto } = req.body;
      if (!texto) {
        return res.status(400).json({ message: "El texto es requerido" });
      }
      
      const actualizado = await storage.updateComentario(req.params.id, { texto });
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar comentario:", error);
      res.status(400).json({ message: error.message || "Error al actualizar comentario" });
    }
  });

  app.delete('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const comentario = await storage.getComentario(req.params.id);
      if (!comentario) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      
      if (!esSuperAdmin && comentario.usuarioId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este comentario" });
      }
      
      await storage.deleteComentario(req.params.id);
      res.json({ message: "Comentario eliminado" });
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // ============================================================
  // FAVORITOS DEL USUARIO
  // ============================================================

  app.get('/api/favoritos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipo } = req.query;
      const favoritos = await storage.getFavoritosUsuario(userId, tipo as string);
      res.json(favoritos);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ message: "Error al obtener favoritos" });
    }
  });

  // ============================================================
  // SISTEMA DE CARTERA Y SALDOS
  // ============================================================

  // --- MÉTODOS DE PAGO ---
  
  // Obtener métodos de pago (plataforma o de un usuario)
  app.get('/api/metodos-pago', isAuthenticated, async (req: any, res) => {
    try {
      const { esPlataforma, usuarioId } = req.query;
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      // Si busca métodos de plataforma, cualquiera puede verlos
      if (esPlataforma === 'true') {
        const metodos = await storage.getMetodosPago(undefined, true);
        return res.json(metodos);
      }
      
      // Si es super admin, puede ver de cualquier usuario
      if (esSuperAdmin && usuarioId) {
        const metodos = await storage.getMetodosPago(usuarioId as string);
        return res.json(metodos);
      }
      
      // Usuario normal solo ve sus propios métodos
      const metodos = await storage.getMetodosPago(userId);
      res.json(metodos);
    } catch (error) {
      console.error("Error al obtener métodos de pago:", error);
      res.status(500).json({ message: "Error al obtener métodos de pago" });
    }
  });

  // Crear método de pago
  app.post('/api/metodos-pago', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const data = req.body;
      
      // Solo super admin puede crear métodos de plataforma
      if (data.esPlataforma && !esSuperAdmin) {
        return res.status(403).json({ message: "No autorizado para crear métodos de plataforma" });
      }
      
      // Si no es método de plataforma, asignar al usuario actual
      if (!data.esPlataforma) {
        data.usuarioId = userId;
      }
      
      const metodo = await storage.createMetodoPago(data);
      res.status(201).json(metodo);
    } catch (error) {
      console.error("Error al crear método de pago:", error);
      res.status(500).json({ message: "Error al crear método de pago" });
    }
  });

  // Actualizar método de pago
  app.patch('/api/metodos-pago/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const metodo = await storage.getMetodoPago(req.params.id);
      if (!metodo) {
        return res.status(404).json({ message: "Método de pago no encontrado" });
      }
      
      // Verificar permisos
      if (!esSuperAdmin && metodo.usuarioId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      const actualizado = await storage.updateMetodoPago(req.params.id, req.body);
      res.json(actualizado);
    } catch (error) {
      console.error("Error al actualizar método de pago:", error);
      res.status(500).json({ message: "Error al actualizar método de pago" });
    }
  });

  // Eliminar método de pago
  app.delete('/api/metodos-pago/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const metodo = await storage.getMetodoPago(req.params.id);
      if (!metodo) {
        return res.status(404).json({ message: "Método de pago no encontrado" });
      }
      
      // Verificar permisos
      if (!esSuperAdmin && metodo.usuarioId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      await storage.deleteMetodoPago(req.params.id);
      res.json({ message: "Método de pago eliminado" });
    } catch (error) {
      console.error("Error al eliminar método de pago:", error);
      res.status(500).json({ message: "Error al eliminar método de pago" });
    }
  });

  // --- MONEDAS Y TIPOS DE CAMBIO ---
  
  // Obtener todas las monedas
  app.get('/api/monedas', async (req, res) => {
    try {
      const monedas = await storage.getMonedas();
      res.json(monedas);
    } catch (error) {
      console.error("Error al obtener monedas:", error);
      res.status(500).json({ message: "Error al obtener monedas" });
    }
  });

  // Crear moneda (solo super admin)
  app.post('/api/monedas', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const moneda = await storage.createMoneda(req.body);
      res.status(201).json(moneda);
    } catch (error) {
      console.error("Error al crear moneda:", error);
      res.status(500).json({ message: "Error al crear moneda" });
    }
  });

  // Actualizar moneda (solo super admin)
  app.patch('/api/monedas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const actualizada = await storage.updateMoneda(req.params.id, req.body);
      if (!actualizada) {
        return res.status(404).json({ message: "Moneda no encontrada" });
      }
      res.json(actualizada);
    } catch (error) {
      console.error("Error al actualizar moneda:", error);
      res.status(500).json({ message: "Error al actualizar moneda" });
    }
  });

  // Eliminar moneda (solo super admin)
  app.delete('/api/monedas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteMoneda(req.params.id);
      res.json({ message: "Moneda eliminada" });
    } catch (error) {
      console.error("Error al eliminar moneda:", error);
      res.status(500).json({ message: "Error al eliminar moneda" });
    }
  });

  // --- SALDOS DE USUARIOS ---
  
  // Obtener saldo del usuario actual
  app.get('/api/saldos/mi-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let saldo = await storage.getSaldoUsuario(userId);
      
      // Si no existe, crear con saldo 0
      if (!saldo) {
        saldo = await storage.upsertSaldoUsuario({
          usuarioId: userId,
          saldo: "0",
          monedaPreferida: "PEN",
          totalIngresos: "0",
          totalEgresos: "0",
        });
      }
      
      res.json(saldo);
    } catch (error) {
      console.error("Error al obtener saldo:", error);
      res.status(500).json({ message: "Error al obtener saldo" });
    }
  });

  // Obtener todos los saldos (solo super admin)
  app.get('/api/saldos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const saldos = await storage.getAllSaldosUsuarios();
      res.json(saldos);
    } catch (error) {
      console.error("Error al obtener saldos:", error);
      res.status(500).json({ message: "Error al obtener saldos" });
    }
  });

  // Obtener saldo de un usuario específico (solo super admin)
  app.get('/api/saldos/:usuarioId', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const saldo = await storage.getSaldoUsuario(req.params.usuarioId);
      if (!saldo) {
        return res.status(404).json({ message: "Saldo no encontrado" });
      }
      res.json(saldo);
    } catch (error) {
      console.error("Error al obtener saldo del usuario:", error);
      res.status(500).json({ message: "Error al obtener saldo del usuario" });
    }
  });

  // --- SOLICITUDES DE SALDO (Recargas y Retiros) ---
  
  // Obtener solicitudes (super admin ve todas, usuario ve las suyas)
  app.get('/api/solicitudes-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const { estado } = req.query;
      
      if (esSuperAdmin) {
        const solicitudes = await storage.getSolicitudesSaldo(estado as string);
        res.json(solicitudes);
      } else {
        const solicitudes = await storage.getSolicitudesSaldoPorUsuario(userId);
        res.json(solicitudes);
      }
    } catch (error) {
      console.error("Error al obtener solicitudes de saldo:", error);
      res.status(500).json({ message: "Error al obtener solicitudes" });
    }
  });

  // Crear solicitud de recarga o retiro
  app.post('/api/solicitudes-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipo, monto, metodoPagoId, numeroOperacion, comprobante, notas } = req.body;
      
      if (!tipo || !monto) {
        return res.status(400).json({ message: "Tipo y monto son requeridos" });
      }
      
      // Validar que el monto sea positivo
      if (parseFloat(monto) <= 0) {
        return res.status(400).json({ message: "El monto debe ser mayor a 0" });
      }
      
      // Para retiros, verificar que tenga saldo suficiente
      if (tipo === 'retiro') {
        const saldo = await storage.getSaldoUsuario(userId);
        if (!saldo || parseFloat(saldo.saldo) < parseFloat(monto)) {
          return res.status(400).json({ message: "Saldo insuficiente" });
        }
      }
      
      const solicitud = await storage.createSolicitudSaldo({
        usuarioId: userId,
        tipo,
        monto,
        metodoPagoId,
        numeroOperacion,
        comprobante,
        notas,
        estado: 'pendiente',
      });
      
      res.status(201).json(solicitud);
    } catch (error) {
      console.error("Error al crear solicitud de saldo:", error);
      res.status(500).json({ message: "Error al crear solicitud" });
    }
  });

  // Aprobar solicitud (solo super admin)
  app.post('/api/solicitudes-saldo/:id/aprobar', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const solicitud = await storage.aprobarSolicitudSaldo(req.params.id, adminId);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      res.json(solicitud);
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      res.status(500).json({ message: "Error al aprobar solicitud" });
    }
  });

  // Rechazar solicitud (solo super admin)
  app.post('/api/solicitudes-saldo/:id/rechazar', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { motivoRechazo } = req.body;
      
      if (!motivoRechazo) {
        return res.status(400).json({ message: "Motivo de rechazo es requerido" });
      }
      
      const solicitud = await storage.rechazarSolicitudSaldo(req.params.id, motivoRechazo);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      res.json(solicitud);
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      res.status(500).json({ message: "Error al rechazar solicitud" });
    }
  });

  // --- TRANSACCIONES DE SALDO ---
  
  // Obtener transacciones (super admin ve todas, usuario ve las suyas)
  app.get('/api/transacciones-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      if (esSuperAdmin) {
        const transacciones = await storage.getTransaccionesSaldo();
        res.json(transacciones);
      } else {
        const transacciones = await storage.getTransaccionesSaldo(userId);
        res.json(transacciones);
      }
    } catch (error) {
      console.error("Error al obtener transacciones:", error);
      res.status(500).json({ message: "Error al obtener transacciones" });
    }
  });

  // Obtener transacciones de un usuario específico (solo super admin)
  app.get('/api/transacciones-saldo/usuario/:usuarioId', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const transacciones = await storage.getTransaccionesSaldo(req.params.usuarioId);
      res.json(transacciones);
    } catch (error) {
      console.error("Error al obtener transacciones del usuario:", error);
      res.status(500).json({ message: "Error al obtener transacciones del usuario" });
    }
  });

  // --- CONFIGURACIÓN DE SALDOS (Tarifas y comisiones) ---
  
  // Obtener todas las configuraciones de tarifas
  app.get('/api/configuracion-saldos', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getConfiguracionesSaldos();
      res.json(config);
    } catch (error) {
      console.error("Error al obtener configuración de saldos:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  // Actualizar o crear configuración de tarifa (solo super admin)
  app.post('/api/configuracion-saldos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const config = await storage.upsertConfiguracionSaldo(req.body);
      res.json(config);
    } catch (error: any) {
      console.error("Error al actualizar configuración de saldos:", error);
      res.status(400).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  // ============================================================
  // CONFIGURACIÓN DE WEBSOCKET
  // ============================================================

  const httpServer = createServer(app);
  
  // Configurar WebSocket con rooms y persistencia
  const { setupWebSocket } = await import('./websocket');
  setupWebSocket(httpServer);

  return httpServer;
}
