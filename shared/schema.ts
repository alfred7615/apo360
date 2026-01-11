import { pgTable, varchar, serial, text, integer, decimal, real, boolean, timestamp, json, date, pgEnum, unique, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================
// PAÍSES Y CIUDADES (Multi-tenancy geográfico)
// ============================================================
export const paises = pgTable("paises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  codigoIso: varchar("codigo_iso", { length: 3 }),
  bandera: varchar("bandera", { length: 10 }), // Emoji o URL
  activo: boolean("activo").default(true),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPaisSchema = createInsertSchema(paises).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPais = z.infer<typeof insertPaisSchema>;
export type Pais = typeof paises.$inferSelect;

export const ciudades = pgTable("ciudades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paisId: varchar("pais_id").references(() => paises.id).notNull(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }), // URL amigable: "tacna", "moquegua"
  departamento: varchar("departamento", { length: 100 }), // Para Perú: departamento
  region: varchar("region", { length: 100 }), // Para Chile: región
  latitud: real("latitud"),
  longitud: real("longitud"),
  zonaHoraria: varchar("zona_horaria", { length: 50 }),
  activo: boolean("activo").default(true),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCiudadSchema = createInsertSchema(ciudades).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCiudad = z.infer<typeof insertCiudadSchema>;
export type Ciudad = typeof ciudades.$inferSelect;

// ============================================================
// MEDIA DE CIUDADES (Imágenes y Videos por Ciudad)
// ============================================================
// Tipo para configuración de recorte de imagen
// Valores de react-easy-crop: offsetX/offsetY son porcentajes del tamaño del media
export type CropConfig = {
  zoom: number;      // Factor de zoom (1 = sin zoom, >1 = acercado)
  offsetX: number;   // Desplazamiento horizontal (porcentaje del media, valor de crop.x de react-easy-crop)
  offsetY: number;   // Desplazamiento vertical (porcentaje del media, valor de crop.y de react-easy-crop)
};

export const mediaCiudades = pgTable("media_ciudades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id").references(() => ciudades.id).notNull(),
  tipo: varchar("tipo", { length: 20 }).notNull(), // "imagen" | "video"
  url: varchar("url").notNull(),
  titulo: varchar("titulo", { length: 200 }),
  descripcion: text("descripcion"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  estado: varchar("estado", { length: 20 }).default("activo"), // "activo" | "pausado" | "suspendido"
  orden: integer("orden").default(0),
  // Configuración de recorte por dispositivo
  cropConfigDesktop: json("crop_config_desktop").$type<CropConfig>(),  // PC (16:9)
  cropConfigTablet: json("crop_config_tablet").$type<CropConfig>(),    // Tablet (4:3)
  cropConfigMobile: json("crop_config_mobile").$type<CropConfig>(),    // Móvil (1:1)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMediaCiudadSchema = createInsertSchema(mediaCiudades).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMediaCiudad = z.infer<typeof insertMediaCiudadSchema>;
export type MediaCiudad = typeof mediaCiudades.$inferSelect;

// ============================================================
// USUARIOS Y ROLES
// ============================================================
export const rolesEnum = pgEnum("rol", [
  "super_admin",
  "admin_publicidad",
  "admin_radio",
  "admin_cartera",
  "admin_operaciones",
  "supervisor",
  "usuario",
  "conductor",
  "local",
  "serenazgo",
  "policia",
  "samu",
  "bombero",
  "cambista",
]);

export const usuarios = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  telefono: varchar("telefono", { length: 20 }),
  imeiDispositivo: varchar("imei_dispositivo", { length: 20 }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  rol: varchar("rol", { length: 50 }).default("usuario").notNull(),
  estado: varchar("estado", { length: 20 }).default("activo"),
  latitud: real("latitud"),
  longitud: real("longitud"),
  enLinea: boolean("en_linea").default(false),
  ultimaConexion: timestamp("ultima_conexion"),
  modoTaxi: varchar("modo_taxi", { length: 20 }).default("pasajero"),
  vehiculoModelo: varchar("vehiculo_modelo"),
  vehiculoPlaca: varchar("vehiculo_placa"),
  disponibleTaxi: boolean("disponible_taxi").default(false),
  nombreLocal: varchar("nombre_local"),
  categoriaLocal: varchar("categoria_local"),
  direccionLocal: text("direccion_local"),
  logoLocal: varchar("logo_local"),
  descripcionLocal: text("descripcion_local"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  nivelUsuario: integer("nivel_usuario").default(1),
  alias: varchar("alias", { length: 100 }),
  dni: varchar("dni", { length: 20 }),
  dniImagenFrente: varchar("dni_imagen_frente"),
  dniImagenPosterior: varchar("dni_imagen_posterior"),
  dniEmision: date("dni_emision"),
  dniCaducidad: date("dni_caducidad"),
  
  pais: varchar("pais", { length: 100 }),
  departamento: varchar("departamento", { length: 100 }),
  distrito: varchar("distrito", { length: 100 }),
  sector: varchar("sector", { length: 100 }),
  
  direccion: text("direccion"),
  manzanaLote: varchar("manzana_lote", { length: 50 }),
  avenidaCalle: varchar("avenida_calle", { length: 200 }),
  gpsLatitud: real("gps_latitud"),
  gpsLongitud: real("gps_longitud"),
  
  ruc: varchar("ruc", { length: 20 }),
  gpsLocalLatitud: real("gps_local_latitud"),
  gpsLocalLongitud: real("gps_local_longitud"),
  
  breveteImagenFrente: varchar("brevete_imagen_frente"),
  breveteImagenPosterior: varchar("brevete_imagen_posterior"),
  breveteEmision: date("brevete_emision"),
  breveteCaducidad: date("brevete_caducidad"),
  
  soatImagenFrente: varchar("soat_imagen_frente"),
  soatImagenPosterior: varchar("soat_imagen_posterior"),
  soatEmision: date("soat_emision"),
  soatCaducidad: date("soat_caducidad"),
  
  revisionTecnicaImagenFrente: varchar("revision_tecnica_imagen_frente"),
  revisionTecnicaImagenPosterior: varchar("revision_tecnica_imagen_posterior"),
  revisionTecnicaEmision: date("revision_tecnica_emision"),
  revisionTecnicaCaducidad: date("revision_tecnica_caducidad"),
  
  credencialConductorImagenFrente: varchar("credencial_conductor_imagen_frente"),
  credencialConductorImagenPosterior: varchar("credencial_conductor_imagen_posterior"),
  credencialConductorEmision: date("credencial_conductor_emision"),
  credencialConductorCaducidad: date("credencial_conductor_caducidad"),
  
  credencialTaxiImagenFrente: varchar("credencial_taxi_imagen_frente"),
  credencialTaxiImagenPosterior: varchar("credencial_taxi_imagen_posterior"),
  credencialTaxiEmision: date("credencial_taxi_emision"),
  credencialTaxiCaducidad: date("credencial_taxi_caducidad"),
  
  tipoVehiculo: varchar("tipo_vehiculo", { length: 50 }),
  vehiculoFotoFrente: varchar("vehiculo_foto_frente"),
  vehiculoFotoPosterior: varchar("vehiculo_foto_posterior"),
  vehiculoFotoLateralIzq: varchar("vehiculo_foto_lateral_izq"),
  vehiculoFotoLateralDer: varchar("vehiculo_foto_lateral_der"),
  
  fotoDomicilio: varchar("foto_domicilio"),
  
  passwordHash: varchar("password_hash"),
  requiereCambioContrasena: boolean("requiere_cambio_contrasena").default(false),
  
  motivoSuspension: text("motivo_suspension"),
  fechaSuspension: timestamp("fecha_suspension"),
  motivoBloqueo: text("motivo_bloqueo"),
  fechaBloqueo: timestamp("fecha_bloqueo"),
  
  localFoto1: varchar("local_foto_1"),
  localFoto2: varchar("local_foto_2"),
  localFoto3: varchar("local_foto_3"),
  localFoto4: varchar("local_foto_4"),
  localVideo1: varchar("local_video_1"),
  localVideo2: varchar("local_video_2"),
  
  // Ubicación activa seleccionada por el usuario (para ver contenido de esa ciudad)
  paisIdActual: varchar("pais_id_actual"),
  ciudadIdActual: varchar("ciudad_id_actual"),
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// ============================================================
// SECTORES (historial para autocompletado)
// ============================================================
export const sectores = pgTable("sectores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  departamento: varchar("departamento", { length: 100 }),
  distrito: varchar("distrito", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueSector: unique().on(table.nombre, table.departamento, table.distrito),
}));

export const insertSectorSchema = createInsertSchema(sectores).omit({ id: true, createdAt: true });
export type InsertSector = z.infer<typeof insertSectorSchema>;
export type Sector = typeof sectores.$inferSelect;

// ============================================================
// LUGARES FRECUENTES DEL USUARIO
// ============================================================
export const lugaresUsuario = pgTable("lugares_usuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => usuarios.id).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  latitud: real("latitud").notNull(),
  longitud: real("longitud").notNull(),
  direccion: text("direccion"),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLugarUsuarioSchema = createInsertSchema(lugaresUsuario).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLugarUsuario = z.infer<typeof insertLugarUsuarioSchema>;
export type LugarUsuario = typeof lugaresUsuario.$inferSelect;

// ============================================================
// SISTEMA DE ROLES JERÁRQUICO
// ============================================================

// Categorías de roles (ej: "Comisaría Alto Alianza", "Radio Taxi Sur", "Bomberos Norte")
export const categoriasRoles = pgTable("categorias_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  rol: varchar("rol", { length: 50 }).notNull(), // 'policia', 'bombero', 'taxi', etc.
  nombre: varchar("nombre", { length: 200 }).notNull(), // "Comisaría Alto Alianza"
  descripcion: text("descripcion"),
  icono: varchar("icono", { length: 50 }),
  activo: boolean("activo").default(true),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategoriaRolSchema = createInsertSchema(categoriasRoles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCategoriaRol = z.infer<typeof insertCategoriaRolSchema>;
export type CategoriaRol = typeof categoriasRoles.$inferSelect;

// Subcategorías de roles (ej: "Jefatura", "Operaciones", "Personal")
export const subcategoriasRoles = pgTable("subcategorias_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoriaRolId: varchar("categoria_rol_id").references(() => categoriasRoles.id).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(), // "Jefatura", "Operaciones", etc.
  descripcion: text("descripcion"),
  permisos: json("permisos").$type<string[]>(), // Lista de permisos especiales
  activo: boolean("activo").default(true),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubcategoriaRolSchema = createInsertSchema(subcategoriasRoles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubcategoriaRol = z.infer<typeof insertSubcategoriaRolSchema>;
export type SubcategoriaRol = typeof subcategoriasRoles.$inferSelect;

// Roles múltiples por usuario (un usuario puede tener varios roles)
export const usuarioRoles = pgTable("usuario_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => usuarios.id).notNull(),
  rol: varchar("rol", { length: 50 }).notNull(),
  categoriaRolId: varchar("categoria_rol_id").references(() => categoriasRoles.id),
  subcategoriaRolId: varchar("subcategoria_rol_id").references(() => subcategoriasRoles.id),
  estado: varchar("estado", { length: 20 }).default("activo"), // 'activo', 'suspendido', 'inactivo'
  asignadoPor: varchar("asignado_por").references(() => usuarios.id),
  fechaAsignacion: timestamp("fecha_asignacion").defaultNow(),
  fechaVencimiento: timestamp("fecha_vencimiento"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUsuarioRolSchema = createInsertSchema(usuarioRoles).omit({ id: true, createdAt: true, updatedAt: true, fechaAsignacion: true });
export type InsertUsuarioRol = z.infer<typeof insertUsuarioRolSchema>;
export type UsuarioRol = typeof usuarioRoles.$inferSelect;

// Solicitudes de roles (para aprobación del super admin)
export const solicitudesRoles = pgTable("solicitudes_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  usuarioId: varchar("usuario_id").references(() => usuarios.id).notNull(),
  rol: varchar("rol", { length: 50 }).notNull(),
  categoriaRolId: varchar("categoria_rol_id").references(() => categoriasRoles.id),
  subcategoriaRolId: varchar("subcategoria_rol_id").references(() => subcategoriasRoles.id),
  comentarios: text("comentarios"), // Nota del usuario explicando por qué solicita el rol
  documentosAdjuntos: json("documentos_adjuntos").$type<string[]>(), // URLs de documentos de acreditación
  estado: varchar("estado", { length: 20 }).default("pendiente").notNull(), // 'pendiente', 'aprobado', 'rechazado'
  motivoRechazo: text("motivo_rechazo"),
  revisadoPor: varchar("revisado_por").references(() => usuarios.id),
  fechaRevision: timestamp("fecha_revision"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSolicitudRolSchema = createInsertSchema(solicitudesRoles).omit({ id: true, createdAt: true, updatedAt: true, estado: true, fechaRevision: true });
export type InsertSolicitudRol = z.infer<typeof insertSolicitudRolSchema>;
export type SolicitudRol = typeof solicitudesRoles.$inferSelect;

// Lista de roles principales disponibles en el sistema
export const rolesDisponibles = [
  { valor: "usuario", nombre: "Usuario", descripcion: "Usuario básico del sistema", icono: "User" },
  { valor: "cambista", nombre: "Cambista", descripcion: "Envía datos de cambio de moneda al día", icono: "Coins" },
  { valor: "chat", nombre: "Chat Comunitario", descripcion: "Acceso a grupos de seguridad ciudadana", icono: "MessageSquare" },
  { valor: "mi_tienda", nombre: "Mi Tienda", descripcion: "Vende productos de manera independiente", icono: "Store" },
  { valor: "local", nombre: "Local Comercial", descripcion: "Propietario de negocio con RUC", icono: "Building" },
  { valor: "policia", nombre: "Policía", descripcion: "Miembro de la PNP", icono: "Shield" },
  { valor: "bombero", nombre: "Bombero", descripcion: "Miembro del cuerpo de bomberos", icono: "Flame" },
  { valor: "samu", nombre: "SAMU", descripcion: "Personal de emergencias médicas", icono: "Ambulance" },
  { valor: "serenazgo", nombre: "Serenazgo", descripcion: "Personal de seguridad municipal", icono: "Eye" },
  { valor: "institucion", nombre: "Institución", descripcion: "Puede publicar eventos y encuestas", icono: "Landmark" },
  { valor: "conductor", nombre: "Conductor", descripcion: "Taxista, delivery, buses, mudanzas", icono: "Car" },
  { valor: "buses", nombre: "Buses", descripcion: "Operador de transporte público", icono: "Bus" },
] as const;

// ============================================================
// DATOS DE NEGOCIO LOCAL (para usuarios con rol local_comercial)
// ============================================================
export const datosNegocio = pgTable("datos_negocio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => usuarios.id).notNull(),
  nombreNegocio: varchar("nombre_negocio", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  bannerUrl: varchar("banner_url"),
  direccion: text("direccion"),
  latitud: real("latitud"),
  longitud: real("longitud"),
  telefono: varchar("telefono", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 100 }),
  horarioAtencion: text("horario_atencion"),
  // Redes Sociales
  facebook: varchar("facebook"),
  instagram: varchar("instagram"),
  tiktok: varchar("tiktok"),
  youtube: varchar("youtube"),
  paginaWeb: varchar("pagina_web"),
  // Configuración
  tipoNegocio: varchar("tipo_negocio", { length: 50 }), // 'restaurante', 'tienda', 'servicios', etc.
  categoriaId: varchar("categoria_id"),
  subcategoriaId: varchar("subcategoria_id"),
  activo: boolean("activo").default(true),
  verificado: boolean("verificado").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDatosNegocioSchema = createInsertSchema(datosNegocio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDatosNegocio = z.infer<typeof insertDatosNegocioSchema>;
export type DatosNegocio = typeof datosNegocio.$inferSelect;

// ============================================================
// CATÁLOGO DE PRODUCTOS/SERVICIOS DE NEGOCIO
// ============================================================
export const catalogoNegocio = pgTable("catalogo_negocio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  negocioId: varchar("negocio_id").references(() => datosNegocio.id).notNull(),
  usuarioId: varchar("usuario_id").references(() => usuarios.id).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  precio: numeric("precio", { precision: 10, scale: 2 }),
  precioOferta: numeric("precio_oferta", { precision: 10, scale: 2 }),
  imagenUrl: varchar("imagen_url"),
  categoria: varchar("categoria", { length: 100 }),
  disponible: boolean("disponible").default(true),
  destacado: boolean("destacado").default(false),
  orden: integer("orden").default(0),
  // Para menús de restaurantes
  tipoItem: varchar("tipo_item", { length: 50 }).default('producto'), // 'producto', 'plato', 'servicio'
  ingredientes: text("ingredientes"),
  tiempoPreparacion: varchar("tiempo_preparacion", { length: 50 }),
  // Costos
  costoPublicacion: numeric("costo_publicacion", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCatalogoNegocioSchema = createInsertSchema(catalogoNegocio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCatalogoNegocio = z.infer<typeof insertCatalogoNegocioSchema>;
export type CatalogoNegocio = typeof catalogoNegocio.$inferSelect;

// ============================================================
// PERSONAL DEL NEGOCIO
// ============================================================
export const personalNegocio = pgTable("personal_negocio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  negocioId: varchar("negocio_id").references(() => datosNegocio.id).notNull(),
  usuarioId: varchar("usuario_id").references(() => usuarios.id).notNull(),
  propietarioId: varchar("propietario_id").references(() => usuarios.id).notNull(),
  funcion: varchar("funcion", { length: 100 }).notNull(), // 'cajero', 'vendedor', 'repartidor', 'gerente', 'cocinero', etc.
  permisos: varchar("permisos").array(), // ['ver_pedidos', 'editar_catalogo', 'ver_historial', etc.]
  estado: varchar("estado", { length: 20 }).default("activo"), // 'activo', 'inactivo', 'pendiente'
  fechaIngreso: timestamp("fecha_ingreso").defaultNow(),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPersonalNegocioSchema = createInsertSchema(personalNegocio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPersonalNegocio = z.infer<typeof insertPersonalNegocioSchema>;
export type PersonalNegocio = typeof personalNegocio.$inferSelect;

// ============================================================
// ADMINISTRADORES DE SEGUNDO NIVEL
// ============================================================
export const administradores = pgTable("administradores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  permisosGrupos: varchar("permisos_grupos").array(),
  permisosServicios: varchar("permisos_servicios").array(),
  permisosTaxis: varchar("permisos_taxis").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// PUBLICIDAD
// ============================================================
export const publicidad = pgTable("publicidad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // null = todas las ciudades
  titulo: varchar("titulo"),
  descripcion: text("descripcion"),
  tipo: varchar("tipo"), // "carrusel_logos", "carrusel_principal", "logos_servicios", "popup_emergencia", "encuestas_apoyo"
  imagenUrl: varchar("imagen_url"),
  enlaceUrl: varchar("enlace_url"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  fechaCaducidad: timestamp("fecha_caducidad"),
  fechaEvento: timestamp("fecha_evento"), // Fecha del evento para calendario con notificación 1 hora antes
  estado: varchar("estado").default("activo"), // "activo", "pausado", "finalizado"
  usuarioId: varchar("usuario_id"),
  orden: integer("orden"),
  // GPS / Ubicación
  latitud: real("latitud"),
  longitud: real("longitud"),
  direccion: text("direccion"),
  // Redes Sociales
  facebook: varchar("facebook"),
  instagram: varchar("instagram"),
  whatsapp: varchar("whatsapp"),
  tiktok: varchar("tiktok"),
  twitter: varchar("twitter"),
  youtube: varchar("youtube"),
  linkedin: varchar("linkedin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPublicidadSchema = createInsertSchema(publicidad).omit({ createdAt: true, updatedAt: true });
export type PublicidadInsert = z.infer<typeof insertPublicidadSchema>;
export type Publicidad = typeof publicidad.$inferSelect;

// ============================================================
// INTERACCIONES DE PUBLICIDAD (likes, favoritos, compartidos, impresiones)
// ============================================================
export const interaccionesPublicidad = pgTable("interacciones_publicidad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publicidadId: varchar("publicidad_id").notNull().references(() => publicidad.id),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  tipo: varchar("tipo", { length: 50 }).notNull(), // "like", "favorito", "compartido", "impresion", "agenda"
  redSocial: varchar("red_social", { length: 50 }), // Para compartidos: "facebook", "twitter", "whatsapp", etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueInteraccion: unique().on(table.publicidadId, table.usuarioId, table.tipo),
}));

export const insertInteraccionPublicidadSchema = createInsertSchema(interaccionesPublicidad).omit({ id: true, createdAt: true });
export type InsertInteraccionPublicidad = z.infer<typeof insertInteraccionPublicidadSchema>;
export type InteraccionPublicidad = typeof interaccionesPublicidad.$inferSelect;

// ============================================================
// COMENTARIOS DE PUBLICIDAD
// ============================================================
export const comentariosPublicidad = pgTable("comentarios_publicidad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publicidadId: varchar("publicidad_id").notNull().references(() => publicidad.id),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  contenido: text("contenido").notNull(),
  estado: varchar("estado", { length: 20 }).default("activo"), // "activo", "eliminado", "oculto"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertComentarioPublicidadSchema = createInsertSchema(comentariosPublicidad).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComentarioPublicidad = z.infer<typeof insertComentarioPublicidadSchema>;
export type ComentarioPublicidad = typeof comentariosPublicidad.$inferSelect;

// ============================================================
// CONTADORES DE PUBLICIDAD (caché para conteos rápidos)
// ============================================================
export const contadoresPublicidad = pgTable("contadores_publicidad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  publicidadId: varchar("publicidad_id").notNull().references(() => publicidad.id).unique(),
  likes: integer("likes").default(0),
  favoritos: integer("favoritos").default(0),
  compartidos: integer("compartidos").default(0),
  impresiones: integer("impresiones").default(0),
  comentarios: integer("comentarios").default(0),
  agendados: integer("agendados").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContadorPublicidadSchema = createInsertSchema(contadoresPublicidad).omit({ id: true, updatedAt: true });
export type InsertContadorPublicidad = z.infer<typeof insertContadorPublicidadSchema>;
export type ContadorPublicidad = typeof contadoresPublicidad.$inferSelect;

// ============================================================
// FAVORITOS DE USUARIO (perfil de favoritos)
// ============================================================
export const favoritosUsuario = pgTable("favoritos_usuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  publicidadId: varchar("publicidad_id").notNull().references(() => publicidad.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFavorito: unique().on(table.usuarioId, table.publicidadId),
}));

export const insertFavoritoUsuarioSchema = createInsertSchema(favoritosUsuario).omit({ id: true, createdAt: true });
export type InsertFavoritoUsuario = z.infer<typeof insertFavoritoUsuarioSchema>;
export type FavoritoUsuario = typeof favoritosUsuario.$inferSelect;

// ============================================================
// RADIOS ONLINE
// ============================================================
export const radiosOnline = pgTable("radios_online", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  iframeCode: text("iframe_code"),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url", { length: 500 }),
  orden: integer("orden").default(0),
  esPredeterminada: boolean("es_predeterminada").default(false),
  estado: varchar("estado", { length: 20 }).default("activo"), // activo, pausado, suspendido
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRadioOnlineSchema = createInsertSchema(radiosOnline).omit({ id: true, createdAt: true, updatedAt: true });
export type RadioOnlineInsert = z.infer<typeof insertRadioOnlineSchema>;
export type RadioOnline = typeof radiosOnline.$inferSelect;

// ============================================================
// LISTAS MP3 (Playlists/Colecciones)
// ============================================================
export const listasMp3 = pgTable("listas_mp3", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  rutaCarpeta: varchar("ruta_carpeta", { length: 500 }),
  imagenUrl: varchar("imagen_url", { length: 500 }),
  genero: varchar("genero", { length: 100 }),
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default("activo"), // activo, pausado, suspendido
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListaMp3Schema = createInsertSchema(listasMp3).omit({ id: true, createdAt: true, updatedAt: true });
export type ListaMp3Insert = z.infer<typeof insertListaMp3Schema>;
export type ListaMp3 = typeof listasMp3.$inferSelect;

// ============================================================
// ARCHIVOS MP3 (Canciones individuales en listas)
// ============================================================
export const archivosMp3 = pgTable("archivos_mp3", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listaId: integer("lista_id").references(() => listasMp3.id),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  nombreArchivo: varchar("nombre_archivo", { length: 255 }),
  artista: varchar("artista", { length: 255 }),
  archivoUrl: varchar("archivo_url", { length: 500 }).notNull(),
  duracion: integer("duracion"),
  tamano: integer("tamano"),
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertArchivoMp3Schema = createInsertSchema(archivosMp3).omit({ id: true, createdAt: true });
export type ArchivoMp3Insert = z.infer<typeof insertArchivoMp3Schema>;
export type ArchivoMp3 = typeof archivosMp3.$inferSelect;

// ============================================================
// SERVICIOS LOCALES
// ============================================================
export const servicios = pgTable("servicios", {
  id: varchar("id").primaryKey(),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  usuarioId: varchar("usuario_id"),
  categoria: varchar("categoria"),
  nombreServicio: varchar("nombre_servicio"),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  direccion: text("direccion"),
  telefono: varchar("telefono"),
  horario: text("horario"),
  estado: varchar("estado").default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServicioSchema = createInsertSchema(servicios).omit({ id: true, createdAt: true });
export type ServicioInsert = z.infer<typeof insertServicioSchema>;
export type Servicio = typeof servicios.$inferSelect;

// ============================================================
// PRODUCTOS DELIVERY
// ============================================================
export const productosDelivery = pgTable("productos_delivery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  servicioId: varchar("servicio_id").notNull().references(() => servicios.id),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  precio: decimal("precio", { precision: 10, scale: 2 }).notNull(),
  imagenUrl: varchar("imagen_url"),
  disponible: boolean("disponible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductoDeliverySchema = createInsertSchema(productosDelivery).omit({ id: true });
export type ProductoDeliveryInsert = z.infer<typeof insertProductoDeliverySchema>;
export type ProductoDelivery = typeof productosDelivery.$inferSelect;

// ============================================================
// GRUPOS DE CHAT
// ============================================================
export const gruposChat = pgTable("grupos_chat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  avatarUrl: varchar("avatar_url"),
  creadorId: varchar("creador_id").notNull().references(() => usuarios.id),
  adminGrupoId: varchar("admin_grupo_id").references(() => usuarios.id),
  estado: varchar("estado", { length: 20 }).default("activo"),
  estrellasMinimas: integer("estrellas_minimas").default(3),
  tipoCobro: varchar("tipo_cobro", { length: 20 }).default("ninguno"),
  tarifaGrupo: decimal("tarifa_grupo", { precision: 10, scale: 2 }).default("0"),
  tarifaUsuario: decimal("tarifa_usuario", { precision: 10, scale: 2 }).default("0"),
  esEmergencia: boolean("es_emergencia").default(false),
  totalMiembros: integer("total_miembros").default(0),
  totalMensajes: integer("total_mensajes").default(0),
  ultimoMensajeAt: timestamp("ultimo_mensaje_at"),
  motivoSuspension: text("motivo_suspension"),
  fechaSuspension: timestamp("fecha_suspension"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGrupoChatSchema = createInsertSchema(gruposChat).omit({ id: true, createdAt: true, updatedAt: true });
export type GrupoChatInsert = z.infer<typeof insertGrupoChatSchema>;
export type GrupoChat = typeof gruposChat.$inferSelect;

// ============================================================
// MIEMBROS DE GRUPOS
// ============================================================
export const miembrosGrupo = pgTable("miembros_grupo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grupoId: varchar("grupo_id").notNull().references(() => gruposChat.id),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  rol: varchar("rol", { length: 50 }).default("miembro"),
  estado: varchar("estado", { length: 20 }).default("activo"),
  nivelEstrellas: integer("nivel_estrellas").default(1),
  pagoConfirmado: boolean("pago_confirmado").default(false),
  fechaPago: timestamp("fecha_pago"),
  motivoSuspension: text("motivo_suspension"),
  fechaSuspension: timestamp("fecha_suspension"),
  silenciado: boolean("silenciado").default(false),
  notificaciones: boolean("notificaciones").default(true),
  mensajesNoLeidos: integer("mensajes_no_leidos").default(0),
  ultimoMensajeVisto: timestamp("ultimo_mensaje_visto"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueMember: unique().on(table.grupoId, table.usuarioId),
}));

export const insertMiembroGrupoSchema = createInsertSchema(miembrosGrupo).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMiembroGrupo = z.infer<typeof insertMiembroGrupoSchema>;
export type MiembroGrupo = typeof miembrosGrupo.$inferSelect;

// ============================================================
// MENSAJES
// ============================================================
export const mensajes = pgTable("mensajes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grupoId: varchar("grupo_id").references(() => gruposChat.id),
  remitenteId: varchar("remitente_id").notNull().references(() => usuarios.id),
  destinatarioId: varchar("destinatario_id").references(() => usuarios.id),
  contenido: text("contenido"),
  tipo: varchar("tipo", { length: 50 }).default("texto"),
  archivoUrl: varchar("archivo_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  metadataFoto: json("metadata_foto").$type<{
    fechaHora: string;
    logoUrl?: string;
    nombreUsuario: string;
    latitud?: number;
    longitud?: number;
  }>(),
  duracionAudio: integer("duracion_audio"),
  esEmergencia: boolean("es_emergencia").default(false),
  gpsLatitud: real("gps_latitud"),
  gpsLongitud: real("gps_longitud"),
  leido: boolean("leido").default(false),
  eliminado: boolean("eliminado").default(false),
  eliminadoPor: varchar("eliminado_por").references(() => usuarios.id),
  fechaEliminacion: timestamp("fecha_eliminacion"),
  createdAt: timestamp("created_at").defaultNow(),
  estadoMensaje: varchar("estado_mensaje", { length: 20 }).default("enviado"),
  entregadoEn: timestamp("entregado_en"),
  leidoEn: timestamp("leido_en"),
  leidoPor: varchar("leido_por").array(),
});

export const insertMensajeSchema = createInsertSchema(mensajes).omit({ id: true, createdAt: true });
export type MensajeInsert = z.infer<typeof insertMensajeSchema>;
export type Mensaje = typeof mensajes.$inferSelect;
export type InsertMensaje = z.infer<typeof insertMensajeSchema>;

// ============================================================
// EMERGENCIAS
// ============================================================
export const emergencias = pgTable("emergencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  descripcion: text("descripcion"),
  latitud: real("latitud").notNull(),
  longitud: real("longitud").notNull(),
  direccion: text("direccion"),
  estado: varchar("estado", { length: 50 }).default("pendiente"),
  prioridad: varchar("prioridad", { length: 20 }).default("media"),
  gruposNotificados: text("grupos_notificados").array(),
  entidadesNotificadas: text("entidades_notificadas").array(),
  atendidoPor: varchar("atendido_por").references(() => usuarios.id),
  imagenUrl: varchar("imagen_url"),
  audioUrl: varchar("audio_url"),
  videoUrl: varchar("video_url"),
  mensajeVoz: varchar("mensaje_voz"),
  metadataGps: json("metadata_gps").$type<{
    precision?: number;
    altitud?: number;
    velocidad?: number;
    timestamp?: string;
  }>(),
  vistaPorAdmin: boolean("vista_por_admin").default(false),
  fechaVistaAdmin: timestamp("fecha_vista_admin"),
  adminQueVio: varchar("admin_que_vio").references(() => usuarios.id),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmergenciaSchema = createInsertSchema(emergencias).omit({ 
  id: true, 
  usuarioId: true, // Se agrega en el backend desde el token de autenticación
  createdAt: true, 
  updatedAt: true 
});
export type EmergenciaInsert = z.infer<typeof insertEmergenciaSchema>;
export type Emergencia = typeof emergencias.$inferSelect;

// ============================================================
// CONTACTOS FAMILIARES DE EMERGENCIA
// ============================================================
export const contactosFamiliares = pgTable("contactos_familiares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  telefono: varchar("telefono", { length: 30 }),
  email: varchar("email", { length: 200 }),
  relacion: varchar("relacion", { length: 50 }), // "padre", "madre", "esposo/a", "hijo/a", "hermano/a", "otro"
  esContactoPrincipal: boolean("es_contacto_principal").default(false),
  notificarEmergencias: boolean("notificar_emergencias").default(true),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertContactoFamiliarSchema = createInsertSchema(contactosFamiliares).omit({ id: true, createdAt: true, updatedAt: true, usuarioId: true });
export type InsertContactoFamiliar = z.infer<typeof insertContactoFamiliarSchema>;
export type ContactoFamiliar = typeof contactosFamiliares.$inferSelect;

// ============================================================
// NOTIFICACIONES DE CHAT
// ============================================================
export const notificacionesChat = pgTable("notificaciones_chat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  grupoId: varchar("grupo_id").references(() => gruposChat.id),
  mensajeId: varchar("mensaje_id").references(() => mensajes.id),
  emergenciaId: varchar("emergencia_id").references(() => emergencias.id),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  titulo: varchar("titulo", { length: 255 }),
  contenido: text("contenido"),
  leida: boolean("leida").default(false),
  fechaLeida: timestamp("fecha_leida"),
  datosExtra: json("datos_extra").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificacionChatSchema = createInsertSchema(notificacionesChat).omit({ id: true, createdAt: true });
export type InsertNotificacionChat = z.infer<typeof insertNotificacionChatSchema>;
export type NotificacionChat = typeof notificacionesChat.$inferSelect;

// ============================================================
// VIAJES TAXI
// ============================================================
export const viajeTaxi = pgTable("viajes_taxi", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  pasajeroId: varchar("pasajero_id").notNull().references(() => usuarios.id),
  conductorId: varchar("conductor_id").references(() => usuarios.id),
  origenLatitud: real("origen_latitud").notNull(),
  origenLongitud: real("origen_longitud").notNull(),
  origenDireccion: text("origen_direccion"),
  destinoLatitud: real("destino_latitud").notNull(),
  destinoLongitud: real("destino_longitud").notNull(),
  destinoDireccion: text("destino_direccion"),
  precio: decimal("precio", { precision: 10, scale: 2 }),
  estado: varchar("estado", { length: 50 }).default("solicitado"),
  tipoServicio: varchar("tipo_servicio", { length: 50 }).default("taxi"),
  createdAt: timestamp("created_at").defaultNow(),
  iniciadoAt: timestamp("iniciado_at"),
  completadoAt: timestamp("completado_at"),
});

export const insertViajeTaxiSchema = createInsertSchema(viajeTaxi).omit({ id: true, createdAt: true });
export type ViajeTaxiInsert = z.infer<typeof insertViajeTaxiSchema>;
export type ViajeTaxi = typeof viajeTaxi.$inferSelect;

// ============================================================
// PEDIDOS DELIVERY
// ============================================================
export const pedidosDelivery = pgTable("pedidos_delivery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  servicioId: varchar("servicio_id").notNull().references(() => servicios.id),
  productos: json("productos").notNull().$type<{ productoId: string; cantidad: number }[]>(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  direccionEntrega: text("direccion_entrega").notNull(),
  latitud: real("latitud"),
  longitud: real("longitud"),
  estado: varchar("estado", { length: 50 }).default("pendiente"),
  conductorId: varchar("conductor_id").references(() => usuarios.id),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertPedidoDeliverySchema = createInsertSchema(pedidosDelivery).omit({ id: true, createdAt: true });
export type PedidoDeliveryInsert = z.infer<typeof insertPedidoDeliverySchema>;
export type PedidoDelivery = typeof pedidosDelivery.$inferSelect;

// ============================================================
// CONFIGURACIÓN DE SALDOS Y TARIFAS
// ============================================================
export const configuracionSaldos = pgTable("configuracion_saldos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipoOperacion: varchar("tipo_operacion").notNull(),
  tipoValor: varchar("tipo_valor").default("monto"),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull().default("0"),
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// ENCUESTAS
// ============================================================
export const encuestas = pgTable("encuestas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // null = todas las ciudades
  titulo: varchar("titulo").notNull(),
  descripcion: text("descripcion"),
  preguntas: json("preguntas").$type<{ pregunta: string; opciones: string[] }[]>(),
  imagenUrl: varchar("imagen_url"),
  estado: varchar("estado").default("activa"),
  respuestas: json("respuestas").$type<{ preguntaIndex: number; opcion: string; cantidad: number }[]>(),
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  totalRespuestas: integer("total_respuestas").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// POPUP PUBLICITARIOS
// ============================================================
export const popupsPublicitarios = pgTable("popups_publicitarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // null = todas las ciudades
  titulo: varchar("titulo"),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url"),
  videoUrl: varchar("video_url"),
  tipo: varchar("tipo", { length: 50 }).default("publicidad"),
  duracionSegundos: integer("duracion_segundos").default(30),
  segundosObligatorios: integer("segundos_obligatorios").default(5),
  puedeOmitir: boolean("puede_omitir").default(true),
  estado: varchar("estado").default("activo"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  vistas: integer("vistas").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// INTERACCIONES SOCIALES (likes, favoritos, comentarios, compartir, calendario)
// ============================================================
export const interaccionesSociales = pgTable("interacciones_sociales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipoContenido: varchar("tipo_contenido", { length: 50 }).notNull(),
  contenidoId: varchar("contenido_id").notNull(),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  tipoInteraccion: varchar("tipo_interaccion", { length: 50 }).notNull(),
  valor: text("valor"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// RESPUESTAS DE ENCUESTAS
// ============================================================
export const respuestasEncuestas = pgTable("respuestas_encuestas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  encuestaId: varchar("encuesta_id").notNull().references(() => encuestas.id),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  respuestas: json("respuestas").$type<{ preguntaIndex: number; opcionSeleccionada: number }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// COMENTARIOS
// ============================================================
export const comentarios = pgTable("comentarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipoContenido: varchar("tipo_contenido", { length: 50 }).notNull(),
  contenidoId: varchar("contenido_id").notNull(),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  texto: text("texto").notNull(),
  estado: varchar("estado", { length: 20 }).default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// CONFIGURACIÓN DEL SITIO
// ============================================================
export const configuracionSitio = pgTable("configuracion_sitio", {
  id: serial("id").primaryKey(),
  clave: varchar("clave").unique(),
  valor: text("valor"),
  tipo: varchar("tipo"), // "texto", "número", "booleano", "json"
});

export const insertConfiguracionSitioSchema = createInsertSchema(configuracionSitio).omit({ id: true });
export type InsertConfiguracionSitio = z.infer<typeof insertConfiguracionSitioSchema>;
export type ConfiguracionSitio = typeof configuracionSitio.$inferSelect;

// Export insert schemas for missing tables
export const insertConfiguracionSaldoSchema = createInsertSchema(configuracionSaldos).omit({ id: true });
export type InsertConfiguracionSaldo = z.infer<typeof insertConfiguracionSaldoSchema>;
export type ConfiguracionSaldo = typeof configuracionSaldos.$inferSelect;

export const insertEncuestaSchema = createInsertSchema(encuestas).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEncuesta = z.infer<typeof insertEncuestaSchema>;
export type Encuesta = typeof encuestas.$inferSelect;

export const insertPopupPublicitarioSchema = createInsertSchema(popupsPublicitarios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPopupPublicitario = z.infer<typeof insertPopupPublicitarioSchema>;
export type PopupPublicitario = typeof popupsPublicitarios.$inferSelect;

export const insertInteraccionSocialSchema = createInsertSchema(interaccionesSociales).omit({ id: true, createdAt: true });
export type InsertInteraccionSocial = z.infer<typeof insertInteraccionSocialSchema>;
export type InteraccionSocial = typeof interaccionesSociales.$inferSelect;

export const insertRespuestaEncuestaSchema = createInsertSchema(respuestasEncuestas).omit({ id: true, createdAt: true });
export type InsertRespuestaEncuesta = z.infer<typeof insertRespuestaEncuestaSchema>;
export type RespuestaEncuesta = typeof respuestasEncuestas.$inferSelect;

export const insertComentarioSchema = createInsertSchema(comentarios).omit({ id: true, createdAt: true });
export type InsertComentario = z.infer<typeof insertComentarioSchema>;
export type Comentario = typeof comentarios.$inferSelect;

export const insertAdministradorSchema = createInsertSchema(administradores).omit({ id: true, createdAt: true });
export type InsertAdministrador = z.infer<typeof insertAdministradorSchema>;
export type Administrador = typeof administradores.$inferSelect;

// ============================================================
// SISTEMA DE REGISTRO POR NIVELES (5 ESTRELLAS)
// ============================================================

// NIVEL 1: Básico (1 estrella)
// Nota: password se maneja en el sistema de autenticación principal, no aquí
export const registroBasico = pgTable("registro_basico", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().unique().references(() => usuarios.id),
  alias: varchar("alias").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistroBasicoSchema = createInsertSchema(registroBasico).omit({ id: true, createdAt: true });
export type InsertRegistroBasico = z.infer<typeof insertRegistroBasicoSchema>;
export type RegistroBasico = typeof registroBasico.$inferSelect;

// NIVEL 2: Servicio Chat (2 estrellas)
export const registroChat = pgTable("registro_chat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().unique().references(() => usuarios.id),
  nombres: varchar("nombres").notNull(),
  apellidos: varchar("apellidos").notNull(),
  foto: varchar("foto"),
  dniNumero: varchar("dni_numero", { length: 20 }).notNull(),
  dniFrenteUrl: varchar("dni_frente_url").notNull(),
  dniPosteriorUrl: varchar("dni_posterior_url").notNull(),
  dniFechaCaducidad: date("dni_fecha_caducidad").notNull(),
  numeroCelular: varchar("numero_celular", { length: 20 }).notNull(),
  verificado: boolean("verificado").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistroChatSchema = createInsertSchema(registroChat).omit({ id: true, createdAt: true });
export type InsertRegistroChat = z.infer<typeof insertRegistroChatSchema>;
export type RegistroChat = typeof registroChat.$inferSelect;

// NIVEL 3: Ubicación (3 estrellas)
export const registroUbicacion = pgTable("registro_ubicacion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().unique().references(() => usuarios.id),
  pais: varchar("pais").notNull(),
  departamento: varchar("departamento").notNull(),
  distrito: varchar("distrito").notNull(),
  sector: varchar("sector").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistroUbicacionSchema = createInsertSchema(registroUbicacion).omit({ id: true, createdAt: true });
export type InsertRegistroUbicacion = z.infer<typeof insertRegistroUbicacionSchema>;
export type RegistroUbicacion = typeof registroUbicacion.$inferSelect;

// NIVEL 4: Dirección (4 estrellas)
export const registroDireccion = pgTable("registro_direccion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().unique().references(() => usuarios.id),
  direccion: text("direccion").notNull(),
  mzaLoteNumero: varchar("mza_lote_numero"),
  avenidaCalle: varchar("avenida_calle"),
  gpsLatitud: real("gps_latitud").notNull(),
  gpsLongitud: real("gps_longitud").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistroDireccionSchema = createInsertSchema(registroDireccion).omit({ id: true, createdAt: true });
export type InsertRegistroDireccion = z.infer<typeof insertRegistroDireccionSchema>;
export type RegistroDireccion = typeof registroDireccion.$inferSelect;

// NIVEL 5: Marketplace/Venta (5 estrellas)
export const registroMarketplace = pgTable("registro_marketplace", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().unique().references(() => usuarios.id),
  nombreLocal: varchar("nombre_local").notNull(),
  direccionLocal: text("direccion_local").notNull(),
  gpsLocalLatitud: real("gps_local_latitud").notNull(),
  gpsLocalLongitud: real("gps_local_longitud").notNull(),
  numeroRuc: varchar("numero_ruc", { length: 20 }).notNull(),
  verificado: boolean("verificado").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRegistroMarketplaceSchema = createInsertSchema(registroMarketplace).omit({ id: true, createdAt: true });
export type InsertRegistroMarketplace = z.infer<typeof insertRegistroMarketplaceSchema>;
export type RegistroMarketplace = typeof registroMarketplace.$inferSelect;

// CREDENCIALES DE CONDUCTOR (Taxi/Bus/Delivery/Mudanzas)
export const credencialesConductor = pgTable("credenciales_conductor", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().unique().references(() => usuarios.id),
  
  // Brevete
  brevetteNumero: varchar("brevette_numero"),
  brevetteFrenteUrl: varchar("brevette_frente_url"),
  brevettePosteriorUrl: varchar("brevette_posterior_url"),
  brevetteFechaInicio: date("brevette_fecha_inicio"),
  brevetteFechaCaducidad: date("brevette_fecha_caducidad"),
  
  // SOAT
  soatNumero: varchar("soat_numero"),
  soatFrenteUrl: varchar("soat_frente_url"),
  soatPosteriorUrl: varchar("soat_posterior_url"),
  soatFechaInicio: date("soat_fecha_inicio"),
  soatFechaCaducidad: date("soat_fecha_caducidad"),
  
  // Revisión Técnica
  revisionTecnicaNumero: varchar("revision_tecnica_numero"),
  revisionTecnicaFrenteUrl: varchar("revision_tecnica_frente_url"),
  revisionTecnicaPosteriorUrl: varchar("revision_tecnica_posterior_url"),
  revisionTecnicaFechaInicio: date("revision_tecnica_fecha_inicio"),
  revisionTecnicaFechaCaducidad: date("revision_tecnica_fecha_caducidad"),
  
  // Credencial Conductor
  credencialConductorNumero: varchar("credencial_conductor_numero"),
  credencialConductorFrenteUrl: varchar("credencial_conductor_frente_url"),
  credencialConductorPosteriorUrl: varchar("credencial_conductor_posterior_url"),
  credencialConductorFechaInicio: date("credencial_conductor_fecha_inicio"),
  credencialConductorFechaCaducidad: date("credencial_conductor_fecha_caducidad"),
  
  // Credencial Taxi
  credencialTaxiNumero: varchar("credencial_taxi_numero"),
  credencialTaxiFrenteUrl: varchar("credencial_taxi_frente_url"),
  credencialTaxiPosteriorUrl: varchar("credencial_taxi_posterior_url"),
  credencialTaxiFechaInicio: date("credencial_taxi_fecha_inicio"),
  credencialTaxiFechaCaducidad: date("credencial_taxi_fecha_caducidad"),
  
  verificado: boolean("verificado").default(false),
  tipoServicio: varchar("tipo_servicio", { length: 50 }), // "taxi", "bus", "delivery", "mudanzas"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCredencialesConductorSchema = createInsertSchema(credencialesConductor).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCredencialesConductor = z.infer<typeof insertCredencialesConductorSchema>;
export type CredencialesConductor = typeof credencialesConductor.$inferSelect;

// ============================================================
// EVENTOS CALENDARIZADOS
// ============================================================
export const eventos = pgTable("eventos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin"),
  ubicacion: varchar("ubicacion", { length: 255 }),
  imagenUrl: varchar("imagen_url"),
  activo: boolean("activo").default(true),
  creadoPorId: varchar("creado_por_id").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEventoSchema = createInsertSchema(eventos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvento = z.infer<typeof insertEventoSchema>;
export type Evento = typeof eventos.$inferSelect;

// ============================================================
// AVISOS DE EMERGENCIA / SERVICIO A LA COMUNIDAD
// ============================================================
export const avisosEmergencia = pgTable("avisos_emergencia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  titulo: varchar("titulo", { length: 255 }).notNull(),
  mensaje: text("mensaje").notNull(),
  tipo: varchar("tipo", { length: 50 }).notNull(), // "corte_agua", "corte_luz", "alerta_sanitaria", etc.
  prioridad: varchar("prioridad", { length: 20 }).default("media"), // "baja", "media", "alta", "critica"
  zonaAfectada: varchar("zona_afectada", { length: 255 }),
  fechaInicio: timestamp("fecha_inicio").notNull(),
  fechaFin: timestamp("fecha_fin"),
  activo: boolean("activo").default(true),
  creadoPorId: varchar("creado_por_id").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAvisoEmergenciaSchema = createInsertSchema(avisosEmergencia).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAvisoEmergencia = z.infer<typeof insertAvisoEmergenciaSchema>;
export type AvisoEmergencia = typeof avisosEmergencia.$inferSelect;

// ============================================================
// TIPOS DE MONEDA / CAMBIO DE MONEDA
// ============================================================
export const tiposMoneda = pgTable("tipos_moneda", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo", { length: 3 }).notNull().unique(), // "PEN", "USD", "EUR"
  nombre: varchar("nombre", { length: 100 }).notNull(),
  simbolo: varchar("simbolo", { length: 10 }).notNull(),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTipoMonedaSchema = createInsertSchema(tiposMoneda).omit({ id: true, createdAt: true });
export type InsertTipoMoneda = z.infer<typeof insertTipoMonedaSchema>;
export type TipoMoneda = typeof tiposMoneda.$inferSelect;

export const tasasCambio = pgTable("tasas_cambio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monedaOrigenId: varchar("moneda_origen_id").notNull().references(() => tiposMoneda.id),
  monedaDestinoId: varchar("moneda_destino_id").notNull().references(() => tiposMoneda.id),
  tasa: real("tasa").notNull(),
  fechaActualizacion: timestamp("fecha_actualizacion").defaultNow(),
  actualizadoPorId: varchar("actualizado_por_id").references(() => usuarios.id),
});

export const insertTasaCambioSchema = createInsertSchema(tasasCambio).omit({ id: true, fechaActualizacion: true });
export type InsertTasaCambio = z.infer<typeof insertTasaCambioSchema>;
export type TasaCambio = typeof tasasCambio.$inferSelect;

// ============================================================
// CATEGORÍAS DE SERVICIOS LOCALES
// ============================================================
export const categoriasServicio = pgTable("categorias_servicio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url"),
  icono: varchar("icono", { length: 50 }),
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategoriaServicioSchema = createInsertSchema(categoriasServicio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCategoriaServicio = z.infer<typeof insertCategoriaServicioSchema>;
export type CategoriaServicio = typeof categoriasServicio.$inferSelect;

// ============================================================
// SUBCATEGORÍAS DE SERVICIOS LOCALES
// ============================================================
export const subcategoriasServicio = pgTable("subcategorias_servicio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoriaId: varchar("categoria_id").notNull().references(() => categoriasServicio.id),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url"),
  icono: varchar("icono", { length: 50 }),
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubcategoriaServicioSchema = createInsertSchema(subcategoriasServicio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubcategoriaServicio = z.infer<typeof insertSubcategoriaServicioSchema>;
export type SubcategoriaServicio = typeof subcategoriasServicio.$inferSelect;

// ============================================================
// LOGOS DE SERVICIOS (Negocios/Locales)
// ============================================================
export const logosServicios = pgTable("logos_servicios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoriaId: varchar("categoria_id").references(() => categoriasServicio.id),
  subcategoriaId: varchar("subcategoria_id").references(() => subcategoriasServicio.id),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  direccion: text("direccion"),
  telefono: varchar("telefono", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  email: varchar("email", { length: 255 }),
  horario: text("horario"),
  gpsLatitud: real("gps_latitud"),
  gpsLongitud: real("gps_longitud"),
  redes: json("redes").$type<{ facebook?: string; instagram?: string; tiktok?: string; twitter?: string; youtube?: string }>(),
  estado: varchar("estado", { length: 20 }).default("activo"),
  destacado: boolean("destacado").default(false),
  verificado: boolean("verificado").default(false),
  totalLikes: integer("total_likes").default(0),
  totalFavoritos: integer("total_favoritos").default(0),
  totalComentarios: integer("total_comentarios").default(0),
  totalCompartidos: integer("total_compartidos").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLogoServicioSchema = createInsertSchema(logosServicios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLogoServicio = z.infer<typeof insertLogoServicioSchema>;
export type LogoServicio = typeof logosServicios.$inferSelect;

// ============================================================
// PRODUCTOS DE SERVICIOS LOCALES
// ============================================================
export const productosServicio = pgTable("productos_servicio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logoServicioId: varchar("logo_servicio_id").notNull().references(() => logosServicios.id),
  codigo: varchar("codigo", { length: 50 }),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  precio: decimal("precio", { precision: 10, scale: 2 }),
  precioOferta: decimal("precio_oferta", { precision: 10, scale: 2 }),
  imagenUrl: varchar("imagen_url"),
  categoria: varchar("categoria", { length: 100 }),
  stock: integer("stock"),
  disponible: boolean("disponible").default(true),
  destacado: boolean("destacado").default(false),
  orden: integer("orden").default(0),
  totalLikes: integer("total_likes").default(0),
  totalFavoritos: integer("total_favoritos").default(0),
  totalComentarios: integer("total_comentarios").default(0),
  totalCompartidos: integer("total_compartidos").default(0),
  estado: varchar("estado", { length: 20 }).default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductoServicioSchema = createInsertSchema(productosServicio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductoServicio = z.infer<typeof insertProductoServicioSchema>;
export type ProductoServicio = typeof productosServicio.$inferSelect;

// ============================================================
// TRANSACCIONES DE SALDO (Historial de cobros y pagos)
// ============================================================
export const transaccionesSaldo = pgTable("transacciones_saldo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  concepto: varchar("concepto", { length: 255 }).notNull(),
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  saldoAnterior: decimal("saldo_anterior", { precision: 10, scale: 2 }).default("0"),
  saldoNuevo: decimal("saldo_nuevo", { precision: 10, scale: 2 }).default("0"),
  referenciaId: varchar("referencia_id"),
  referenciaTipo: varchar("referencia_tipo", { length: 50 }),
  estado: varchar("estado", { length: 20 }).default("completado"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransaccionSaldoSchema = createInsertSchema(transaccionesSaldo).omit({ id: true, createdAt: true });
export type InsertTransaccionSaldo = z.infer<typeof insertTransaccionSaldoSchema>;
export type TransaccionSaldo = typeof transaccionesSaldo.$inferSelect;

// ============================================================
// ESQUEMAS DE AUTENTICACIÓN PARA FRONTEND
// ============================================================

// Roles disponibles para registro
export const rolesRegistroValidos = [
  "usuario",
  "conductor", 
  "local",
  "serenazgo",
  "policia",
  "bombero",
  "samu",
] as const;

export type RolRegistro = typeof rolesRegistroValidos[number];

// Esquema de login
export const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Esquema de registro nivel 1 (básico)
export const registroNivel1Schema = z.object({
  alias: z.string()
    .min(3, "El alias debe tener al menos 3 caracteres")
    .max(50, "El alias no puede tener más de 50 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "El alias solo puede contener letras, números y guión bajo"),
  email: z.string().email("Ingresa un email válido"),
  telefono: z.string().optional(),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  rol: z.enum(rolesRegistroValidos, {
    errorMap: () => ({ message: "Selecciona un rol válido" }),
  }),
});
export type RegistroNivel1Input = z.infer<typeof registroNivel1Schema>;

// Esquema de registro con confirmación de contraseña (para frontend)
export const registroNivel1ConConfirmacionSchema = registroNivel1Schema
  .extend({
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type RegistroNivel1ConConfirmacion = z.infer<typeof registroNivel1ConConfirmacionSchema>;

// Roles que requieren aprobación de administrador
export const rolesConAprobacion: RolRegistro[] = [
  "conductor",
  "local", 
  "serenazgo",
  "policia",
  "bombero",
  "samu",
];

// Helper para verificar si un rol requiere aprobación
export function requiereAprobacion(rol: RolRegistro): boolean {
  return rolesConAprobacion.includes(rol);
}

// ============================================================
// MÉTODOS DE PAGO
// ============================================================
export const metodosPago = pgTable("metodos_pago", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'banco', 'interbancario', 'paypal', 'plin', 'yape', 'otro'
  nombre: varchar("nombre", { length: 100 }).notNull(), // Nombre del banco o método
  numeroCuenta: varchar("numero_cuenta", { length: 100 }),
  cci: varchar("cci", { length: 30 }), // Código interbancario
  email: varchar("email"), // Para PayPal
  telefono: varchar("telefono", { length: 20 }), // Para Plin/Yape
  titular: varchar("titular", { length: 200 }),
  moneda: varchar("moneda", { length: 10 }).default("PEN"), // PEN, USD, EUR
  esPlataforma: boolean("es_plataforma").default(false), // true = cuenta de la plataforma para recibir pagos
  activo: boolean("activo").default(true),
  verificado: boolean("verificado").default(false),
  orden: integer("orden").default(0),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMetodoPagoSchema = createInsertSchema(metodosPago).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMetodoPago = z.infer<typeof insertMetodoPagoSchema>;
export type MetodoPago = typeof metodosPago.$inferSelect;

// ============================================================
// MONEDAS Y TIPOS DE CAMBIO
// ============================================================
export const monedas = pgTable("monedas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo", { length: 10 }).notNull().unique(), // PEN, USD, EUR
  nombre: varchar("nombre", { length: 50 }).notNull(), // Soles, Dólares, Euros
  simbolo: varchar("simbolo", { length: 5 }).notNull(), // S/, $, €
  tasaCambioAPEN: decimal("tasa_cambio_a_pen", { precision: 10, scale: 4 }).default("1"), // Ej: 1 USD = 3.70 PEN
  activo: boolean("activo").default(true),
  esPrincipal: boolean("es_principal").default(false), // PEN es la principal
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMonedaSchema = createInsertSchema(monedas).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMoneda = z.infer<typeof insertMonedaSchema>;
export type Moneda = typeof monedas.$inferSelect;

// ============================================================
// TASAS DE CAMBIO LOCALES (Cambistas)
// ============================================================
export const tasasCambioLocales = pgTable("tasas_cambio_locales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  cambistaId: varchar("cambista_id").notNull().references(() => usuarios.id),
  monedaOrigenCodigo: varchar("moneda_origen_codigo", { length: 10 }).notNull(), // PEN, USD, CLP, ARS, BOB
  monedaDestinoCodigo: varchar("moneda_destino_codigo", { length: 10 }).notNull(),
  tasaCompra: decimal("tasa_compra", { precision: 12, scale: 6 }).notNull(), // Tasa al comprar moneda origen
  tasaVenta: decimal("tasa_venta", { precision: 12, scale: 6 }).notNull(), // Tasa al vender moneda origen
  ubicacion: varchar("ubicacion", { length: 200 }), // Ubicación del cambista
  gpsLatitud: real("gps_latitud"),
  gpsLongitud: real("gps_longitud"),
  horarioAtencion: varchar("horario_atencion", { length: 200 }),
  telefono: varchar("telefono", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  activo: boolean("activo").default(true),
  verificado: boolean("verificado").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTasaCambioLocalSchema = createInsertSchema(tasasCambioLocales).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTasaCambioLocal = z.infer<typeof insertTasaCambioLocalSchema>;
export type TasaCambioLocal = typeof tasasCambioLocales.$inferSelect;

// ============================================================
// HISTORIAL DE TASAS DE CAMBIO (Registro de cambios de cambistas)
// ============================================================
export const historialTasasCambio = pgTable("historial_tasas_cambio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cambistaId: varchar("cambista_id").notNull().references(() => usuarios.id),
  tasaLocalId: varchar("tasa_local_id").references(() => tasasCambioLocales.id),
  monedaOrigenCodigo: varchar("moneda_origen_codigo", { length: 10 }).notNull(),
  monedaDestinoCodigo: varchar("moneda_destino_codigo", { length: 10 }).notNull(),
  tasaCompraAnterior: decimal("tasa_compra_anterior", { precision: 12, scale: 6 }),
  tasaVentaAnterior: decimal("tasa_venta_anterior", { precision: 12, scale: 6 }),
  tasaCompraNueva: decimal("tasa_compra_nueva", { precision: 12, scale: 6 }).notNull(),
  tasaVentaNueva: decimal("tasa_venta_nueva", { precision: 12, scale: 6 }).notNull(),
  tipoAccion: varchar("tipo_accion", { length: 20 }).notNull().default("actualizacion"), // creacion, actualizacion
  ipOrigen: varchar("ip_origen", { length: 45 }),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertHistorialTasaCambioSchema = createInsertSchema(historialTasasCambio).omit({ id: true, createdAt: true });
export type InsertHistorialTasaCambio = z.infer<typeof insertHistorialTasaCambioSchema>;
export type HistorialTasaCambio = typeof historialTasasCambio.$inferSelect;

// ============================================================
// CONFIGURACIÓN DE MONEDAS (Calculadora)
// ============================================================
export const configuracionMonedas = pgTable("configuracion_monedas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codigo: varchar("codigo", { length: 10 }).notNull().unique(), // PEN, USD, CLP, ARS, BOB
  nombre: varchar("nombre", { length: 100 }).notNull(),
  nombreCorto: varchar("nombre_corto", { length: 50 }).notNull(), // Sol, Dólar, Peso Chileno
  simbolo: varchar("simbolo", { length: 10 }).notNull(), // S/, $, $CLP, $ARS, Bs
  banderaUrl: varchar("bandera_url", { length: 255 }), // URL de bandera del país
  tasaPromedioInternet: decimal("tasa_promedio_internet", { precision: 12, scale: 6 }), // Tasa promedio de internet (vs PEN)
  tasaPromedioLocal: decimal("tasa_promedio_local", { precision: 12, scale: 6 }), // Promedio de cambistas locales
  esPrincipal: boolean("es_principal").default(false), // PEN es principal
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConfiguracionMonedaSchema = createInsertSchema(configuracionMonedas).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConfiguracionMoneda = z.infer<typeof insertConfiguracionMonedaSchema>;
export type ConfiguracionMoneda = typeof configuracionMonedas.$inferSelect;

// ============================================================
// SOLICITUDES DE SALDO (Recargas y Retiros)
// ============================================================
export const solicitudesSaldo = pgTable("solicitudes_saldo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  tipo: varchar("tipo", { length: 20 }).notNull(), // 'recarga', 'retiro'
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  moneda: varchar("moneda", { length: 10 }).default("PEN"),
  metodoPagoId: varchar("metodo_pago_id").references(() => metodosPago.id),
  metodoPagoDestino: varchar("metodo_pago_destino"), // Descripción del método de destino
  comprobante: varchar("comprobante"), // URL imagen de comprobante
  numeroOperacion: varchar("numero_operacion", { length: 100 }),
  estado: varchar("estado", { length: 20 }).default("pendiente"), // 'pendiente', 'aprobado', 'rechazado', 'observado', 'cancelado'
  motivoRechazo: text("motivo_rechazo"),
  aprobadoPor: varchar("aprobado_por").references(() => usuarios.id),
  fechaAprobacion: timestamp("fecha_aprobacion"),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSolicitudSaldoSchema = createInsertSchema(solicitudesSaldo).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSolicitudSaldo = z.infer<typeof insertSolicitudSaldoSchema>;
export type SolicitudSaldo = typeof solicitudesSaldo.$inferSelect;

// ============================================================
// SALDOS DE USUARIOS (caché de saldo actual)
// ============================================================
export const saldosUsuarios = pgTable("saldos_usuarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id).unique(),
  saldo: decimal("saldo", { precision: 12, scale: 2 }).default("0").notNull(),
  monedaPreferida: varchar("moneda_preferida", { length: 10 }).default("PEN"),
  totalIngresos: decimal("total_ingresos", { precision: 12, scale: 2 }).default("0"),
  totalEgresos: decimal("total_egresos", { precision: 12, scale: 2 }).default("0"),
  ultimaActualizacion: timestamp("ultima_actualizacion").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSaldoUsuarioSchema = createInsertSchema(saldosUsuarios).omit({ id: true, createdAt: true });
export type InsertSaldoUsuario = z.infer<typeof insertSaldoUsuarioSchema>;
export type SaldoUsuario = typeof saldosUsuarios.$inferSelect;

// Expandir configuración de saldos con más campos
export const insertConfiguracionSaldosSchema = createInsertSchema(configuracionSaldos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConfiguracionSaldos = z.infer<typeof insertConfiguracionSaldosSchema>;
export type ConfiguracionSaldos = typeof configuracionSaldos.$inferSelect;

// ============================================================
// PLANES DE MEMBRESÍA (configurados por super admin)
// ============================================================
export const planesMembresia = pgTable("planes_membresia", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  duracionMeses: integer("duracion_meses").notNull(), // 1, 3, 6, 12
  precioNormal: decimal("precio_normal", { precision: 10, scale: 2 }).notNull(),
  precioDescuento: decimal("precio_descuento", { precision: 10, scale: 2 }),
  porcentajeDescuento: integer("porcentaje_descuento"),
  beneficios: json("beneficios").$type<string[]>(),
  productosIncluidos: integer("productos_incluidos").default(0), // Cuántos productos puede crear
  destacado: boolean("destacado").default(false),
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlanMembresiaSchema = createInsertSchema(planesMembresia).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlanMembresia = z.infer<typeof insertPlanMembresiaSchema>;
export type PlanMembresia = typeof planesMembresia.$inferSelect;

// ============================================================
// MEMBRESÍAS DE USUARIOS
// ============================================================
export const membresiasUsuarios = pgTable("membresias_usuarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  planId: varchar("plan_id").notNull().references(() => planesMembresia.id),
  fechaInicio: timestamp("fecha_inicio").notNull().defaultNow(),
  fechaFin: timestamp("fecha_fin").notNull(),
  estado: varchar("estado", { length: 20 }).default("activa"), // 'activa', 'expirada', 'cancelada'
  productosCreados: integer("productos_creados").default(0),
  montoTotal: decimal("monto_total", { precision: 10, scale: 2 }).notNull(),
  metodoPago: varchar("metodo_pago", { length: 50 }),
  transaccionId: varchar("transaccion_id"),
  renovacionAutomatica: boolean("renovacion_automatica").default(false),
  esCortesia: boolean("es_cortesia").default(false),
  asignadoPor: varchar("asignado_por").references(() => usuarios.id),
  motivoCortesia: text("motivo_cortesia"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMembresiaUsuarioSchema = createInsertSchema(membresiasUsuarios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMembresiaUsuario = z.infer<typeof insertMembresiaUsuarioSchema>;
export type MembresiaUsuario = typeof membresiasUsuarios.$inferSelect;

// ============================================================
// CATEGORÍAS DE PRODUCTOS DE USUARIO
// ============================================================
export const categoriasProductosUsuario = pgTable("categorias_productos_usuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  icono: varchar("icono", { length: 50 }),
  imagenUrl: varchar("imagen_url"),
  categoriaPadreId: varchar("categoria_padre_id").references((): any => categoriasProductosUsuario.id),
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategoriaProductoUsuarioSchema = createInsertSchema(categoriasProductosUsuario).omit({ id: true, createdAt: true });
export type InsertCategoriaProductoUsuario = z.infer<typeof insertCategoriaProductoUsuarioSchema>;
export type CategoriaProductoUsuario = typeof categoriasProductosUsuario.$inferSelect;

// ============================================================
// PRODUCTOS DE USUARIO (para locales comerciales y vendedores)
// ============================================================
export const productosUsuario = pgTable("productos_usuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  categoriaId: varchar("categoria_id").references(() => categoriasProductosUsuario.id),
  subcategoriaId: varchar("subcategoria_id").references(() => categoriasProductosUsuario.id),
  codigo: varchar("codigo", { length: 50 }),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  precio: decimal("precio", { precision: 10, scale: 2 }).notNull(),
  precioOferta: decimal("precio_oferta", { precision: 10, scale: 2 }),
  moneda: varchar("moneda", { length: 10 }).default("PEN"),
  imagenes: json("imagenes").$type<string[]>(),
  stock: integer("stock"),
  disponible: boolean("disponible").default(true),
  destacado: boolean("destacado").default(false),
  gpsLatitud: real("gps_latitud"),
  gpsLongitud: real("gps_longitud"),
  direccion: text("direccion"),
  costoCreacion: decimal("costo_creacion", { precision: 10, scale: 2 }).default("0"),
  likes: integer("likes").default(0),
  favoritos: integer("favoritos").default(0),
  compartidos: integer("compartidos").default(0),
  vistas: integer("vistas").default(0),
  estado: varchar("estado", { length: 20 }).default("activo"), // 'activo', 'pausado', 'eliminado'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductoUsuarioSchema = createInsertSchema(productosUsuario).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductoUsuario = z.infer<typeof insertProductoUsuarioSchema>;
export type ProductoUsuario = typeof productosUsuario.$inferSelect;

// ============================================================
// CONFIGURACIÓN DE COSTOS (para creación de productos, servicios, etc.)
// ============================================================
export const configuracionCostos = pgTable("configuracion_costos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipoServicio: varchar("tipo_servicio", { length: 50 }).notNull().unique(), // 'crear_producto', 'llamada_taxi', 'delivery', 'publicidad', etc.
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  montoFijo: decimal("monto_fijo", { precision: 10, scale: 2 }).default("0"),
  porcentaje: decimal("porcentaje", { precision: 5, scale: 2 }).default("0"), // Porcentaje del precio del producto
  usarMontoFijo: boolean("usar_monto_fijo").default(true), // true = monto fijo, false = porcentaje
  saldoMinimo: decimal("saldo_minimo", { precision: 10, scale: 2 }).default("0.50"), // Saldo mínimo requerido
  activo: boolean("activo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConfiguracionCostoSchema = createInsertSchema(configuracionCostos).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConfiguracionCosto = z.infer<typeof insertConfiguracionCostoSchema>;
export type ConfiguracionCosto = typeof configuracionCostos.$inferSelect;

// ============================================================
// CATÁLOGOS DE LOCALES COMERCIALES (cartas, menús completos)
// Estructura según Figma Frame 35: Logo + Nombre + Redes Sociales + Ubicación
// ============================================================
export const catalogosLocales = pgTable("catalogos_locales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  bannerUrl: varchar("banner_url"),
  direccion: text("direccion"),
  gpsLatitud: real("gps_latitud"),
  gpsLongitud: real("gps_longitud"),
  telefono: varchar("telefono", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  horario: varchar("horario", { length: 200 }),
  // Ubicación geográfica (para filtros por país/ciudad)
  paisId: varchar("pais_id").references(() => paises.id),
  ciudadId: varchar("ciudad_id").references(() => ciudades.id),
  // Redes Sociales (Figma Frame 35)
  facebook: varchar("facebook"),
  instagram: varchar("instagram"),
  tiktok: varchar("tiktok"),
  youtube: varchar("youtube"),
  pinterest: varchar("pinterest"),
  paginaWeb: varchar("pagina_web"),
  // Estado y métricas
  activo: boolean("activo").default(true),
  destacado: boolean("destacado").default(false),
  verificado: boolean("verificado").default(false),
  totalFavoritos: integer("total_favoritos").default(0),
  totalVistas: integer("total_vistas").default(0),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCatalogoLocalSchema = createInsertSchema(catalogosLocales).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCatalogoLocal = z.infer<typeof insertCatalogoLocalSchema>;
export type CatalogoLocal = typeof catalogosLocales.$inferSelect;

// ============================================================
// CATEGORÍAS DE CATÁLOGOS (ej: 1.00 PIZZAS CLASICAS, 2.00 PIZZAS PREMIUM)
// Código numérico jerárquico según Figma Frame 35
// ============================================================
export const categoriasCatalogo = pgTable("categorias_catalogo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  catalogoId: varchar("catalogo_id").notNull().references(() => catalogosLocales.id),
  codigo: varchar("codigo", { length: 10 }).notNull(), // "1.00", "2.00", "3.00" - código visible en el catálogo
  nombre: varchar("nombre", { length: 100 }).notNull(),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url"),
  orden: integer("orden").default(0),
  activo: boolean("activo").default(true),
  // Etiquetas de tamaños personalizables por categoría (Figma: Personal, Mediana, Familiar, Extra)
  etiquetaPrecio1: varchar("etiqueta_precio_1", { length: 50 }).default("Personal"),
  etiquetaPrecio2: varchar("etiqueta_precio_2", { length: 50 }).default("Mediana"),
  etiquetaPrecio3: varchar("etiqueta_precio_3", { length: 50 }).default("Familiar"),
  etiquetaPrecio4: varchar("etiqueta_precio_4", { length: 50 }).default("Extra"),
  // Checkboxes para habilitar/deshabilitar precios por categoría
  habilitarPrecio1: boolean("habilitar_precio_1").default(true),
  habilitarPrecio2: boolean("habilitar_precio_2").default(true),
  habilitarPrecio3: boolean("habilitar_precio_3").default(true),
  habilitarPrecio4: boolean("habilitar_precio_4").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCategoriaCatalogoSchema = createInsertSchema(categoriasCatalogo).omit({ id: true, createdAt: true });
export type InsertCategoriaCatalogo = z.infer<typeof insertCategoriaCatalogoSchema>;
export type CategoriaCatalogo = typeof categoriasCatalogo.$inferSelect;

// ============================================================
// ITEMS DE CATÁLOGO / PRODUCTOS (subcategorías según Figma Frame 35)
// Código: 1.01, 1.02, 1.03 = subcategorías de categoría 1.00
// Sistema de 4 precios flexible: solo se muestran los que tienen valor
// ============================================================
export const itemsCatalogo = pgTable("items_catalogo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  catalogoId: varchar("catalogo_id").notNull().references(() => catalogosLocales.id),
  categoriaId: varchar("categoria_id").references(() => categoriasCatalogo.id),
  codigo: varchar("codigo", { length: 10 }), // "1.01", "1.02", "2.01" - subcódigo del producto
  nombre: varchar("nombre", { length: 200 }).notNull(),
  descripcion: text("descripcion"),
  // Ubicación geográfica (heredada del catálogo al momento de crear)
  paisId: varchar("pais_id").references(() => paises.id),
  ciudadId: varchar("ciudad_id").references(() => ciudades.id),
  // Sistema de 4 precios (Figma Frame 35: Personal, Mediana, Familiar, Extra)
  // Solo se mostrarán los precios que tengan valor (flexible)
  precio1: decimal("precio_1", { precision: 10, scale: 2 }), // Personal
  precio2: decimal("precio_2", { precision: 10, scale: 2 }), // Mediana
  precio3: decimal("precio_3", { precision: 10, scale: 2 }), // Familiar
  precio4: decimal("precio_4", { precision: 10, scale: 2 }), // Extra
  // Etiquetas personalizables para cada precio (ej: "Personal", "Mitad", "1/4", "Promoción")
  etiquetaPrecio1: varchar("etiqueta_precio_1", { length: 50 }).default("Personal"),
  etiquetaPrecio2: varchar("etiqueta_precio_2", { length: 50 }).default("Mediana"),
  etiquetaPrecio3: varchar("etiqueta_precio_3", { length: 50 }).default("Familiar"),
  etiquetaPrecio4: varchar("etiqueta_precio_4", { length: 50 }).default("Extra"),
  // Campos legacy para compatibilidad
  precio: decimal("precio", { precision: 10, scale: 2 }),
  precioOferta: decimal("precio_oferta", { precision: 10, scale: 2 }),
  imagenUrl: varchar("imagen_url"),
  ingredientes: text("ingredientes"),
  tiempoPreparacion: varchar("tiempo_preparacion", { length: 50 }),
  disponible: boolean("disponible").default(true),
  destacado: boolean("destacado").default(false),
  // Métricas de interacción social (Figma: botones corazón, estrella, compartir)
  likes: integer("likes").default(0),
  favoritos: integer("favoritos").default(0),
  compartidos: integer("compartidos").default(0),
  vistas: integer("vistas").default(0),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertItemCatalogoSchema = createInsertSchema(itemsCatalogo).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertItemCatalogo = z.infer<typeof insertItemCatalogoSchema>;
export type ItemCatalogo = typeof itemsCatalogo.$inferSelect;

// ============================================================
// FAVORITOS DE PRODUCTOS (extensión para productos, no solo publicidad)
// ============================================================
export const favoritosProductos = pgTable("favoritos_productos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  productoUsuarioId: varchar("producto_usuario_id").references(() => productosUsuario.id),
  itemCatalogoId: varchar("item_catalogo_id").references(() => itemsCatalogo.id),
  tipoProducto: varchar("tipo_producto", { length: 50 }).notNull(), // 'producto_usuario', 'item_catalogo'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFavoritoProducto: unique().on(table.usuarioId, table.productoUsuarioId),
  uniqueFavoritoItem: unique().on(table.usuarioId, table.itemCatalogoId),
}));

export const insertFavoritoProductoSchema = createInsertSchema(favoritosProductos).omit({ id: true, createdAt: true });
export type InsertFavoritoProducto = z.infer<typeof insertFavoritoProductoSchema>;
export type FavoritoProducto = typeof favoritosProductos.$inferSelect;

// ============================================================
// INTERACCIONES DE PRODUCTOS (likes, favoritos, compartidos)
// ============================================================
export const interaccionesProductos = pgTable("interacciones_productos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  productoUsuarioId: varchar("producto_usuario_id").references(() => productosUsuario.id),
  itemCatalogoId: varchar("item_catalogo_id").references(() => itemsCatalogo.id),
  tipoInteraccion: varchar("tipo_interaccion", { length: 50 }).notNull(), // 'like', 'favorito', 'compartido', 'vista'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInteraccionProductoSchema = createInsertSchema(interaccionesProductos).omit({ id: true, createdAt: true });
export type InsertInteraccionProducto = z.infer<typeof insertInteraccionProductoSchema>;
export type InteraccionProducto = typeof interaccionesProductos.$inferSelect;

// ============================================================
// TYPE ALIASES (para compatibilidad con código existente)
// ============================================================
export type InsertPublicidad = PublicidadInsert;
export type InsertServicio = ServicioInsert;
export type InsertProductoDelivery = ProductoDeliveryInsert;
export type InsertGrupoChat = GrupoChatInsert;
export type InsertEmergencia = EmergenciaInsert;
export type InsertViajeTaxi = ViajeTaxiInsert;
export type InsertPedidoDelivery = PedidoDeliveryInsert;
export type InsertRadioOnline = RadioOnlineInsert;
export type InsertListaMp3 = ListaMp3Insert;
export type InsertArchivoMp3 = ArchivoMp3Insert;
export { viajeTaxi as viajesTaxi };

// ============================================================
// REGISTRO DE AUDITORÍA - Log de todas las actividades del sistema
// ============================================================
export const registroAuditoria = pgTable("registro_auditoria", {
  id: serial("id").primaryKey(),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  usuarioNombre: varchar("usuario_nombre", { length: 255 }),
  usuarioRol: varchar("usuario_rol", { length: 100 }),
  tipoAccion: varchar("tipo_accion", { length: 50 }).notNull(), // 'crear', 'modificar', 'eliminar', 'suspender', 'activar', 'aprobar', 'rechazar'
  entidad: varchar("entidad", { length: 100 }).notNull(), // nombre de la tabla/entidad afectada
  entidadId: varchar("entidad_id", { length: 255 }), // ID del registro afectado
  descripcion: text("descripcion"), // descripción legible de la acción
  datosAnteriores: text("datos_anteriores"), // JSON con datos antes del cambio
  datosNuevos: text("datos_nuevos"), // JSON con datos después del cambio
  ip: varchar("ip", { length: 50 }),
  userAgent: text("user_agent"),
  modulo: varchar("modulo", { length: 100 }), // 'cartera', 'usuarios', 'locales', 'productos', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRegistroAuditoriaSchema = createInsertSchema(registroAuditoria).omit({ id: true, createdAt: true });
export type InsertRegistroAuditoria = z.infer<typeof insertRegistroAuditoriaSchema>;
export type RegistroAuditoria = typeof registroAuditoria.$inferSelect;

// ============================================================
// WIDGETS EMBEBIBLES - Sistema de widgets para compartir en otros sitios
// ============================================================
export const widgetsEmbebibles = pgTable("widgets_embebibles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  tipo: varchar("tipo", { length: 100 }).notNull(), // 'carrusel_logos', 'slider_principal', 'logos_servicios', 'popup_emergencia', 'encuestas', 'radio_listas', 'productos_destacados', 'productos_recientes', 'categorias_servicios'
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
  // Configuración del widget
  ancho: varchar("ancho", { length: 50 }).default("100%"),
  alto: varchar("alto", { length: 50 }).default("auto"),
  colorFondo: varchar("color_fondo", { length: 20 }).default("transparent"),
  colorTexto: varchar("color_texto", { length: 20 }),
  bordes: boolean("bordes").default(false),
  autoplay: boolean("autoplay").default(true),
  intervalo: integer("intervalo").default(5000), // milisegundos para autoplay
  itemsPorVista: integer("items_por_vista").default(4),
  mostrarControles: boolean("mostrar_controles").default(true),
  estilosPersonalizados: text("estilos_personalizados"), // CSS adicional
  // Filtros de contenido
  categoriaId: varchar("categoria_id"),
  limite: integer("limite").default(10),
  orden: varchar("orden", { length: 50 }).default("reciente"), // 'reciente', 'destacado', 'aleatorio'
  // Control de acceso
  dominiosPermitidos: text("dominios_permitidos").array(), // null = todos permitidos
  requiereApiKey: boolean("requiere_api_key").default(false),
  apiKey: varchar("api_key", { length: 64 }),
  // Estadísticas
  totalVisualizaciones: integer("total_visualizaciones").default(0),
  totalClicks: integer("total_clicks").default(0),
  // Metadatos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertWidgetEmbebibleSchema = createInsertSchema(widgetsEmbebibles).omit({ id: true, createdAt: true, updatedAt: true, totalVisualizaciones: true, totalClicks: true });
export type InsertWidgetEmbebible = z.infer<typeof insertWidgetEmbebibleSchema>;
export type WidgetEmbebible = typeof widgetsEmbebibles.$inferSelect;

// ============================================================
// CARRITO DE COMPRAS - Items temporales antes del pedido
// ============================================================
export const carritoCompras = pgTable("carrito_compras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  itemCatalogoId: varchar("item_catalogo_id").references(() => itemsCatalogo.id),
  productoUsuarioId: varchar("producto_usuario_id").references(() => productosUsuario.id),
  tipoProducto: varchar("tipo_producto", { length: 50 }).notNull(), // 'item_catalogo', 'producto_usuario'
  cantidad: integer("cantidad").default(1).notNull(),
  precioSeleccionado: integer("precio_seleccionado").default(1), // 1, 2, 3, 4 (qué precio se seleccionó)
  etiquetaPrecio: varchar("etiqueta_precio", { length: 50 }),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  monedaOriginal: varchar("moneda_original", { length: 10 }).default("PEN"),
  catalogoId: varchar("catalogo_id").references(() => catalogosLocales.id),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCarritoComprasSchema = createInsertSchema(carritoCompras).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCarritoCompras = z.infer<typeof insertCarritoComprasSchema>;
export type CarritoCompras = typeof carritoCompras.$inferSelect;

// ============================================================
// PEDIDOS - Registro de pedidos realizados
// ============================================================
export const pedidos = pgTable("pedidos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroPedido: serial("numero_pedido").notNull(), // Auto-incrementable para referencia
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  catalogoId: varchar("catalogo_id").references(() => catalogosLocales.id),
  localComercialId: varchar("local_comercial_id").references(() => usuarios.id), // Dueño del local
  // Totales y moneda
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  costoDelivery: decimal("costo_delivery", { precision: 10, scale: 2 }).default("0"),
  descuento: decimal("descuento", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  moneda: varchar("moneda", { length: 10 }).default("PEN"),
  tasaCambioUsada: decimal("tasa_cambio_usada", { precision: 10, scale: 4 }),
  // Tipo de entrega
  tipoEntrega: varchar("tipo_entrega", { length: 50 }).default("recoger"), // 'recoger', 'delivery'
  direccionEntrega: text("direccion_entrega"),
  latitudEntrega: decimal("latitud_entrega", { precision: 10, scale: 8 }),
  longitudEntrega: decimal("longitud_entrega", { precision: 11, scale: 8 }),
  referenciaEntrega: text("referencia_entrega"),
  // Estado del pedido (7 estados)
  estado: varchar("estado", { length: 50 }).default("pendiente"), // 'pendiente', 'aceptado', 'preparando', 'listo', 'en_camino', 'entregado', 'confirmado'
  estadoAnterior: varchar("estado_anterior", { length: 50 }),
  // Pago
  metodoPago: varchar("metodo_pago", { length: 50 }).default("billetera"), // 'billetera', 'efectivo', 'yape', 'plin'
  estadoPago: varchar("estado_pago", { length: 50 }).default("pendiente"), // 'pendiente', 'pagado', 'reembolsado'
  transaccionBilleteraId: varchar("transaccion_billetera_id"),
  // Notas y comunicación
  notasCliente: text("notas_cliente"),
  notasLocal: text("notas_local"),
  // Pedidos adicionales (texto libre del cliente, ej: "1 porción de papa, pan al ajo")
  pedidoAdicional: text("pedido_adicional"),
  montoAdicional: decimal("monto_adicional", { precision: 10, scale: 2 }).default("0"),
  estadoMontoAdicional: varchar("estado_monto_adicional", { length: 50 }).default("pendiente"), // 'pendiente', 'confirmado', 'rechazado'
  // Pago delegado a otro usuario
  usuarioPagadorId: varchar("usuario_pagador_id").references(() => usuarios.id),
  pagoDelegado: boolean("pago_delegado").default(false),
  fechaDelegacion: timestamp("fecha_delegacion"),
  // Tiempos
  tiempoEstimadoPreparacion: integer("tiempo_estimado_preparacion"), // minutos
  horaEstimadaEntrega: timestamp("hora_estimada_entrega"),
  // Fechas de estados
  fechaAceptado: timestamp("fecha_aceptado"),
  fechaPreparando: timestamp("fecha_preparando"),
  fechaListo: timestamp("fecha_listo"),
  fechaEnCamino: timestamp("fecha_en_camino"),
  fechaEntregado: timestamp("fecha_entregado"),
  fechaConfirmado: timestamp("fecha_confirmado"),
  fechaCancelado: timestamp("fecha_cancelado"),
  motivoCancelacion: text("motivo_cancelacion"),
  canceladoPor: varchar("cancelado_por", { length: 50 }), // 'usuario', 'local', 'sistema'
  // Delivery asignado
  deliveryId: varchar("delivery_id").references(() => usuarios.id),
  deliveryTipo: varchar("delivery_tipo", { length: 50 }), // 'taxi', 'moto'
  // Calificación
  calificacionLocal: integer("calificacion_local"),
  comentarioLocal: text("comentario_local"),
  calificacionDelivery: integer("calificacion_delivery"),
  comentarioDelivery: text("comentario_delivery"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPedidoSchema = createInsertSchema(pedidos).omit({ id: true, numeroPedido: true, createdAt: true, updatedAt: true });
export type InsertPedido = z.infer<typeof insertPedidoSchema>;
export type Pedido = typeof pedidos.$inferSelect;

// ============================================================
// ITEMS DE PEDIDO - Productos incluidos en cada pedido
// ============================================================
export const itemsPedido = pgTable("items_pedido", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pedidoId: varchar("pedido_id").notNull().references(() => pedidos.id, { onDelete: "cascade" }),
  itemCatalogoId: varchar("item_catalogo_id").references(() => itemsCatalogo.id),
  productoUsuarioId: varchar("producto_usuario_id").references(() => productosUsuario.id),
  tipoProducto: varchar("tipo_producto", { length: 50 }).notNull(),
  // Datos del producto al momento del pedido (snapshot)
  nombreProducto: varchar("nombre_producto", { length: 200 }).notNull(),
  descripcionProducto: text("descripcion_producto"),
  imagenProducto: varchar("imagen_producto"),
  // Precio y cantidad
  precioSeleccionado: integer("precio_seleccionado").default(1), // 1, 2, 3, 4
  etiquetaPrecio: varchar("etiqueta_precio", { length: 50 }),
  precioUnitario: decimal("precio_unitario", { precision: 10, scale: 2 }).notNull(),
  cantidad: integer("cantidad").default(1).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  // Notas específicas del item
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertItemPedidoSchema = createInsertSchema(itemsPedido).omit({ id: true, createdAt: true });
export type InsertItemPedido = z.infer<typeof insertItemPedidoSchema>;
export type ItemPedido = typeof itemsPedido.$inferSelect;

// ============================================================
// HISTORIAL DE ESTADOS DEL PEDIDO - Timeline de cambios
// ============================================================
export const historialEstadosPedido = pgTable("historial_estados_pedido", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pedidoId: varchar("pedido_id").notNull().references(() => pedidos.id, { onDelete: "cascade" }),
  estadoAnterior: varchar("estado_anterior", { length: 50 }),
  estadoNuevo: varchar("estado_nuevo", { length: 50 }).notNull(),
  descripcion: text("descripcion"),
  usuarioId: varchar("usuario_id").references(() => usuarios.id), // Quién hizo el cambio
  tipoUsuario: varchar("tipo_usuario", { length: 50 }), // 'cliente', 'local', 'delivery', 'sistema'
  metadata: text("metadata"), // JSON con datos adicionales
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHistorialEstadoPedidoSchema = createInsertSchema(historialEstadosPedido).omit({ id: true, createdAt: true });
export type InsertHistorialEstadoPedido = z.infer<typeof insertHistorialEstadoPedidoSchema>;
export type HistorialEstadoPedido = typeof historialEstadosPedido.$inferSelect;

// ============================================================
// SOLICITUDES DE DELIVERY - Asignación de repartidores
// ============================================================
export const solicitudesDelivery = pgTable("solicitudes_delivery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciudadId: varchar("ciudad_id"), // Separación por ciudad
  pedidoId: varchar("pedido_id").notNull().references(() => pedidos.id),
  localComercialId: varchar("local_comercial_id").references(() => usuarios.id),
  // Ubicaciones
  latitudOrigen: decimal("latitud_origen", { precision: 10, scale: 8 }),
  longitudOrigen: decimal("longitud_origen", { precision: 11, scale: 8 }),
  direccionOrigen: text("direccion_origen"),
  latitudDestino: decimal("latitud_destino", { precision: 10, scale: 8 }),
  longitudDestino: decimal("longitud_destino", { precision: 11, scale: 8 }),
  direccionDestino: text("direccion_destino"),
  // Tipo de vehículo solicitado
  tipoVehiculo: varchar("tipo_vehiculo", { length: 50 }).default("moto"), // 'moto', 'taxi', 'bicicleta'
  // Estado
  estado: varchar("estado", { length: 50 }).default("pendiente"), // 'pendiente', 'asignado', 'en_camino_recojo', 'recogido', 'en_camino_entrega', 'entregado', 'cancelado'
  // Delivery asignado
  deliveryId: varchar("delivery_id").references(() => usuarios.id),
  nombreDelivery: varchar("nombre_delivery", { length: 200 }),
  telefonoDelivery: varchar("telefono_delivery", { length: 20 }),
  vehiculoDelivery: varchar("vehiculo_delivery", { length: 100 }),
  placaDelivery: varchar("placa_delivery", { length: 20 }),
  // Tracking en tiempo real
  latitudActual: decimal("latitud_actual", { precision: 10, scale: 8 }),
  longitudActual: decimal("longitud_actual", { precision: 11, scale: 8 }),
  ultimaActualizacionUbicacion: timestamp("ultima_actualizacion_ubicacion"),
  // Costos
  costoEstimado: decimal("costo_estimado", { precision: 10, scale: 2 }),
  costoFinal: decimal("costo_final", { precision: 10, scale: 2 }),
  distanciaKm: decimal("distancia_km", { precision: 10, scale: 2 }),
  // Tiempos
  tiempoEstimadoMinutos: integer("tiempo_estimado_minutos"),
  fechaAsignado: timestamp("fecha_asignado"),
  fechaRecogido: timestamp("fecha_recogido"),
  fechaEntregado: timestamp("fecha_entregado"),
  fechaCancelado: timestamp("fecha_cancelado"),
  motivoCancelacion: text("motivo_cancelacion"),
  // Confirmaciones
  codigoConfirmacionRecojo: varchar("codigo_confirmacion_recojo", { length: 10 }),
  codigoConfirmacionEntrega: varchar("codigo_confirmacion_entrega", { length: 10 }),
  fotoRecojo: varchar("foto_recojo"),
  fotoEntrega: varchar("foto_entrega"),
  firmaEntrega: text("firma_entrega"), // Base64 de la firma
  // Calificación
  calificacionDelivery: integer("calificacion_delivery"),
  comentarioDelivery: text("comentario_delivery"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSolicitudDeliverySchema = createInsertSchema(solicitudesDelivery).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSolicitudDelivery = z.infer<typeof insertSolicitudDeliverySchema>;
export type SolicitudDelivery = typeof solicitudesDelivery.$inferSelect;

// ============================================================
// TRANSACCIONES DE PEDIDOS - Pagos y movimientos de billetera
// ============================================================
export const transaccionesPedidos = pgTable("transacciones_pedidos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pedidoId: varchar("pedido_id").notNull().references(() => pedidos.id),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  localComercialId: varchar("local_comercial_id").references(() => usuarios.id),
  deliveryId: varchar("delivery_id").references(() => usuarios.id),
  // Tipo de transacción
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'pago_pedido', 'comision_plataforma', 'pago_local', 'pago_delivery', 'reembolso'
  // Montos
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  moneda: varchar("moneda", { length: 10 }).default("PEN"),
  // Comisiones
  comisionPlataforma: decimal("comision_plataforma", { precision: 10, scale: 2 }).default("0"),
  porcentajeComision: decimal("porcentaje_comision", { precision: 5, scale: 2 }).default("0"),
  // Billetera
  billeteraOrigenId: varchar("billetera_origen_id"),
  billeteraDestinoId: varchar("billetera_destino_id"),
  saldoAnteriorOrigen: decimal("saldo_anterior_origen", { precision: 10, scale: 2 }),
  saldoNuevoOrigen: decimal("saldo_nuevo_origen", { precision: 10, scale: 2 }),
  saldoAnteriorDestino: decimal("saldo_anterior_destino", { precision: 10, scale: 2 }),
  saldoNuevoDestino: decimal("saldo_nuevo_destino", { precision: 10, scale: 2 }),
  // Estado
  estado: varchar("estado", { length: 50 }).default("completado"), // 'pendiente', 'completado', 'fallido', 'revertido'
  descripcion: text("descripcion"),
  referencia: varchar("referencia", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransaccionPedidoSchema = createInsertSchema(transaccionesPedidos).omit({ id: true, createdAt: true });
export type InsertTransaccionPedido = z.infer<typeof insertTransaccionPedidoSchema>;
export type TransaccionPedido = typeof transaccionesPedidos.$inferSelect;

// ============================================================
// FORMAS DE PAGO DEL NEGOCIO - Métodos de pago que acepta cada negocio
// ============================================================
export const formasPagoNegocio = pgTable("formas_pago_negocio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  negocioId: varchar("negocio_id").notNull().references(() => usuarios.id), // Usuario con rol 'local'
  catalogoId: varchar("catalogo_id").references(() => catalogosLocales.id), // Opcional: vincular a catálogo específico
  tipo: varchar("tipo", { length: 50 }).notNull(), // 'yape', 'plin', 'transferencia', 'efectivo', 'billetera'
  nombre: varchar("nombre", { length: 100 }).notNull(), // Nombre descriptivo
  // Datos según el tipo
  telefono: varchar("telefono", { length: 20 }), // Para Yape/Plin
  nombreTitular: varchar("nombre_titular", { length: 200 }), // Titular de cuenta
  banco: varchar("banco", { length: 100 }), // Nombre del banco
  numeroCuenta: varchar("numero_cuenta", { length: 100 }), // Número de cuenta
  cci: varchar("cci", { length: 30 }), // Código interbancario
  moneda: varchar("moneda", { length: 10 }).default("PEN"), // PEN, USD
  // QR y comprobante
  qrImagenUrl: varchar("qr_imagen_url"), // Imagen del QR de pago
  instrucciones: text("instrucciones"), // Instrucciones adicionales para el cliente
  // Configuración
  aceptaBilletera: boolean("acepta_billetera").default(true), // Si acepta pago con billetera de la app
  comisionPorcentaje: decimal("comision_porcentaje", { precision: 5, scale: 2 }).default("0"), // Comisión extra si aplica
  montoMinimo: decimal("monto_minimo", { precision: 10, scale: 2 }), // Monto mínimo para usar este método
  montoMaximo: decimal("monto_maximo", { precision: 10, scale: 2 }), // Monto máximo para usar este método
  // Estado y orden
  activo: boolean("activo").default(true),
  orden: integer("orden").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFormaPagoNegocioSchema = createInsertSchema(formasPagoNegocio).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFormaPagoNegocio = z.infer<typeof insertFormaPagoNegocioSchema>;
export type FormaPagoNegocio = typeof formasPagoNegocio.$inferSelect;

// ============================================================
// TICKETS DE FACTURACIÓN - Registro de todas las ventas/tickets emitidos
// ============================================================
export const ticketsFacturacion = pgTable("tickets_facturacion", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  numeroTicket: varchar("numero_ticket", { length: 50 }).notNull(), // APO-YYMMDD-XXXXXX
  negocioId: varchar("negocio_id").notNull().references(() => usuarios.id),
  pedidoId: varchar("pedido_id").references(() => pedidos.id),
  // Cliente que realizó la compra
  clienteId: varchar("cliente_id").references(() => usuarios.id),
  nombreCliente: varchar("nombre_cliente", { length: 200 }),
  telefonoCliente: varchar("telefono_cliente", { length: 20 }),
  // Descripción de la compra
  descripcionCompra: text("descripcion_compra"), // Resumen de los items
  itemsJson: text("items_json"), // JSON con detalles de cada item
  cantidadItems: integer("cantidad_items").default(0),
  // Montos
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  descuento: decimal("descuento", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  moneda: varchar("moneda", { length: 10 }).default("PEN"),
  // Método de pago
  metodoPago: varchar("metodo_pago", { length: 50 }),
  formaPagoId: varchar("forma_pago_id").references(() => formasPagoNegocio.id),
  voucherUrl: varchar("voucher_url"), // Imagen del voucher de pago
  // Quién atendió/creó el ticket
  empleadoId: varchar("empleado_id").references(() => usuarios.id),
  nombreEmpleado: varchar("nombre_empleado", { length: 200 }),
  funcionEmpleado: varchar("funcion_empleado", { length: 100 }),
  // Estado
  estado: varchar("estado", { length: 50 }).default("emitido"), // 'emitido', 'anulado', 'reembolsado'
  motivoAnulacion: text("motivo_anulacion"),
  // Datos adicionales
  notas: text("notas"),
  direccionEntrega: text("direccion_entrega"),
  tipoEntrega: varchar("tipo_entrega", { length: 50 }), // 'local', 'delivery', 'recojo'
  // Timestamps
  fechaEmision: timestamp("fecha_emision").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTicketFacturacionSchema = createInsertSchema(ticketsFacturacion).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTicketFacturacion = z.infer<typeof insertTicketFacturacionSchema>;
export type TicketFacturacion = typeof ticketsFacturacion.$inferSelect;
