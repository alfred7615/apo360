import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================
// TABLAS DE AUTENTICACIÓN Y SESIONES (Replit Auth)
// ============================================================

// Tabla de sesiones - OBLIGATORIA para Replit Auth
export const sesiones = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Tabla de usuarios - OBLIGATORIA para Replit Auth
export const usuarios = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  telefono: varchar("telefono", { length: 20 }).unique(),
  primerNombre: varchar("first_name"),
  apellido: varchar("last_name"),
  imagenPerfil: varchar("profile_image_url"),
  rol: varchar("rol", { length: 50 }).notNull().default('usuario'), // super_admin, admin_cartera, admin_operaciones, supervisor, usuario, conductor, local
  estado: varchar("estado", { length: 20 }).default('activo'), // activo, inactivo, suspendido
  latitud: real("latitud"),
  longitud: real("longitud"),
  enLinea: boolean("en_linea").default(false),
  ultimaConexion: timestamp("ultima_conexion"),
  // Campos específicos para conductores
  modoTaxi: varchar("modo_taxi", { length: 20 }).default('pasajero'), // conductor, pasajero
  vehiculoModelo: varchar("vehiculo_modelo"),
  vehiculoPlaca: varchar("vehiculo_placa"),
  disponibleTaxi: boolean("disponible_taxi").default(false),
  // Campos específicos para locales de servicio
  nombreLocal: varchar("nombre_local"),
  categoriaLocal: varchar("categoria_local"), // restaurante, farmacia, taller, etc.
  direccionLocal: text("direccion_local"),
  logoLocal: varchar("logo_local"),
  descripcionLocal: text("descripcion_local"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUsuarioSchema = createInsertSchema(usuarios);
export type UpsertUsuario = typeof usuarios.$inferInsert;
export type Usuario = typeof usuarios.$inferSelect;

// ============================================================
// SISTEMA DE PUBLICIDAD
// ============================================================

export const publicidad = pgTable("publicidad", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tipo: varchar("tipo", { length: 50 }).notNull(), // carrusel_logos, carrusel_principal, servicios
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  imagenUrl: varchar("imagen_url").notNull(),
  enlaceUrl: varchar("enlace_url"),
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default('activo'), // activo, pausado, finalizado
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  usuarioId: varchar("usuario_id").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPublicidadSchema = createInsertSchema(publicidad).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPublicidad = z.infer<typeof insertPublicidadSchema>;
export type Publicidad = typeof publicidad.$inferSelect;

// ============================================================
// SERVICIOS LOCALES
// ============================================================

export const servicios = pgTable("servicios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  categoria: varchar("categoria", { length: 100 }).notNull(), // restaurante, farmacia, taller, etc.
  nombreServicio: varchar("nombre_servicio", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  direccion: text("direccion"),
  telefono: varchar("telefono", { length: 20 }),
  horario: text("horario"),
  estado: varchar("estado", { length: 20 }).default('activo'), // activo, pausado, inactivo
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServicioSchema = createInsertSchema(servicios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServicio = z.infer<typeof insertServicioSchema>;
export type Servicio = typeof servicios.$inferSelect;

// Productos/Ítems de delivery para cada servicio
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

export const insertProductoDeliverySchema = createInsertSchema(productosDelivery).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProductoDelivery = z.infer<typeof insertProductoDeliverySchema>;
export type ProductoDelivery = typeof productosDelivery.$inferSelect;

// ============================================================
// SISTEMA DE CHAT COMUNITARIO
// ============================================================

export const gruposChat = pgTable("grupos_chat", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  descripcion: text("descripcion"),
  tipo: varchar("tipo", { length: 50 }).notNull(), // comunitario, asociacion, emergencia, privado
  avatarUrl: varchar("avatar_url"),
  creadorId: varchar("creador_id").notNull().references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGrupoChatSchema = createInsertSchema(gruposChat).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGrupoChat = z.infer<typeof insertGrupoChatSchema>;
export type GrupoChat = typeof gruposChat.$inferSelect;

export const miembrosGrupo = pgTable("miembros_grupo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grupoId: varchar("grupo_id").notNull().references(() => gruposChat.id),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  rol: varchar("rol", { length: 50 }).default('miembro'), // admin, miembro
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMiembroGrupoSchema = createInsertSchema(miembrosGrupo).omit({ id: true, createdAt: true });
export type InsertMiembroGrupo = z.infer<typeof insertMiembroGrupoSchema>;
export type MiembroGrupo = typeof miembrosGrupo.$inferSelect;

export const mensajes = pgTable("mensajes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grupoId: varchar("grupo_id").references(() => gruposChat.id),
  remitenteId: varchar("remitente_id").notNull().references(() => usuarios.id),
  destinatarioId: varchar("destinatario_id").references(() => usuarios.id), // para mensajes privados
  contenido: text("contenido").notNull(),
  tipo: varchar("tipo", { length: 50 }).default('texto'), // texto, imagen, audio, ubicacion, emergencia
  archivoUrl: varchar("archivo_url"),
  leido: boolean("leido").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMensajeSchema = createInsertSchema(mensajes).omit({ id: true, createdAt: true });
export type InsertMensaje = z.infer<typeof insertMensajeSchema>;
export type Mensaje = typeof mensajes.$inferSelect;

// ============================================================
// SISTEMA DE EMERGENCIAS Y BOTÓN DE PÁNICO
// ============================================================

export const emergencias = pgTable("emergencias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  tipo: varchar("tipo", { length: 50 }).notNull(), // policia, 105, serenazgo, samu, bombero, grua, accidente
  descripcion: text("descripcion"),
  latitud: real("latitud").notNull(),
  longitud: real("longitud").notNull(),
  direccion: text("direccion"),
  estado: varchar("estado", { length: 50 }).default('pendiente'), // pendiente, atendiendo, resuelto, cancelado
  prioridad: varchar("prioridad", { length: 20 }).default('media'), // baja, media, alta, urgente
  gruposNotificados: text("grupos_notificados").array(), // IDs de grupos que fueron notificados
  entidadesNotificadas: text("entidades_notificadas").array(), // Entidades que atendieron
  atendidoPor: varchar("atendido_por").references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertEmergenciaSchema = createInsertSchema(emergencias).omit({ id: true, createdAt: true, resolvedAt: true });
export type InsertEmergencia = z.infer<typeof insertEmergenciaSchema>;
export type Emergencia = typeof emergencias.$inferSelect;

// ============================================================
// SISTEMA DE TAXI (estilo InDriver/Uber)
// ============================================================

export const viajesTaxi = pgTable("viajes_taxi", {
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
  estado: varchar("estado", { length: 50 }).default('solicitado'), // solicitado, aceptado, en_curso, completado, cancelado
  tipoServicio: varchar("tipo_servicio", { length: 50 }).default('taxi'), // taxi, delivery_urgente
  createdAt: timestamp("created_at").defaultNow(),
  iniciadoAt: timestamp("iniciado_at"),
  completadoAt: timestamp("completado_at"),
});

export const insertViajeTaxiSchema = createInsertSchema(viajesTaxi).omit({ id: true, createdAt: true, iniciadoAt: true, completadoAt: true });
export type InsertViajeTaxi = z.infer<typeof insertViajeTaxiSchema>;
export type ViajeTaxi = typeof viajesTaxi.$inferSelect;

// ============================================================
// SISTEMA DE DELIVERY
// ============================================================

export const pedidosDelivery = pgTable("pedidos_delivery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  servicioId: varchar("servicio_id").notNull().references(() => servicios.id),
  productos: jsonb("productos").notNull(), // Array de {productoId, nombre, cantidad, precio}
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  direccionEntrega: text("direccion_entrega").notNull(),
  latitud: real("latitud"),
  longitud: real("longitud"),
  estado: varchar("estado", { length: 50 }).default('pendiente'), // pendiente, preparando, listo, en_camino, entregado, cancelado
  conductorId: varchar("conductor_id").references(() => usuarios.id),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow(),
  completadoAt: timestamp("completed_at"),
});

export const insertPedidoDeliverySchema = createInsertSchema(pedidosDelivery).omit({ id: true, createdAt: true, completadoAt: true });
export type InsertPedidoDelivery = z.infer<typeof insertPedidoDeliverySchema>;
export type PedidoDelivery = typeof pedidosDelivery.$inferSelect;

// ============================================================
// SISTEMA DE RADIO ONLINE Y AUDIO
// ============================================================

export const radiosOnline = pgTable("radios_online", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  url: text("url").notNull(),
  descripcion: text("descripcion"),
  logoUrl: varchar("logo_url"),
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default('activo'), // activo, pausado, inactivo
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRadioOnlineSchema = createInsertSchema(radiosOnline).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRadioOnline = z.infer<typeof insertRadioOnlineSchema>;
export type RadioOnline = typeof radiosOnline.$inferSelect;

export const archivosMp3 = pgTable("archivos_mp3", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  archivoUrl: text("archivo_url").notNull(),
  duracion: integer("duracion"), // en segundos
  orden: integer("orden").default(0),
  estado: varchar("estado", { length: 20 }).default('activo'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArchivoMp3Schema = createInsertSchema(archivosMp3).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArchivoMp3 = z.infer<typeof insertArchivoMp3Schema>;
export type ArchivoMp3 = typeof archivosMp3.$inferSelect;

// ============================================================
// CONFIGURACIÓN DEL SITIO WEB
// ============================================================

export const configuracionSitio = pgTable("configuracion_sitio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clave: varchar("clave", { length: 100 }).notNull().unique(), // logo_url, nombre_sitio, descripcion, franja_emergencia, etc.
  valor: text("valor"),
  tipo: varchar("tipo", { length: 50 }).default('texto'), // texto, imagen, json, boolean
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertConfiguracionSitioSchema = createInsertSchema(configuracionSitio).omit({ id: true, updatedAt: true });
export type InsertConfiguracionSitio = z.infer<typeof insertConfiguracionSitioSchema>;
export type ConfiguracionSitio = typeof configuracionSitio.$inferSelect;

// ============================================================
// RELACIONES
// ============================================================

export const usuariosRelaciones = relations(usuarios, ({ many }) => ({
  mensajesEnviados: many(mensajes, { relationName: "remitente" }),
  mensajesRecibidos: many(mensajes, { relationName: "destinatario" }),
  gruposCreados: many(gruposChat),
  miembrosGrupo: many(miembrosGrupo),
  emergencias: many(emergencias),
  viajesPasajero: many(viajesTaxi, { relationName: "pasajero" }),
  viajesConductor: many(viajesTaxi, { relationName: "conductor" }),
  servicios: many(servicios),
  pedidosDelivery: many(pedidosDelivery),
}));

export const gruposChatRelaciones = relations(gruposChat, ({ one, many }) => ({
  creador: one(usuarios, {
    fields: [gruposChat.creadorId],
    references: [usuarios.id],
  }),
  miembros: many(miembrosGrupo),
  mensajes: many(mensajes),
}));

export const mensajesRelaciones = relations(mensajes, ({ one }) => ({
  remitente: one(usuarios, {
    fields: [mensajes.remitenteId],
    references: [usuarios.id],
    relationName: "remitente",
  }),
  destinatario: one(usuarios, {
    fields: [mensajes.destinatarioId],
    references: [usuarios.id],
    relationName: "destinatario",
  }),
  grupo: one(gruposChat, {
    fields: [mensajes.grupoId],
    references: [gruposChat.id],
  }),
}));

export const serviciosRelaciones = relations(servicios, ({ one, many }) => ({
  usuario: one(usuarios, {
    fields: [servicios.usuarioId],
    references: [usuarios.id],
  }),
  productos: many(productosDelivery),
  pedidos: many(pedidosDelivery),
}));

export const emergenciasRelaciones = relations(emergencias, ({ one }) => ({
  usuario: one(usuarios, {
    fields: [emergencias.usuarioId],
    references: [usuarios.id],
  }),
  atendedor: one(usuarios, {
    fields: [emergencias.atendidoPor],
    references: [usuarios.id],
  }),
}));
