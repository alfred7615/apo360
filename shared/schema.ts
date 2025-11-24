import { pgTable, varchar, serial, text, integer, decimal, boolean, timestamp, json, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================
// USUARIOS Y ROLES
// ============================================================
export const rolesEnum = pgEnum("rol", [
  "super_admin",
  "admin_cartera",
  "admin_operaciones", 
  "supervisor",
  "usuario",
  "conductor",
  "local",
  "serenazgo",
  "policia",
]);

export const usuarios = pgTable("usuarios", {
  id: varchar("id").primaryKey(),
  telefonoPrimario: varchar("telefono_primario"),
  primerNombre: varchar("primer_nombre"),
  apellido: varchar("apellido"),
  email: varchar("email").unique(),
  saldo: decimal("saldo", { precision: 12, scale: 2 }).default("0.00"),
  enLinea: boolean("en_linea").default(false),
  ubicacionLatitud: decimal("ubicacion_latitud", { precision: 9, scale: 6 }),
  ubicacionLongitud: decimal("ubicacion_longitud", { precision: 9, scale: 6 }),
  rol: rolesEnum("rol").default("usuario"),
  estado: varchar("estado").default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// ROLES MÚLTIPLES POR USUARIO
// ============================================================
export const usuarioRoles = pgTable("usuario_roles", {
  id: serial("id").primaryKey(),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  rol: rolesEnum("rol"),
  asignadoEn: timestamp("asignado_en").defaultNow(),
});

// ============================================================
// ADMINISTRADORES DE SEGUNDO NIVEL
// ============================================================
export const administradores = pgTable("administradores", {
  id: serial("id").primaryKey(),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  tipo: varchar("tipo"), // "grupo_chat", "grupo_taxi", "servicio", "empresa", etc.
  referenceId: varchar("reference_id"), // ID del grupo/servicio/empresa
  descripcion: text("descripcion"),
  permisos: json("permisos").$type<string[]>(),
  estado: varchar("estado").default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// PUBLICIDAD
// ============================================================
export const publicidad = pgTable("publicidad", {
  id: varchar("id").primaryKey().default("uuid()"),
  titulo: varchar("titulo").notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo"), // "carrusel_logos", "carrusel_principal", "popup"
  imagenUrl: varchar("imagen_url"),
  enlace: varchar("enlace"),
  fechaInicio: date("fecha_inicio"),
  fechaFin: date("fecha_fin"),
  estado: varchar("estado").default("activo"), // "activo", "pausado", "finalizado"
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  costoSoles: decimal("costo_soles", { precision: 10, scale: 2 }),
  descuentoAplicado: decimal("descuento_aplicado", { precision: 10, scale: 2 }).default("0.00"),
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
  id: varchar("id").primaryKey().default("uuid()"),
  nombre: varchar("nombre").notNull(),
  categoria: varchar("categoria"), // "restaurante", "farmacia", "taller", etc.
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  imagenUrl: varchar("imagen_url"),
  telefonoContacto: varchar("telefono_contacto"),
  ubicacion: varchar("ubicacion"),
  latitud: decimal("latitud", { precision: 9, scale: 6 }),
  longitud: decimal("longitud", { precision: 9, scale: 6 }),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  estado: varchar("estado").default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServicioSchema = createInsertSchema(servicios).omit({ id: true, createdAt: true });
export type ServicioInsert = z.infer<typeof insertServicioSchema>;
export type Servicio = typeof servicios.$inferSelect;

// ============================================================
// PRODUCTOS DELIVERY
// ============================================================
export const productosDelivery = pgTable("productos_delivery", {
  id: varchar("id").primaryKey().default("uuid()"),
  servicioId: varchar("servicio_id").references(() => servicios.id),
  nombre: varchar("nombre").notNull(),
  descripcion: text("descripcion"),
  precio: decimal("precio", { precision: 10, scale: 2 }).notNull(),
  estado: varchar("estado").default("activo"),
});

export const insertProductoDeliverySchema = createInsertSchema(productosDelivery).omit({ id: true });
export type ProductoDeliveryInsert = z.infer<typeof insertProductoDeliverySchema>;
export type ProductoDelivery = typeof productosDelivery.$inferSelect;

// ============================================================
// GRUPOS DE CHAT
// ============================================================
export const gruposChat = pgTable("grupos_chat", {
  id: varchar("id").primaryKey().default("uuid()"),
  nombre: varchar("nombre").notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo"), // "comunidad", "taxi", "emergencia", "delivery"
  criadoPor: varchar("creado_por").references(() => usuarios.id),
  miembros: json("miembros").$type<string[]>(),
  estado: varchar("estado").default("activo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGrupoChatSchema = createInsertSchema(gruposChat).omit({ id: true, createdAt: true });
export type GrupoChatInsert = z.infer<typeof insertGrupoChatSchema>;
export type GrupoChat = typeof gruposChat.$inferSelect;

// ============================================================
// MENSAJES
// ============================================================
export const mensajes = pgTable("mensajes", {
  id: varchar("id").primaryKey().default("uuid()"),
  grupoChatId: varchar("grupo_chat_id").references(() => gruposChat.id),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  contenido: text("contenido"),
  tipo: varchar("tipo"), // "texto", "emergencia", "ubicacion"
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
  id: varchar("id").primaryKey().default("uuid()"),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  tipo: varchar("tipo"), // "policia", "105", "serenazgo", "samu", "bombero", "grua"
  descripcion: text("descripcion"),
  latitud: decimal("latitud", { precision: 9, scale: 6 }),
  longitud: decimal("longitud", { precision: 9, scale: 6 }),
  estado: varchar("estado").default("pendiente"), // "pendiente", "atendida", "cancelada"
  prioridad: varchar("prioridad").default("urgente"),
  notificadosGrupos: json("notificados_grupos").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergenciaSchema = createInsertSchema(emergencias).omit({ id: true, createdAt: true });
export type EmergenciaInsert = z.infer<typeof insertEmergenciaSchema>;
export type Emergencia = typeof emergencias.$inferSelect;

// ============================================================
// VIAJES TAXI
// ============================================================
export const viajeTaxi = pgTable("viaje_taxi", {
  id: varchar("id").primaryKey().default("uuid()"),
  pasajeroId: varchar("pasajero_id").references(() => usuarios.id),
  conductorId: varchar("conductor_id").references(() => usuarios.id),
  origen: varchar("origen"),
  destino: varchar("destino"),
  origenLat: decimal("origen_lat", { precision: 9, scale: 6 }),
  origenLng: decimal("origen_lng", { precision: 9, scale: 6 }),
  destinoLat: decimal("destino_lat", { precision: 9, scale: 6 }),
  destinoLng: decimal("destino_lng", { precision: 9, scale: 6 }),
  estado: varchar("estado").default("solicitado"), // "solicitado", "aceptado", "en_curso", "completado"
  tarifa: decimal("tarifa", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertViajeTaxiSchema = createInsertSchema(viajeTaxi).omit({ id: true, createdAt: true });
export type ViajeTaxiInsert = z.infer<typeof insertViajeTaxiSchema>;
export type ViajeTaxi = typeof viajeTaxi.$inferSelect;

// ============================================================
// PEDIDOS DELIVERY
// ============================================================
export const pedidosDelivery = pgTable("pedidos_delivery", {
  id: varchar("id").primaryKey().default("uuid()"),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  servicioId: varchar("servicio_id").references(() => servicios.id),
  conductorId: varchar("conductor_id").references(() => usuarios.id),
  productos: json("productos").$type<{ productoId: string; cantidad: number }[]>(),
  total: decimal("total", { precision: 10, scale: 2 }),
  estado: varchar("estado").default("pendiente"), // "pendiente", "preparando", "listo", "entregado"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPedidoDeliverySchema = createInsertSchema(pedidosDelivery).omit({ id: true, createdAt: true });
export type PedidoDeliveryInsert = z.infer<typeof insertPedidoDeliverySchema>;
export type PedidoDelivery = typeof pedidosDelivery.$inferSelect;

// ============================================================
// CONFIGURACIÓN DE SALDOS Y TARIFAS
// ============================================================
export const configuracionSaldos = pgTable("configuracion_saldos", {
  id: serial("id").primaryKey(),
  tipoTransaccion: varchar("tipo_transaccion"), // "publicidad", "taxi", "delivery", "chat", "comisión"
  porcentaje: decimal("porcentaje", { precision: 5, scale: 2 }),
  montoFijo: decimal("monto_fijo", { precision: 10, scale: 2 }),
  descripcion: text("descripcion"),
  activo: boolean("activo").default(true),
  updatedAt: timestamp("updated_at"),
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
