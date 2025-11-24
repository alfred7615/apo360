import { pgTable, varchar, serial, text, integer, decimal, real, boolean, timestamp, json, date, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
]);

export const usuarios = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  telefono: varchar("telefono", { length: 20 }),
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
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;
export type Usuario = typeof usuarios.$inferSelect;

// ============================================================
// ROLES MÚLTIPLES POR USUARIO
// ============================================================
export const usuarioRoles = pgTable("usuario_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  rol: varchar("rol", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  id: varchar("id").primaryKey(),
  titulo: varchar("titulo"),
  descripcion: text("descripcion"),
  tipo: varchar("tipo"), // "carrusel_logos", "carrusel_principal", "popup"
  imagenUrl: varchar("imagen_url"),
  enlaceUrl: varchar("enlace_url"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  estado: varchar("estado").default("activo"), // "activo", "pausado", "finalizado"
  usuarioId: varchar("usuario_id"),
  orden: integer("orden"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertPublicidadSchema = createInsertSchema(publicidad).omit({ id: true, createdAt: true, updatedAt: true });
export type PublicidadInsert = z.infer<typeof insertPublicidadSchema>;
export type Publicidad = typeof publicidad.$inferSelect;

// ============================================================
// RADIOS ONLINE
// ============================================================
export const radiosOnline = pgTable("radios_online", {
  id: varchar("id").primaryKey().default("uuid()"),
  nombre: varchar("nombre").notNull(),
  url: varchar("url").notNull(),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  orden: integer("orden"),
  estado: varchar("estado").default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRadioOnlineSchema = createInsertSchema(radiosOnline).omit({ id: true, createdAt: true });
export type RadioOnlineInsert = z.infer<typeof insertRadioOnlineSchema>;
export type RadioOnline = typeof radiosOnline.$inferSelect;

// ============================================================
// ARCHIVOS MP3
// ============================================================
export const archivosMp3 = pgTable("archivos_mp3", {
  id: varchar("id").primaryKey().default("uuid()"),
  titulo: varchar("titulo").notNull(),
  categoria: varchar("categoria"), // "Rock", "Cumbia", "Éxitos", "Mix", "Romántica"
  archivoUrl: varchar("archivo_url").notNull(),
  duracion: integer("duracion"), // en segundos
  orden: integer("orden"),
  estado: varchar("estado").default("activo"),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGrupoChatSchema = createInsertSchema(gruposChat).omit({ id: true, createdAt: true });
export type GrupoChatInsert = z.infer<typeof insertGrupoChatSchema>;
export type GrupoChat = typeof gruposChat.$inferSelect;

// ============================================================
// MENSAJES
// ============================================================
export const mensajes = pgTable("mensajes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grupoId: varchar("grupo_id").references(() => gruposChat.id),
  remitenteId: varchar("remitente_id").notNull().references(() => usuarios.id),
  destinatarioId: varchar("destinatario_id").references(() => usuarios.id),
  contenido: text("contenido").notNull(),
  tipo: varchar("tipo", { length: 50 }).default("texto"),
  archivoUrl: varchar("archivo_url"),
  leido: boolean("leido").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMensajeSchema = createInsertSchema(mensajes).omit({ id: true, createdAt: true });
export type MensajeInsert = z.infer<typeof insertMensajeSchema>;
export type Mensaje = typeof mensajes.$inferSelect;

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
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertEmergenciaSchema = createInsertSchema(emergencias).omit({ id: true, createdAt: true });
export type EmergenciaInsert = z.infer<typeof insertEmergenciaSchema>;
export type Emergencia = typeof emergencias.$inferSelect;

// ============================================================
// VIAJES TAXI
// ============================================================
export const viajeTaxi = pgTable("viajes_taxi", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  id: varchar("id").primaryKey().default("uuid()"),
  titulo: varchar("titulo").notNull(),
  preguntas: json("preguntas").$type<{ pregunta: string; opciones: string[] }[]>(),
  imagenUrl: varchar("imagen_url"),
  estado: varchar("estado").default("activa"),
  respuestas: json("respuestas").$type<{ preguntaIndex: number; opcion: string; cantidad: number }[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// POPUP PUBLICITARIOS
// ============================================================
export const popupsPublicitarios = pgTable("popups_publicitarios", {
  id: varchar("id").primaryKey().default("uuid()"),
  titulo: varchar("titulo"),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url"),
  videoUrl: varchar("video_url"),
  duracionSegundos: integer("duracion_segundos"),
  puedeOmitir: boolean("puede_omitir").default(true),
  estado: varchar("estado").default("activo"),
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

export const insertEncuestaSchema = createInsertSchema(encuestas).omit({ id: true, createdAt: true });
export type InsertEncuesta = z.infer<typeof insertEncuestaSchema>;
export type Encuesta = typeof encuestas.$inferSelect;

export const insertPopupPublicitarioSchema = createInsertSchema(popupsPublicitarios).omit({ id: true, createdAt: true });
export type InsertPopupPublicitario = z.infer<typeof insertPopupPublicitarioSchema>;
export type PopupPublicitario = typeof popupsPublicitarios.$inferSelect;

// Export insert schemas for usuario_roles and administradores (defined earlier)
export const insertUsuarioRolSchema = createInsertSchema(usuarioRoles).omit({ id: true, createdAt: true });
export type InsertUsuarioRol = z.infer<typeof insertUsuarioRolSchema>;
export type UsuarioRol = typeof usuarioRoles.$inferSelect;

export const insertAdministradorSchema = createInsertSchema(administradores).omit({ id: true, createdAt: true });
export type InsertAdministrador = z.infer<typeof insertAdministradorSchema>;
export type Administrador = typeof administradores.$inferSelect;
