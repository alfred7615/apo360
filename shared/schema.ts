import { pgTable, varchar, serial, text, integer, decimal, real, boolean, timestamp, json, date, pgEnum, unique } from "drizzle-orm/pg-core";
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
  
  passwordHash: varchar("password_hash"),
  
  motivoSuspension: text("motivo_suspension"),
  fechaSuspension: timestamp("fecha_suspension"),
  motivoBloqueo: text("motivo_bloqueo"),
  fechaBloqueo: timestamp("fecha_bloqueo"),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titulo: varchar("titulo"),
  descripcion: text("descripcion"),
  tipo: varchar("tipo"), // "carrusel_logos", "carrusel_principal", "logos_servicios", "popup_emergencia", "encuestas_apoyo"
  imagenUrl: varchar("imagen_url"),
  enlaceUrl: varchar("enlace_url"),
  fechaInicio: timestamp("fecha_inicio"),
  fechaFin: timestamp("fecha_fin"),
  fechaCaducidad: timestamp("fecha_caducidad"),
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
// MIEMBROS DE GRUPOS
// ============================================================
export const miembrosGrupo = pgTable("miembros_grupo", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  grupoId: varchar("grupo_id").notNull().references(() => gruposChat.id),
  usuarioId: varchar("usuario_id").notNull().references(() => usuarios.id),
  rol: varchar("rol", { length: 50 }).default("miembro"), // miembro, admin
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // UNIQUE constraint para prevenir duplicados
  uniqueMember: unique().on(table.grupoId, table.usuarioId),
}));

export const insertMiembroGrupoSchema = createInsertSchema(miembrosGrupo).omit({ id: true, createdAt: true });
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Export insert schemas for usuario_roles and administradores (defined earlier)
export const insertUsuarioRolSchema = createInsertSchema(usuarioRoles).omit({ id: true, createdAt: true });
export type InsertUsuarioRol = z.infer<typeof insertUsuarioRolSchema>;
export type UsuarioRol = typeof usuarioRoles.$inferSelect;

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
