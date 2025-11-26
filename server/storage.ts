import {
  usuarios,
  publicidad,
  servicios,
  productosDelivery,
  gruposChat,
  miembrosGrupo,
  mensajes,
  emergencias,
  viajesTaxi,
  pedidosDelivery,
  radiosOnline,
  archivosMp3,
  configuracionSitio,
  usuarioRoles,
  administradores,
  configuracionSaldos,
  encuestas,
  popupsPublicitarios,
  interaccionesSociales,
  respuestasEncuestas,
  comentarios,
  registroBasico,
  registroChat,
  registroUbicacion,
  registroDireccion,
  registroMarketplace,
  credencialesConductor,
  eventos,
  avisosEmergencia,
  tiposMoneda,
  tasasCambio,
  categoriasServicio,
  logosServicios,
  productosServicio,
  transaccionesSaldo,
  notificacionesChat,
  metodosPago,
  monedas,
  solicitudesSaldo,
  saldosUsuarios,
  type Usuario,
  type InsertUsuario,
  type Publicidad,
  type InsertPublicidad,
  type Servicio,
  type InsertServicio,
  type ProductoDelivery,
  type InsertProductoDelivery,
  type GrupoChat,
  type InsertGrupoChat,
  type Mensaje,
  type InsertMensaje,
  type Emergencia,
  type InsertEmergencia,
  type ViajeTaxi,
  type InsertViajeTaxi,
  type PedidoDelivery,
  type InsertPedidoDelivery,
  type RadioOnline,
  type InsertRadioOnline,
  type ArchivoMp3,
  type InsertArchivoMp3,
  type ConfiguracionSitio,
  type InsertConfiguracionSitio,
  type UsuarioRol,
  type InsertUsuarioRol,
  type Administrador,
  type InsertAdministrador,
  type ConfiguracionSaldo,
  type InsertConfiguracionSaldo,
  type Encuesta,
  type InsertEncuesta,
  type PopupPublicitario,
  type InsertPopupPublicitario,
  type InteraccionSocial,
  type InsertInteraccionSocial,
  type RespuestaEncuesta,
  type InsertRespuestaEncuesta,
  type Comentario,
  type InsertComentario,
  type MiembroGrupo,
  type InsertMiembroGrupo,
  type RegistroBasico,
  type InsertRegistroBasico,
  type RegistroChat,
  type InsertRegistroChat,
  type RegistroUbicacion,
  type InsertRegistroUbicacion,
  type RegistroDireccion,
  type InsertRegistroDireccion,
  type RegistroMarketplace,
  type InsertRegistroMarketplace,
  type CredencialesConductor,
  type InsertCredencialesConductor,
  type Evento,
  type InsertEvento,
  type AvisoEmergencia,
  type InsertAvisoEmergencia,
  type TipoMoneda,
  type InsertTipoMoneda,
  type TasaCambio,
  type InsertTasaCambio,
  type CategoriaServicio,
  type InsertCategoriaServicio,
  type LogoServicio,
  type InsertLogoServicio,
  type ProductoServicio,
  type InsertProductoServicio,
  type TransaccionSaldo,
  type InsertTransaccionSaldo,
  type MetodoPago,
  type InsertMetodoPago,
  type Moneda,
  type InsertMoneda,
  type SolicitudSaldo,
  type InsertSolicitudSaldo,
  type SaldoUsuario,
  type InsertSaldoUsuario,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// Interfaz del storage
export interface IStorage {
  // Operaciones de usuarios (obligatorias para Replit Auth)
  getUser(id: string): Promise<Usuario | undefined>;
  getUserByEmail(email: string): Promise<Usuario | undefined>;
  createUser(data: Partial<InsertUsuario> & { id: string }): Promise<Usuario>;
  upsertUsuario(usuario: Partial<InsertUsuario> & { id: string }): Promise<Usuario>;
  getAllUsers(): Promise<Usuario[]>;
  updateUser(id: string, data: Partial<InsertUsuario>): Promise<Usuario | undefined>;
  
  // Operaciones de publicidad
  getPublicidades(tipo?: string): Promise<Publicidad[]>;
  createPublicidad(publicidad: PublicidadInsert): Promise<Publicidad>;
  updatePublicidad(id: string, data: Partial<PublicidadInsert>): Promise<Publicidad | undefined>;
  deletePublicidad(id: string): Promise<void>;
  
  // Operaciones de servicios
  getServicios(): Promise<Servicio[]>;
  getServicio(id: string): Promise<Servicio | undefined>;
  createServicio(servicio: ServicioInsert): Promise<Servicio>;
  updateServicio(id: string, data: Partial<ServicioInsert>): Promise<Servicio | undefined>;
  deleteServicio(id: string): Promise<void>;
  
  // Operaciones de productos delivery
  getProductosPorServicio(servicioId: string): Promise<ProductoDelivery[]>;
  createProducto(producto: ProductoDeliveryInsert): Promise<ProductoDelivery>;
  
  // Operaciones de chat
  getGruposPorUsuario(usuarioId: string): Promise<GrupoChat[]>;
  getGrupo(id: string): Promise<GrupoChat | undefined>;
  createGrupo(grupo: GrupoChatInsert): Promise<GrupoChat>;
  agregarMiembroGrupo(data: { grupoId: string; usuarioId: string; rol: string }): Promise<MiembroGrupo>;
  verificarMiembroGrupo(grupoId: string, usuarioId: string): Promise<boolean>;
  getMensajesPorGrupo(grupoId: string): Promise<Mensaje[]>;
  createMensaje(mensaje: MensajeInsert): Promise<Mensaje>;
  getAllGruposConMiembrosLegacy(): Promise<GrupoChat[]>;
  
  // Operaciones de emergencias
  getEmergencias(): Promise<Emergencia[]>;
  getEmergenciasRecientes(limite?: number): Promise<Emergencia[]>;
  createEmergencia(emergencia: EmergenciaInsert): Promise<Emergencia>;
  updateEmergencia(id: string, data: Partial<EmergenciaInsert>): Promise<Emergencia | undefined>;
  
  // Operaciones de taxi
  getViajesTaxi(usuarioId?: string): Promise<ViajeTaxi[]>;
  createViajeTaxi(viaje: ViajeTaxiInsert): Promise<ViajeTaxi>;
  updateViajeTaxi(id: string, data: Partial<ViajeTaxiInsert>): Promise<ViajeTaxi | undefined>;
  
  // Operaciones de delivery
  getPedidosDelivery(usuarioId?: string): Promise<PedidoDelivery[]>;
  createPedidoDelivery(pedido: PedidoDeliveryInsert): Promise<PedidoDelivery>;
  updatePedidoDelivery(id: string, data: Partial<PedidoDeliveryInsert>): Promise<PedidoDelivery | undefined>;
  
  // Operaciones de radio y audio
  getRadiosOnline(): Promise<RadioOnline[]>;
  createRadioOnline(radio: RadioOnlineInsert): Promise<RadioOnline>;
  updateRadioOnline(id: string, data: Partial<RadioOnlineInsert>): Promise<RadioOnline | undefined>;
  deleteRadioOnline(id: string): Promise<void>;
  getArchivosMp3(): Promise<ArchivoMp3[]>;
  createArchivoMp3(archivo: ArchivoMp3Insert): Promise<ArchivoMp3>;
  updateArchivoMp3(id: string, data: Partial<ArchivoMp3Insert>): Promise<ArchivoMp3 | undefined>;
  deleteArchivoMp3(id: string): Promise<void>;
  
  // Operaciones de configuración
  getConfiguracion(clave: string): Promise<ConfiguracionSitio | undefined>;
  setConfiguracion(config: InsertConfiguracionSitio): Promise<ConfiguracionSitio>;
  
  // Operaciones de roles
  getUserRoles(usuarioId: string): Promise<string[]>;
  addUserRole(data: InsertUsuarioRol): Promise<UsuarioRol>;
  removeUserRole(id: string): Promise<void>;
  
  // Operaciones de administradores
  getAdministradores(): Promise<Administrador[]>;
  createAdministrador(data: InsertAdministrador): Promise<Administrador>;
  updateAdministrador(id: string, data: Partial<InsertAdministrador>): Promise<Administrador | undefined>;
  deleteAdministrador(id: string): Promise<void>;
  
  // Operaciones de configuración de saldos
  getConfiguracionesSaldos(): Promise<ConfiguracionSaldo[]>;
  getConfiguracionSaldo(tipoOperacion: string): Promise<ConfiguracionSaldo | undefined>;
  upsertConfiguracionSaldo(data: InsertConfiguracionSaldo): Promise<ConfiguracionSaldo>;
  
  // Operaciones de encuestas
  getEncuestas(): Promise<Encuesta[]>;
  getEncuesta(id: string): Promise<Encuesta | undefined>;
  createEncuesta(data: InsertEncuesta): Promise<Encuesta>;
  updateEncuesta(id: string, data: Partial<InsertEncuesta>): Promise<Encuesta | undefined>;
  deleteEncuesta(id: string): Promise<void>;
  
  // Operaciones de popups publicitarios
  getPopups(): Promise<PopupPublicitario[]>;
  getPopupsActivos(): Promise<PopupPublicitario[]>;
  getPopup(id: string): Promise<PopupPublicitario | undefined>;
  createPopup(data: InsertPopupPublicitario): Promise<PopupPublicitario>;
  updatePopup(id: string, data: Partial<InsertPopupPublicitario>): Promise<PopupPublicitario | undefined>;
  deletePopup(id: string): Promise<void>;
  incrementarVistasPopup(id: string): Promise<void>;
  
  // Operaciones de interacciones sociales
  getInteracciones(tipoContenido: string, contenidoId: string): Promise<InteraccionSocial[]>;
  getContadoresInteracciones(tipoContenido: string, contenidoId: string): Promise<{ tipo: string; cantidad: number }[]>;
  createInteraccion(data: InsertInteraccionSocial): Promise<InteraccionSocial>;
  deleteInteraccion(usuarioId: string, tipoContenido: string, contenidoId: string, tipoInteraccion: string): Promise<void>;
  verificarInteraccion(usuarioId: string, tipoContenido: string, contenidoId: string, tipoInteraccion: string): Promise<boolean>;
  
  // Operaciones de respuestas de encuestas
  getRespuestasEncuesta(encuestaId: string): Promise<RespuestaEncuesta[]>;
  getResultadosEncuesta(encuestaId: string): Promise<{ preguntaIndex: number; opcion: number; cantidad: number }[]>;
  createRespuestaEncuesta(data: InsertRespuestaEncuesta): Promise<RespuestaEncuesta>;
  verificarRespuestaUsuario(encuestaId: string, usuarioId: string): Promise<boolean>;
  
  // Operaciones de comentarios
  getComentarios(tipoContenido: string, contenidoId: string): Promise<Comentario[]>;
  createComentario(data: InsertComentario): Promise<Comentario>;
  deleteComentario(id: string): Promise<void>;
  
  // Sistema de Registro por Niveles (5 estrellas)
  getNivelRegistro(usuarioId: string): Promise<number>;
  getRegistroBasico(usuarioId: string): Promise<RegistroBasico | undefined>;
  createRegistroBasico(data: InsertRegistroBasico): Promise<RegistroBasico>;
  getRegistroChat(usuarioId: string): Promise<RegistroChat | undefined>;
  createRegistroChat(data: InsertRegistroChat): Promise<RegistroChat>;
  updateRegistroChat(usuarioId: string, data: Partial<InsertRegistroChat>): Promise<RegistroChat | undefined>;
  getRegistroUbicacion(usuarioId: string): Promise<RegistroUbicacion | undefined>;
  createRegistroUbicacion(data: InsertRegistroUbicacion): Promise<RegistroUbicacion>;
  updateRegistroUbicacion(usuarioId: string, data: Partial<InsertRegistroUbicacion>): Promise<RegistroUbicacion | undefined>;
  getRegistroDireccion(usuarioId: string): Promise<RegistroDireccion | undefined>;
  createRegistroDireccion(data: InsertRegistroDireccion): Promise<RegistroDireccion>;
  updateRegistroDireccion(usuarioId: string, data: Partial<InsertRegistroDireccion>): Promise<RegistroDireccion | undefined>;
  getRegistroMarketplace(usuarioId: string): Promise<RegistroMarketplace | undefined>;
  createRegistroMarketplace(data: InsertRegistroMarketplace): Promise<RegistroMarketplace>;
  updateRegistroMarketplace(usuarioId: string, data: Partial<InsertRegistroMarketplace>): Promise<RegistroMarketplace | undefined>;
  getCredencialesConductor(usuarioId: string): Promise<CredencialesConductor | undefined>;
  createCredencialesConductor(data: InsertCredencialesConductor): Promise<CredencialesConductor>;
  updateCredencialesConductor(usuarioId: string, data: Partial<InsertCredencialesConductor>): Promise<CredencialesConductor | undefined>;
  
  // ============================================================
  // SISTEMA DE CARTERA Y SALDOS
  // ============================================================
  
  // Métodos de pago
  getMetodosPago(usuarioId?: string, esPlataforma?: boolean): Promise<MetodoPago[]>;
  getMetodoPago(id: string): Promise<MetodoPago | undefined>;
  createMetodoPago(data: InsertMetodoPago): Promise<MetodoPago>;
  updateMetodoPago(id: string, data: Partial<InsertMetodoPago>): Promise<MetodoPago | undefined>;
  deleteMetodoPago(id: string): Promise<void>;
  
  // Monedas y tipos de cambio
  getMonedas(): Promise<Moneda[]>;
  getMoneda(codigo: string): Promise<Moneda | undefined>;
  createMoneda(data: InsertMoneda): Promise<Moneda>;
  updateMoneda(id: string, data: Partial<InsertMoneda>): Promise<Moneda | undefined>;
  deleteMoneda(id: string): Promise<void>;
  
  // Saldos de usuarios
  getSaldoUsuario(usuarioId: string): Promise<SaldoUsuario | undefined>;
  getAllSaldosUsuarios(): Promise<SaldoUsuario[]>;
  upsertSaldoUsuario(data: InsertSaldoUsuario): Promise<SaldoUsuario>;
  actualizarSaldo(usuarioId: string, monto: number, tipo: 'ingreso' | 'egreso'): Promise<SaldoUsuario>;
  
  // Solicitudes de saldo (recargas y retiros)
  getSolicitudesSaldo(estado?: string): Promise<SolicitudSaldo[]>;
  getSolicitudesSaldoPorUsuario(usuarioId: string): Promise<SolicitudSaldo[]>;
  getSolicitudSaldo(id: string): Promise<SolicitudSaldo | undefined>;
  createSolicitudSaldo(data: InsertSolicitudSaldo): Promise<SolicitudSaldo>;
  updateSolicitudSaldo(id: string, data: Partial<InsertSolicitudSaldo>): Promise<SolicitudSaldo | undefined>;
  aprobarSolicitudSaldo(id: string, aprobadoPor: string): Promise<SolicitudSaldo | undefined>;
  rechazarSolicitudSaldo(id: string, motivoRechazo: string): Promise<SolicitudSaldo | undefined>;
  
  // Transacciones de saldo
  getTransaccionesSaldo(usuarioId?: string): Promise<TransaccionSaldo[]>;
  createTransaccionSaldo(data: InsertTransaccionSaldo): Promise<TransaccionSaldo>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================
  // USUARIOS
  // ============================================================
  
  async getUser(id: string): Promise<Usuario | undefined> {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return usuario || undefined;
  }

  async getUserByEmail(email: string): Promise<Usuario | undefined> {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.email, email));
    return usuario || undefined;
  }

  async createUser(userData: Partial<InsertUsuario> & { id: string }): Promise<Usuario> {
    const [newUser] = await db.insert(usuarios).values(userData).returning();
    return newUser;
  }

  async upsertUsuario(usuarioData: Partial<InsertUsuario> & { id: string }): Promise<Usuario> {
    const existingByEmail = usuarioData.email 
      ? await db.select().from(usuarios).where(eq(usuarios.email, usuarioData.email)).limit(1)
      : [];
    
    if (existingByEmail.length > 0) {
      const [updated] = await db
        .update(usuarios)
        .set(usuarioData)
        .where(eq(usuarios.email, usuarioData.email!))
        .returning();
      return updated;
    }
    
    const [usuario] = await db
      .insert(usuarios)
      .values(usuarioData)
      .onConflictDoUpdate({
        target: usuarios.id,
        set: usuarioData,
      })
      .returning();
    return usuario;
  }

  async getAllUsers(): Promise<Usuario[]> {
    return await db.select().from(usuarios).orderBy(desc(usuarios.createdAt));
  }

  async updateUser(id: string, data: Partial<InsertUsuario>): Promise<Usuario | undefined> {
    const [updated] = await db
      .update(usuarios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(usuarios.id, id))
      .returning();
    return updated || undefined;
  }

  // ============================================================
  // PUBLICIDAD
  // ============================================================
  
  async getPublicidades(tipo?: string): Promise<Publicidad[]> {
    if (tipo) {
      return await db.select().from(publicidad)
        .where(eq(publicidad.tipo, tipo))
        .orderBy(publicidad.orden);
    }
    return await db.select().from(publicidad).orderBy(publicidad.orden);
  }

  async createPublicidad(publicidadData: InsertPublicidad): Promise<Publicidad> {
    const [nuevaPublicidad] = await db
      .insert(publicidad)
      .values(publicidadData)
      .returning();
    return nuevaPublicidad;
  }

  async updatePublicidad(id: string, data: Partial<InsertPublicidad>): Promise<Publicidad | undefined> {
    const [actualizada] = await db
      .update(publicidad)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(publicidad.id, id))
      .returning();
    return actualizada || undefined;
  }

  async deletePublicidad(id: string): Promise<void> {
    await db.delete(publicidad).where(eq(publicidad.id, id));
  }

  // ============================================================
  // SERVICIOS
  // ============================================================
  
  async getServicios(): Promise<Servicio[]> {
    return await db.select().from(servicios).orderBy(servicios.nombreServicio);
  }

  async getServicio(id: string): Promise<Servicio | undefined> {
    const [servicio] = await db.select().from(servicios).where(eq(servicios.id, id));
    return servicio || undefined;
  }

  async createServicio(servicioData: InsertServicio): Promise<Servicio> {
    const [nuevoServicio] = await db
      .insert(servicios)
      .values(servicioData)
      .returning();
    return nuevoServicio;
  }

  async updateServicio(id: string, data: Partial<InsertServicio>): Promise<Servicio | undefined> {
    const [actualizado] = await db
      .update(servicios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(servicios.id, id))
      .returning();
    return actualizado || undefined;
  }

  // ============================================================
  // PRODUCTOS DELIVERY
  // ============================================================
  
  async getProductosPorServicio(servicioId: string): Promise<ProductoDelivery[]> {
    return await db.select()
      .from(productosDelivery)
      .where(eq(productosDelivery.servicioId, servicioId));
  }

  async createProducto(productoData: InsertProductoDelivery): Promise<ProductoDelivery> {
    const [producto] = await db
      .insert(productosDelivery)
      .values(productoData)
      .returning();
    return producto;
  }

  // ============================================================
  // CHAT
  // ============================================================
  
  async getGruposPorUsuario(usuarioId: string): Promise<GrupoChat[]> {
    const grupos = await db
      .select()
      .from(gruposChat)
      .innerJoin(miembrosGrupo, eq(gruposChat.id, miembrosGrupo.grupoId))
      .where(and(
        eq(miembrosGrupo.usuarioId, usuarioId),
        eq(miembrosGrupo.estado, 'activo')
      ))
      .orderBy(desc(gruposChat.updatedAt));
    
    return grupos.map(g => g.grupos_chat);
  }

  async getGrupo(id: string): Promise<GrupoChat | undefined> {
    const [grupo] = await db.select().from(gruposChat).where(eq(gruposChat.id, id));
    return grupo || undefined;
  }

  async createGrupo(grupoData: InsertGrupoChat): Promise<GrupoChat> {
    const [grupo] = await db
      .insert(gruposChat)
      .values(grupoData)
      .returning();
    
    // Agregar automáticamente al creador como miembro con rol admin
    await this.agregarMiembroGrupo({
      grupoId: grupo.id,
      usuarioId: grupoData.creadorId,
      rol: "admin",
    });
    
    return grupo;
  }

  async agregarMiembroGrupo(data: { grupoId: string; usuarioId: string; rol: string }): Promise<MiembroGrupo> {
    const [miembro] = await db
      .insert(miembrosGrupo)
      .values(data)
      .onConflictDoNothing({
        target: [miembrosGrupo.grupoId, miembrosGrupo.usuarioId],
      })
      .returning();
    
    // Si el miembro ya existía, obtenerlo
    if (!miembro) {
      const [existing] = await db
        .select()
        .from(miembrosGrupo)
        .where(and(
          eq(miembrosGrupo.grupoId, data.grupoId),
          eq(miembrosGrupo.usuarioId, data.usuarioId)
        ))
        .limit(1);
      return existing;
    }
    
    return miembro;
  }

  async verificarMiembroGrupo(grupoId: string, usuarioId: string): Promise<boolean> {
    const miembro = await db
      .select()
      .from(miembrosGrupo)
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.usuarioId, usuarioId)
      ))
      .limit(1);
    
    return miembro.length > 0;
  }

  async getMensajesPorGrupo(grupoId: string): Promise<Mensaje[]> {
    return await db.select()
      .from(mensajes)
      .where(eq(mensajes.grupoId, grupoId))
      .orderBy(mensajes.createdAt);
  }

  async createMensaje(mensajeData: InsertMensaje): Promise<Mensaje> {
    const [mensaje] = await db
      .insert(mensajes)
      .values(mensajeData)
      .returning();
    
    // Actualizar contador de mensajes y último mensaje del grupo
    if (mensajeData.grupoId) {
      await db.update(gruposChat)
        .set({ 
          totalMensajes: sql`total_mensajes + 1`,
          ultimoMensajeAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(gruposChat.id, mensajeData.grupoId));
    }
    
    return mensaje;
  }

  // ============================================================
  // FUNCIONES ADICIONALES DE CHAT
  // ============================================================
  
  async getGruposChat(): Promise<GrupoChat[]> {
    return await db.select()
      .from(gruposChat)
      .orderBy(desc(gruposChat.updatedAt));
  }

  async getGruposChatActivos(): Promise<GrupoChat[]> {
    return await db.select()
      .from(gruposChat)
      .where(eq(gruposChat.estado, 'activo'))
      .orderBy(desc(gruposChat.updatedAt));
  }

  async getGruposEmergencia(): Promise<GrupoChat[]> {
    return await db.select()
      .from(gruposChat)
      .where(and(
        eq(gruposChat.esEmergencia, true),
        eq(gruposChat.estado, 'activo')
      ))
      .orderBy(gruposChat.nombre);
  }

  async updateGrupoChat(id: string, data: Partial<InsertGrupoChat>): Promise<GrupoChat | undefined> {
    const [actualizado] = await db
      .update(gruposChat)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(gruposChat.id, id))
      .returning();
    return actualizado;
  }

  async suspenderGrupo(id: string, motivo: string): Promise<GrupoChat | undefined> {
    const [grupo] = await db
      .update(gruposChat)
      .set({ 
        estado: 'suspendido',
        motivoSuspension: motivo,
        fechaSuspension: new Date(),
        updatedAt: new Date()
      })
      .where(eq(gruposChat.id, id))
      .returning();
    return grupo;
  }

  async activarGrupo(id: string): Promise<GrupoChat | undefined> {
    const [grupo] = await db
      .update(gruposChat)
      .set({ 
        estado: 'activo',
        motivoSuspension: null,
        fechaSuspension: null,
        updatedAt: new Date()
      })
      .where(eq(gruposChat.id, id))
      .returning();
    return grupo;
  }

  async deleteGrupoChat(id: string): Promise<void> {
    await db.delete(miembrosGrupo).where(eq(miembrosGrupo.grupoId, id));
    await db.delete(mensajes).where(eq(mensajes.grupoId, id));
    await db.delete(gruposChat).where(eq(gruposChat.id, id));
  }

  // Miembros de grupo
  async getMiembrosGrupo(grupoId: string): Promise<(MiembroGrupo & { usuario?: Usuario })[]> {
    const miembros = await db
      .select()
      .from(miembrosGrupo)
      .leftJoin(usuarios, eq(miembrosGrupo.usuarioId, usuarios.id))
      .where(eq(miembrosGrupo.grupoId, grupoId))
      .orderBy(miembrosGrupo.rol, miembrosGrupo.createdAt);
    
    return miembros.map(m => ({
      ...m.miembros_grupo,
      usuario: m.users || undefined
    }));
  }

  async getMiembroGrupo(grupoId: string, usuarioId: string): Promise<MiembroGrupo | undefined> {
    const [miembro] = await db
      .select()
      .from(miembrosGrupo)
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.usuarioId, usuarioId)
      ))
      .limit(1);
    return miembro;
  }

  async updateMiembroGrupo(grupoId: string, usuarioId: string, data: Partial<InsertMiembroGrupo>): Promise<MiembroGrupo | undefined> {
    const [actualizado] = await db
      .update(miembrosGrupo)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.usuarioId, usuarioId)
      ))
      .returning();
    return actualizado;
  }

  async suspenderMiembroGrupo(grupoId: string, usuarioId: string, motivo: string): Promise<MiembroGrupo | undefined> {
    const [miembro] = await db
      .update(miembrosGrupo)
      .set({ 
        estado: 'suspendido',
        motivoSuspension: motivo,
        fechaSuspension: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.usuarioId, usuarioId)
      ))
      .returning();
    return miembro;
  }

  async removerMiembroGrupo(grupoId: string, usuarioId: string): Promise<void> {
    await db.delete(miembrosGrupo)
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.usuarioId, usuarioId)
      ));
    
    // Actualizar contador de miembros
    await db.update(gruposChat)
      .set({ 
        totalMiembros: sql`GREATEST(total_miembros - 1, 0)`,
        updatedAt: new Date()
      })
      .where(eq(gruposChat.id, grupoId));
  }

  async contarMiembrosGrupo(grupoId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(miembrosGrupo)
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.estado, 'activo')
      ));
    return Number(result[0]?.count || 0);
  }

  // Mensajes avanzados
  async getMensajesGrupoConPaginacion(grupoId: string, limite: number = 50, offset: number = 0): Promise<Mensaje[]> {
    return await db.select()
      .from(mensajes)
      .where(and(
        eq(mensajes.grupoId, grupoId),
        eq(mensajes.eliminado, false)
      ))
      .orderBy(desc(mensajes.createdAt))
      .limit(limite)
      .offset(offset);
  }

  async getMensajesHistorico(grupoId: string, fechaDesde: Date): Promise<Mensaje[]> {
    return await db.select()
      .from(mensajes)
      .where(and(
        eq(mensajes.grupoId, grupoId),
        gte(mensajes.createdAt, fechaDesde),
        eq(mensajes.eliminado, false)
      ))
      .orderBy(mensajes.createdAt);
  }

  async eliminarMensaje(id: string, usuarioId: string): Promise<Mensaje | undefined> {
    const [mensaje] = await db
      .update(mensajes)
      .set({
        eliminado: true,
        eliminadoPor: usuarioId,
        fechaEliminacion: new Date()
      })
      .where(eq(mensajes.id, id))
      .returning();
    return mensaje;
  }

  async marcarMensajesComoLeidos(grupoId: string, usuarioId: string): Promise<void> {
    await db.update(miembrosGrupo)
      .set({
        mensajesNoLeidos: 0,
        ultimoMensajeVisto: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(miembrosGrupo.grupoId, grupoId),
        eq(miembrosGrupo.usuarioId, usuarioId)
      ));
  }

  // Verificar nivel de estrellas
  async verificarNivelUsuario(usuarioId: string): Promise<number> {
    const [usuario] = await db.select({ nivelUsuario: usuarios.nivelUsuario })
      .from(usuarios)
      .where(eq(usuarios.id, usuarioId));
    return usuario?.nivelUsuario || 1;
  }

  async puedeAccederChat(usuarioId: string, grupoId: string): Promise<{ puede: boolean; razon?: string }> {
    const nivelUsuario = await this.verificarNivelUsuario(usuarioId);
    const grupo = await this.getGrupo(grupoId);
    
    if (!grupo) {
      return { puede: false, razon: 'Grupo no encontrado' };
    }
    
    if (grupo.estado !== 'activo') {
      return { puede: false, razon: 'Grupo suspendido' };
    }
    
    if (nivelUsuario < (grupo.estrellasMinimas || 3)) {
      return { puede: false, razon: `Requiere nivel ${grupo.estrellasMinimas} estrellas. Tu nivel actual es ${nivelUsuario}` };
    }
    
    const miembro = await this.getMiembroGrupo(grupoId, usuarioId);
    if (!miembro) {
      return { puede: false, razon: 'No eres miembro de este grupo' };
    }
    
    if (miembro.estado !== 'activo') {
      return { puede: false, razon: 'Tu membresía está suspendida' };
    }
    
    return { puede: true };
  }

  // ============================================================
  // EMERGENCIAS
  // ============================================================
  
  async getEmergencias(): Promise<Emergencia[]> {
    return await db.select()
      .from(emergencias)
      .orderBy(desc(emergencias.createdAt));
  }

  async getEmergenciasRecientes(limite: number = 10): Promise<Emergencia[]> {
    return await db.select()
      .from(emergencias)
      .orderBy(desc(emergencias.createdAt))
      .limit(limite);
  }

  async createEmergencia(emergenciaData: InsertEmergencia): Promise<Emergencia> {
    const [emergencia] = await db
      .insert(emergencias)
      .values(emergenciaData)
      .returning();
    return emergencia;
  }

  async updateEmergencia(id: string, data: Partial<InsertEmergencia>): Promise<Emergencia | undefined> {
    const [actualizada] = await db
      .update(emergencias)
      .set(data)
      .where(eq(emergencias.id, id))
      .returning();
    return actualizada || undefined;
  }

  // ============================================================
  // TAXI
  // ============================================================
  
  async getViajesTaxi(usuarioId?: string): Promise<ViajeTaxi[]> {
    if (usuarioId) {
      return await db.select()
        .from(viajesTaxi)
        .where(
          sql`${viajesTaxi.pasajeroId} = ${usuarioId} OR ${viajesTaxi.conductorId} = ${usuarioId}`
        )
        .orderBy(desc(viajesTaxi.createdAt));
    }
    return await db.select().from(viajesTaxi).orderBy(desc(viajesTaxi.createdAt));
  }

  async createViajeTaxi(viajeData: InsertViajeTaxi): Promise<ViajeTaxi> {
    const [viaje] = await db
      .insert(viajesTaxi)
      .values(viajeData)
      .returning();
    return viaje;
  }

  async updateViajeTaxi(id: string, data: Partial<InsertViajeTaxi>): Promise<ViajeTaxi | undefined> {
    const [actualizado] = await db
      .update(viajesTaxi)
      .set(data)
      .where(eq(viajesTaxi.id, id))
      .returning();
    return actualizado || undefined;
  }

  // ============================================================
  // DELIVERY
  // ============================================================
  
  async getPedidosDelivery(usuarioId?: string): Promise<PedidoDelivery[]> {
    if (usuarioId) {
      return await db.select()
        .from(pedidosDelivery)
        .where(eq(pedidosDelivery.usuarioId, usuarioId))
        .orderBy(desc(pedidosDelivery.createdAt));
    }
    return await db.select().from(pedidosDelivery).orderBy(desc(pedidosDelivery.createdAt));
  }

  async createPedidoDelivery(pedidoData: InsertPedidoDelivery): Promise<PedidoDelivery> {
    const [pedido] = await db
      .insert(pedidosDelivery)
      .values(pedidoData)
      .returning();
    return pedido;
  }

  async updatePedidoDelivery(id: string, data: Partial<InsertPedidoDelivery>): Promise<PedidoDelivery | undefined> {
    const [actualizado] = await db
      .update(pedidosDelivery)
      .set(data)
      .where(eq(pedidosDelivery.id, id))
      .returning();
    return actualizado || undefined;
  }

  // ============================================================
  // RADIO Y AUDIO
  // ============================================================
  
  async getRadiosOnline(): Promise<RadioOnline[]> {
    return await db.select()
      .from(radiosOnline)
      .orderBy(radiosOnline.orden);
  }

  async createRadioOnline(radioData: InsertRadioOnline): Promise<RadioOnline> {
    const [radio] = await db
      .insert(radiosOnline)
      .values(radioData)
      .returning();
    return radio;
  }

  async getArchivosMp3(): Promise<ArchivoMp3[]> {
    return await db.select()
      .from(archivosMp3)
      .orderBy(archivosMp3.orden);
  }

  async createArchivoMp3(archivoData: InsertArchivoMp3): Promise<ArchivoMp3> {
    const [archivo] = await db
      .insert(archivosMp3)
      .values(archivoData)
      .returning();
    return archivo;
  }

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================
  
  async getConfiguracion(clave: string): Promise<ConfiguracionSitio | undefined> {
    const [config] = await db.select()
      .from(configuracionSitio)
      .where(eq(configuracionSitio.clave, clave));
    return config || undefined;
  }

  async setConfiguracion(configData: InsertConfiguracionSitio): Promise<ConfiguracionSitio> {
    const [config] = await db
      .insert(configuracionSitio)
      .values(configData)
      .onConflictDoUpdate({
        target: configuracionSitio.clave,
        set: {
          valor: configData.valor,
          tipo: configData.tipo,
        },
      })
      .returning();
    return config;
  }

  // ============================================================
  // ROLES DE USUARIO
  // ============================================================

  async getUserRoles(usuarioId: string): Promise<string[]> {
    const rolesSet = new Set<string>();
    
    // Primero obtener el rol principal del usuario desde la tabla usuarios
    const user = await this.getUser(usuarioId);
    if (user?.rol) {
      rolesSet.add(user.rol);
    }
    
    // Luego agregar roles adicionales de la tabla usuarioRoles
    const additionalRoles = await db.select()
      .from(usuarioRoles)
      .where(eq(usuarioRoles.usuarioId, usuarioId));
    additionalRoles.forEach(r => {
      if (r.rol) rolesSet.add(r.rol);
    });
    
    return Array.from(rolesSet);
  }

  async addUserRole(roleData: InsertUsuarioRol): Promise<UsuarioRol> {
    const [rol] = await db
      .insert(usuarioRoles)
      .values(roleData)
      .returning();
    return rol;
  }

  async removeUserRole(id: string): Promise<void> {
    await db.delete(usuarioRoles).where(eq(usuarioRoles.id, id));
  }

  // ============================================================
  // ADMINISTRADORES DE SEGUNDO NIVEL
  // ============================================================

  async getAdministradores(): Promise<Administrador[]> {
    return await db.select().from(administradores);
  }

  async createAdministrador(data: InsertAdministrador): Promise<Administrador> {
    const [admin] = await db
      .insert(administradores)
      .values(data)
      .returning();
    return admin;
  }

  async updateAdministrador(id: string, data: Partial<InsertAdministrador>): Promise<Administrador | undefined> {
    const [actualizado] = await db
      .update(administradores)
      .set(data)
      .where(eq(administradores.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteAdministrador(id: string): Promise<void> {
    await db.delete(administradores).where(eq(administradores.id, id));
  }

  // ============================================================
  // CONFIGURACIÓN DE SALDOS
  // ============================================================

  async getConfiguracionesSaldos(): Promise<ConfiguracionSaldo[]> {
    return await db.select().from(configuracionSaldos);
  }

  async getConfiguracionSaldo(tipoOperacion: string): Promise<ConfiguracionSaldo | undefined> {
    const [config] = await db.select()
      .from(configuracionSaldos)
      .where(eq(configuracionSaldos.tipoOperacion, tipoOperacion));
    return config || undefined;
  }

  async upsertConfiguracionSaldo(data: InsertConfiguracionSaldo): Promise<ConfiguracionSaldo> {
    const [config] = await db
      .insert(configuracionSaldos)
      .values(data)
      .onConflictDoUpdate({
        target: configuracionSaldos.tipoOperacion,
        set: {
          tipoValor: data.tipoValor,
          valor: data.valor,
          descripcion: data.descripcion,
          activo: data.activo,
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }

  // ============================================================
  // ENCUESTAS
  // ============================================================

  async getEncuestas(): Promise<any[]> {
    return await db.select().from(encuestas).orderBy(desc(encuestas.createdAt));
  }

  async getEncuesta(id: string): Promise<any> {
    const [encuesta] = await db.select().from(encuestas).where(eq(encuestas.id, id));
    return encuesta || undefined;
  }

  async createEncuesta(data: InsertEncuesta): Promise<Encuesta> {
    const [encuesta] = await db
      .insert(encuestas)
      .values(data)
      .returning();
    return encuesta;
  }

  async updateEncuesta(id: string, data: Partial<InsertEncuesta>): Promise<Encuesta | undefined> {
    const [actualizada] = await db
      .update(encuestas)
      .set(data)
      .where(eq(encuestas.id, id))
      .returning();
    return actualizada || undefined;
  }

  async deleteEncuesta(id: string): Promise<void> {
    await db.delete(encuestas).where(eq(encuestas.id, id));
  }

  // ============================================================
  // POPUPS PUBLICITARIOS
  // ============================================================

  async getPopups(): Promise<any[]> {
    return await db.select()
      .from(popupsPublicitarios)
      .orderBy(popupsPublicitarios.orden);
  }

  async getPopup(id: string): Promise<any> {
    const [popup] = await db.select().from(popupsPublicitarios).where(eq(popupsPublicitarios.id, id));
    return popup || undefined;
  }

  async createPopup(data: InsertPopupPublicitario): Promise<PopupPublicitario> {
    const [popup] = await db
      .insert(popupsPublicitarios)
      .values(data)
      .returning();
    return popup;
  }

  async updatePopup(id: string, data: Partial<InsertPopupPublicitario>): Promise<PopupPublicitario | undefined> {
    const [actualizado] = await db
      .update(popupsPublicitarios)
      .set(data)
      .where(eq(popupsPublicitarios.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deletePopup(id: string): Promise<void> {
    await db.delete(popupsPublicitarios).where(eq(popupsPublicitarios.id, id));
  }

  async getPopupsActivos(): Promise<PopupPublicitario[]> {
    const ahora = new Date();
    const popups = await db.select()
      .from(popupsPublicitarios)
      .where(eq(popupsPublicitarios.estado, 'activo'))
      .orderBy(desc(popupsPublicitarios.createdAt));
    
    return popups.filter(p => {
      const inicioValido = !p.fechaInicio || new Date(p.fechaInicio) <= ahora;
      const finValido = !p.fechaFin || new Date(p.fechaFin) >= ahora;
      return inicioValido && finValido;
    });
  }

  async incrementarVistasPopup(id: string): Promise<void> {
    await db.update(popupsPublicitarios)
      .set({ vistas: sql`COALESCE(vistas, 0) + 1` })
      .where(eq(popupsPublicitarios.id, id));
  }

  // ============================================================
  // INTERACCIONES SOCIALES
  // ============================================================

  async getInteracciones(tipoContenido: string, contenidoId: string): Promise<InteraccionSocial[]> {
    return await db.select()
      .from(interaccionesSociales)
      .where(
        and(
          eq(interaccionesSociales.tipoContenido, tipoContenido),
          eq(interaccionesSociales.contenidoId, contenidoId)
        )
      );
  }

  async getContadoresInteracciones(tipoContenido: string, contenidoId: string): Promise<{ tipo: string; cantidad: number }[]> {
    const result = await db.execute(sql`
      SELECT tipo_interaccion as tipo, COUNT(*)::int as cantidad
      FROM interacciones_sociales
      WHERE tipo_contenido = ${tipoContenido} AND contenido_id = ${contenidoId}
      GROUP BY tipo_interaccion
    `);
    return result.rows as { tipo: string; cantidad: number }[];
  }

  async createInteraccion(data: InsertInteraccionSocial): Promise<InteraccionSocial> {
    const [interaccion] = await db
      .insert(interaccionesSociales)
      .values(data)
      .returning();
    return interaccion;
  }

  async deleteInteraccion(usuarioId: string, tipoContenido: string, contenidoId: string, tipoInteraccion: string): Promise<void> {
    await db.delete(interaccionesSociales)
      .where(
        and(
          eq(interaccionesSociales.usuarioId, usuarioId),
          eq(interaccionesSociales.tipoContenido, tipoContenido),
          eq(interaccionesSociales.contenidoId, contenidoId),
          eq(interaccionesSociales.tipoInteraccion, tipoInteraccion)
        )
      );
  }

  async verificarInteraccion(usuarioId: string, tipoContenido: string, contenidoId: string, tipoInteraccion: string): Promise<boolean> {
    const [existe] = await db.select()
      .from(interaccionesSociales)
      .where(
        and(
          eq(interaccionesSociales.usuarioId, usuarioId),
          eq(interaccionesSociales.tipoContenido, tipoContenido),
          eq(interaccionesSociales.contenidoId, contenidoId),
          eq(interaccionesSociales.tipoInteraccion, tipoInteraccion)
        )
      )
      .limit(1);
    return !!existe;
  }

  // ============================================================
  // RESPUESTAS DE ENCUESTAS
  // ============================================================

  async getRespuestasEncuesta(encuestaId: string): Promise<RespuestaEncuesta[]> {
    return await db.select()
      .from(respuestasEncuestas)
      .where(eq(respuestasEncuestas.encuestaId, encuestaId));
  }

  async getResultadosEncuesta(encuestaId: string): Promise<{ preguntaIndex: number; opcion: number; cantidad: number }[]> {
    const respuestas = await this.getRespuestasEncuesta(encuestaId);
    const resultados: { [key: string]: number } = {};
    
    respuestas.forEach(r => {
      if (r.respuestas && Array.isArray(r.respuestas)) {
        r.respuestas.forEach((resp: any) => {
          const key = `${resp.preguntaIndex}-${resp.opcionSeleccionada}`;
          resultados[key] = (resultados[key] || 0) + 1;
        });
      }
    });
    
    return Object.entries(resultados).map(([key, cantidad]) => {
      const [preguntaIndex, opcion] = key.split('-').map(Number);
      return { preguntaIndex, opcion, cantidad };
    });
  }

  async createRespuestaEncuesta(data: InsertRespuestaEncuesta): Promise<RespuestaEncuesta> {
    const [respuesta] = await db
      .insert(respuestasEncuestas)
      .values(data)
      .returning();
    
    await db.update(encuestas)
      .set({ totalRespuestas: sql`COALESCE(total_respuestas, 0) + 1` })
      .where(eq(encuestas.id, data.encuestaId));
    
    return respuesta;
  }

  async verificarRespuestaUsuario(encuestaId: string, usuarioId: string): Promise<boolean> {
    const [existe] = await db.select()
      .from(respuestasEncuestas)
      .where(
        and(
          eq(respuestasEncuestas.encuestaId, encuestaId),
          eq(respuestasEncuestas.usuarioId, usuarioId)
        )
      )
      .limit(1);
    return !!existe;
  }

  // ============================================================
  // COMENTARIOS
  // ============================================================

  async getComentarios(tipoContenido: string, contenidoId: string): Promise<Comentario[]> {
    return await db.select()
      .from(comentarios)
      .where(
        and(
          eq(comentarios.tipoContenido, tipoContenido),
          eq(comentarios.contenidoId, contenidoId),
          eq(comentarios.estado, 'activo')
        )
      )
      .orderBy(desc(comentarios.createdAt));
  }

  async createComentario(data: InsertComentario): Promise<Comentario> {
    const [comentario] = await db
      .insert(comentarios)
      .values(data)
      .returning();
    return comentario;
  }

  async deleteComentario(id: string): Promise<void> {
    await db.update(comentarios)
      .set({ estado: 'eliminado' })
      .where(eq(comentarios.id, id));
  }

  // ============================================================
  // OPERACIONES ADICIONALES PARA SERVICIOS
  // ============================================================

  async updateServicio(id: string, data: any): Promise<any> {
    const [actualizado] = await db
      .update(servicios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(servicios.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteServicio(id: string): Promise<void> {
    await db.delete(servicios).where(eq(servicios.id, id));
  }

  // ============================================================
  // OPERACIONES ADICIONALES PARA RADIOS
  // ============================================================

  async updateRadioOnline(id: string, data: Partial<RadioOnlineInsert>): Promise<RadioOnline | undefined> {
    const [actualizada] = await db
      .update(radiosOnline)
      .set(data)
      .where(eq(radiosOnline.id, id))
      .returning();
    return actualizada || undefined;
  }

  async deleteRadioOnline(id: string): Promise<void> {
    await db.delete(radiosOnline).where(eq(radiosOnline.id, id));
  }

  // ============================================================
  // OPERACIONES ADICIONALES PARA ARCHIVOS MP3
  // ============================================================

  async updateArchivoMp3(id: string, data: Partial<ArchivoMp3Insert>): Promise<ArchivoMp3 | undefined> {
    const [actualizado] = await db
      .update(archivosMp3)
      .set(data)
      .where(eq(archivosMp3.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteArchivoMp3(id: string): Promise<void> {
    await db.delete(archivosMp3).where(eq(archivosMp3.id, id));
  }

  // ============================================================
  // UTILIDADES PARA MIGRACIÓN
  // ============================================================

  async getAllGruposConMiembrosLegacy(): Promise<GrupoChat[]> {
    // Obtener todos los grupos con sus miembros JSON legacy
    return await db.select().from(gruposChat);
  }

  // ============================================================
  // SISTEMA DE REGISTRO POR NIVELES (5 ESTRELLAS)
  // ============================================================

  async getNivelRegistro(usuarioId: string): Promise<number> {
    // Verificar qué niveles ha completado el usuario
    // NOTA: credenciales_conductor NO es parte del nivel core (son credenciales opcionales independientes)
    const [basico] = await db.select().from(registroBasico).where(eq(registroBasico.usuarioId, usuarioId));
    if (!basico) return 0; // No ha completado nivel 1
    
    const [chat] = await db.select().from(registroChat).where(eq(registroChat.usuarioId, usuarioId));
    if (!chat) return 1; // Completó nivel 1, falta nivel 2
    
    const [ubicacion] = await db.select().from(registroUbicacion).where(eq(registroUbicacion.usuarioId, usuarioId));
    if (!ubicacion) return 2; // Completó nivel 2, falta nivel 3
    
    const [direccion] = await db.select().from(registroDireccion).where(eq(registroDireccion.usuarioId, usuarioId));
    if (!direccion) return 3; // Completó nivel 3, falta nivel 4
    
    const [marketplace] = await db.select().from(registroMarketplace).where(eq(registroMarketplace.usuarioId, usuarioId));
    if (!marketplace) return 4; // Completó nivel 4, falta nivel 5
    
    return 5; // Completó todos los niveles (1-5)
  }

  // NIVEL 1: Registro Básico
  async getRegistroBasico(usuarioId: string): Promise<RegistroBasico | undefined> {
    const [registro] = await db.select().from(registroBasico).where(eq(registroBasico.usuarioId, usuarioId));
    return registro || undefined;
  }

  async createRegistroBasico(data: InsertRegistroBasico): Promise<RegistroBasico> {
    const [registro] = await db.insert(registroBasico).values(data).returning();
    return registro;
  }

  // NIVEL 2: Servicio Chat
  async getRegistroChat(usuarioId: string): Promise<RegistroChat | undefined> {
    const [registro] = await db.select().from(registroChat).where(eq(registroChat.usuarioId, usuarioId));
    return registro || undefined;
  }

  async createRegistroChat(data: InsertRegistroChat): Promise<RegistroChat> {
    const [registro] = await db.insert(registroChat).values(data).returning();
    return registro;
  }

  async updateRegistroChat(usuarioId: string, data: Partial<InsertRegistroChat>): Promise<RegistroChat | undefined> {
    const [actualizado] = await db
      .update(registroChat)
      .set(data)
      .where(eq(registroChat.usuarioId, usuarioId))
      .returning();
    return actualizado || undefined;
  }

  // NIVEL 3: Ubicación
  async getRegistroUbicacion(usuarioId: string): Promise<RegistroUbicacion | undefined> {
    const [registro] = await db.select().from(registroUbicacion).where(eq(registroUbicacion.usuarioId, usuarioId));
    return registro || undefined;
  }

  async createRegistroUbicacion(data: InsertRegistroUbicacion): Promise<RegistroUbicacion> {
    const [registro] = await db.insert(registroUbicacion).values(data).returning();
    return registro;
  }

  async updateRegistroUbicacion(usuarioId: string, data: Partial<InsertRegistroUbicacion>): Promise<RegistroUbicacion | undefined> {
    const [actualizado] = await db
      .update(registroUbicacion)
      .set(data)
      .where(eq(registroUbicacion.usuarioId, usuarioId))
      .returning();
    return actualizado || undefined;
  }

  // NIVEL 4: Dirección
  async getRegistroDireccion(usuarioId: string): Promise<RegistroDireccion | undefined> {
    const [registro] = await db.select().from(registroDireccion).where(eq(registroDireccion.usuarioId, usuarioId));
    return registro || undefined;
  }

  async createRegistroDireccion(data: InsertRegistroDireccion): Promise<RegistroDireccion> {
    const [registro] = await db.insert(registroDireccion).values(data).returning();
    return registro;
  }

  async updateRegistroDireccion(usuarioId: string, data: Partial<InsertRegistroDireccion>): Promise<RegistroDireccion | undefined> {
    const [actualizado] = await db
      .update(registroDireccion)
      .set(data)
      .where(eq(registroDireccion.usuarioId, usuarioId))
      .returning();
    return actualizado || undefined;
  }

  // NIVEL 5: Marketplace
  async getRegistroMarketplace(usuarioId: string): Promise<RegistroMarketplace | undefined> {
    const [registro] = await db.select().from(registroMarketplace).where(eq(registroMarketplace.usuarioId, usuarioId));
    return registro || undefined;
  }

  async createRegistroMarketplace(data: InsertRegistroMarketplace): Promise<RegistroMarketplace> {
    const [registro] = await db.insert(registroMarketplace).values(data).returning();
    return registro;
  }

  async updateRegistroMarketplace(usuarioId: string, data: Partial<InsertRegistroMarketplace>): Promise<RegistroMarketplace | undefined> {
    const [actualizado] = await db
      .update(registroMarketplace)
      .set(data)
      .where(eq(registroMarketplace.usuarioId, usuarioId))
      .returning();
    return actualizado || undefined;
  }

  // CREDENCIALES DE CONDUCTOR
  async getCredencialesConductor(usuarioId: string): Promise<CredencialesConductor | undefined> {
    const [credenciales] = await db.select().from(credencialesConductor).where(eq(credencialesConductor.usuarioId, usuarioId));
    return credenciales || undefined;
  }

  async createCredencialesConductor(data: InsertCredencialesConductor): Promise<CredencialesConductor> {
    const [credenciales] = await db.insert(credencialesConductor).values(data).returning();
    return credenciales;
  }

  async updateCredencialesConductor(usuarioId: string, data: Partial<InsertCredencialesConductor>): Promise<CredencialesConductor | undefined> {
    const [actualizado] = await db
      .update(credencialesConductor)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(credencialesConductor.usuarioId, usuarioId))
      .returning();
    return actualizado || undefined;
  }

  // ============================================================
  // EVENTOS CALENDARIZADOS
  // ============================================================
  async getAllEventos(): Promise<Evento[]> {
    return await db.select().from(eventos).orderBy(desc(eventos.fechaInicio));
  }

  async getEventosActivos(): Promise<Evento[]> {
    return await db.select().from(eventos).where(eq(eventos.activo, true)).orderBy(desc(eventos.fechaInicio));
  }

  async getEventoById(id: string): Promise<Evento | undefined> {
    const [evento] = await db.select().from(eventos).where(eq(eventos.id, id));
    return evento;
  }

  async createEvento(data: InsertEvento): Promise<Evento> {
    const [evento] = await db.insert(eventos).values(data).returning();
    return evento;
  }

  async updateEvento(id: string, data: Partial<InsertEvento>): Promise<Evento | undefined> {
    const [actualizado] = await db
      .update(eventos)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(eventos.id, id))
      .returning();
    return actualizado;
  }

  async deleteEvento(id: string): Promise<void> {
    await db.delete(eventos).where(eq(eventos.id, id));
  }

  // ============================================================
  // AVISOS DE EMERGENCIA
  // ============================================================
  async getAllAvisosEmergencia(): Promise<AvisoEmergencia[]> {
    return await db.select().from(avisosEmergencia).orderBy(desc(avisosEmergencia.fechaInicio));
  }

  async getAvisosEmergenciaActivos(): Promise<AvisoEmergencia[]> {
    return await db.select().from(avisosEmergencia).where(eq(avisosEmergencia.activo, true)).orderBy(desc(avisosEmergencia.fechaInicio));
  }

  async getAvisoEmergenciaById(id: string): Promise<AvisoEmergencia | undefined> {
    const [aviso] = await db.select().from(avisosEmergencia).where(eq(avisosEmergencia.id, id));
    return aviso;
  }

  async createAvisoEmergencia(data: InsertAvisoEmergencia): Promise<AvisoEmergencia> {
    const [aviso] = await db.insert(avisosEmergencia).values(data).returning();
    return aviso;
  }

  async updateAvisoEmergencia(id: string, data: Partial<InsertAvisoEmergencia>): Promise<AvisoEmergencia | undefined> {
    const [actualizado] = await db
      .update(avisosEmergencia)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(avisosEmergencia.id, id))
      .returning();
    return actualizado;
  }

  async deleteAvisoEmergencia(id: string): Promise<void> {
    await db.delete(avisosEmergencia).where(eq(avisosEmergencia.id, id));
  }

  // ============================================================
  // TIPOS DE MONEDA Y TASAS DE CAMBIO
  // ============================================================
  async getAllTiposMoneda(): Promise<TipoMoneda[]> {
    return await db.select().from(tiposMoneda).orderBy(tiposMoneda.nombre);
  }

  async getTiposMonedaActivos(): Promise<TipoMoneda[]> {
    return await db.select().from(tiposMoneda).where(eq(tiposMoneda.activo, true)).orderBy(tiposMoneda.nombre);
  }

  async getTipoMonedaById(id: string): Promise<TipoMoneda | undefined> {
    const [tipo] = await db.select().from(tiposMoneda).where(eq(tiposMoneda.id, id));
    return tipo;
  }

  async createTipoMoneda(data: InsertTipoMoneda): Promise<TipoMoneda> {
    const [tipo] = await db.insert(tiposMoneda).values(data).returning();
    return tipo;
  }

  async updateTipoMoneda(id: string, data: Partial<InsertTipoMoneda>): Promise<TipoMoneda | undefined> {
    const [actualizado] = await db
      .update(tiposMoneda)
      .set(data)
      .where(eq(tiposMoneda.id, id))
      .returning();
    return actualizado;
  }

  async deleteTipoMoneda(id: string): Promise<void> {
    await db.delete(tiposMoneda).where(eq(tiposMoneda.id, id));
  }

  async getAllTasasCambio(): Promise<TasaCambio[]> {
    return await db.select().from(tasasCambio).orderBy(desc(tasasCambio.fechaActualizacion));
  }

  async getTasaCambioByMonedas(origenId: string, destinoId: string): Promise<TasaCambio | undefined> {
    const [tasa] = await db
      .select()
      .from(tasasCambio)
      .where(
        and(
          eq(tasasCambio.monedaOrigenId, origenId),
          eq(tasasCambio.monedaDestinoId, destinoId)
        )
      );
    return tasa;
  }

  async createTasaCambio(data: InsertTasaCambio): Promise<TasaCambio> {
    const [tasa] = await db.insert(tasasCambio).values(data).returning();
    return tasa;
  }

  async updateTasaCambio(id: string, data: Partial<InsertTasaCambio>): Promise<TasaCambio | undefined> {
    const [actualizado] = await db
      .update(tasasCambio)
      .set({
        ...data,
        fechaActualizacion: new Date(),
      })
      .where(eq(tasasCambio.id, id))
      .returning();
    return actualizado;
  }

  async deleteTasaCambio(id: string): Promise<void> {
    await db.delete(tasasCambio).where(eq(tasasCambio.id, id));
  }

  // ============================================================
  // CONFIGURACIÓN DEL SITIO
  // ============================================================
  async getConfiguracionByClave(clave: string): Promise<ConfiguracionSitio | undefined> {
    const [config] = await db.select().from(configuracionSitio).where(eq(configuracionSitio.clave, clave));
    return config;
  }

  async getAllConfiguraciones(): Promise<ConfiguracionSitio[]> {
    return await db.select().from(configuracionSitio).orderBy(configuracionSitio.categoria, configuracionSitio.clave);
  }

  async updateConfiguracion(clave: string, valor: string): Promise<ConfiguracionSitio | undefined> {
    const [actualizado] = await db
      .update(configuracionSitio)
      .set({
        valor,
        updatedAt: new Date(),
      })
      .where(eq(configuracionSitio.clave, clave))
      .returning();
    return actualizado;
  }

  // ============================================================
  // CATEGORÍAS DE SERVICIOS LOCALES
  // ============================================================
  async getCategoriasServicio(): Promise<CategoriaServicio[]> {
    return await db.select().from(categoriasServicio).orderBy(categoriasServicio.orden);
  }

  async getCategoriaServicio(id: string): Promise<CategoriaServicio | undefined> {
    const [categoria] = await db.select().from(categoriasServicio).where(eq(categoriasServicio.id, id));
    return categoria;
  }

  async createCategoriaServicio(data: InsertCategoriaServicio): Promise<CategoriaServicio> {
    const [categoria] = await db.insert(categoriasServicio).values(data).returning();
    return categoria;
  }

  async updateCategoriaServicio(id: string, data: Partial<InsertCategoriaServicio>): Promise<CategoriaServicio | undefined> {
    const [actualizada] = await db
      .update(categoriasServicio)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categoriasServicio.id, id))
      .returning();
    return actualizada;
  }

  async deleteCategoriaServicio(id: string): Promise<void> {
    await db.delete(categoriasServicio).where(eq(categoriasServicio.id, id));
  }

  // ============================================================
  // LOGOS DE SERVICIOS (Negocios/Locales)
  // ============================================================
  async getLogosServicio(categoriaId?: string, estado?: string): Promise<LogoServicio[]> {
    let query = db.select().from(logosServicios);
    
    if (categoriaId) {
      query = query.where(eq(logosServicios.categoriaId, categoriaId)) as any;
    }
    if (estado) {
      query = query.where(eq(logosServicios.estado, estado)) as any;
    }
    
    return await query.orderBy(desc(logosServicios.createdAt));
  }

  async getLogoServicio(id: string): Promise<LogoServicio | undefined> {
    const [logo] = await db.select().from(logosServicios).where(eq(logosServicios.id, id));
    return logo;
  }

  async getLogosServicioPorUsuario(usuarioId: string): Promise<LogoServicio[]> {
    return await db.select().from(logosServicios).where(eq(logosServicios.usuarioId, usuarioId));
  }

  async createLogoServicio(data: InsertLogoServicio): Promise<LogoServicio> {
    const [logo] = await db.insert(logosServicios).values(data).returning();
    return logo;
  }

  async updateLogoServicio(id: string, data: Partial<InsertLogoServicio>): Promise<LogoServicio | undefined> {
    const [actualizado] = await db
      .update(logosServicios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(logosServicios.id, id))
      .returning();
    return actualizado;
  }

  async deleteLogoServicio(id: string): Promise<void> {
    await db.delete(productosServicio).where(eq(productosServicio.logoServicioId, id));
    await db.delete(logosServicios).where(eq(logosServicios.id, id));
  }

  // ============================================================
  // PRODUCTOS DE SERVICIOS LOCALES
  // ============================================================
  async getProductosServicio(logoServicioId?: string, categoria?: string, disponible?: boolean): Promise<ProductoServicio[]> {
    let query = db.select().from(productosServicio);
    
    if (logoServicioId) {
      query = query.where(eq(productosServicio.logoServicioId, logoServicioId)) as any;
    }
    if (categoria) {
      query = query.where(eq(productosServicio.categoria, categoria)) as any;
    }
    if (disponible !== undefined) {
      query = query.where(eq(productosServicio.disponible, disponible)) as any;
    }
    
    return await query.orderBy(productosServicio.orden);
  }

  async getProductoServicio(id: string): Promise<ProductoServicio | undefined> {
    const [producto] = await db.select().from(productosServicio).where(eq(productosServicio.id, id));
    return producto;
  }

  async getProductosPorLogo(logoServicioId: string): Promise<ProductoServicio[]> {
    return await db.select().from(productosServicio)
      .where(eq(productosServicio.logoServicioId, logoServicioId))
      .orderBy(productosServicio.orden);
  }

  async createProductoServicio(data: InsertProductoServicio): Promise<ProductoServicio> {
    const [producto] = await db.insert(productosServicio).values(data).returning();
    return producto;
  }

  async createProductoServicioConCobro(
    data: InsertProductoServicio, 
    usuarioId: string, 
    esSuperAdmin: boolean
  ): Promise<{ producto: ProductoServicio; transaccion?: TransaccionSaldo; mensaje: string }> {
    const producto = await this.createProductoServicio(data);
    
    if (esSuperAdmin) {
      return { producto, mensaje: "Producto creado sin cobro (super admin)" };
    }

    const configCobro = await this.getConfiguracionCobros();
    if (!configCobro || !configCobro.activo) {
      return { producto, mensaje: "Producto creado sin cobro (cobro desactivado)" };
    }

    const user = await this.getUser(usuarioId);
    if (!user) {
      return { producto, mensaje: "Producto creado sin cobro (usuario no encontrado)" };
    }

    let monto = 0;
    if (configCobro.tipoValor === 'monto') {
      monto = parseFloat(configCobro.valor || '0');
    } else if (configCobro.tipoValor === 'porcentaje' && data.precio) {
      monto = (parseFloat(configCobro.valor || '0') / 100) * parseFloat(data.precio);
    }

    if (monto <= 0) {
      return { producto, mensaje: "Producto creado sin cobro (monto cero)" };
    }

    const transaccion = await this.createTransaccionSaldo({
      usuarioId,
      tipo: 'cobro',
      concepto: `Cobro por agregar producto: ${data.nombre}`,
      monto: monto.toString(),
      saldoAnterior: '0',
      saldoNuevo: (-monto).toString(),
      referenciaId: producto.id,
      referenciaTipo: 'producto_servicio',
      estado: 'completado',
    });

    return { 
      producto, 
      transaccion, 
      mensaje: `Producto creado. Se descontó S/. ${monto.toFixed(2)} de tu saldo` 
    };
  }

  async updateProductoServicio(id: string, data: Partial<InsertProductoServicio>): Promise<ProductoServicio | undefined> {
    const [actualizado] = await db
      .update(productosServicio)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productosServicio.id, id))
      .returning();
    return actualizado;
  }

  async deleteProductoServicio(id: string): Promise<void> {
    await db.delete(productosServicio).where(eq(productosServicio.id, id));
  }

  // ============================================================
  // TRANSACCIONES DE SALDO
  // ============================================================
  async getAllTransaccionesSaldo(): Promise<TransaccionSaldo[]> {
    return await db.select().from(transaccionesSaldo).orderBy(desc(transaccionesSaldo.createdAt));
  }

  async getTransaccionesSaldoUsuario(usuarioId: string): Promise<TransaccionSaldo[]> {
    return await db.select().from(transaccionesSaldo)
      .where(eq(transaccionesSaldo.usuarioId, usuarioId))
      .orderBy(desc(transaccionesSaldo.createdAt));
  }

  async createTransaccionSaldo(data: InsertTransaccionSaldo): Promise<TransaccionSaldo> {
    const [transaccion] = await db.insert(transaccionesSaldo).values(data).returning();
    return transaccion;
  }

  // ============================================================
  // FAVORITOS DEL USUARIO
  // ============================================================
  async getFavoritosUsuario(usuarioId: string, tipo?: string): Promise<any[]> {
    let query = db.select().from(interaccionesSociales)
      .where(
        and(
          eq(interaccionesSociales.usuarioId, usuarioId),
          eq(interaccionesSociales.tipoInteraccion, 'favorito')
        )
      );
    
    if (tipo) {
      query = query.where(eq(interaccionesSociales.tipoContenido, tipo)) as any;
    }
    
    const favoritos = await query.orderBy(desc(interaccionesSociales.createdAt));
    
    const favoritosConDetalles = await Promise.all(
      favoritos.map(async (fav) => {
        let detalle = null;
        if (fav.tipoContenido === 'producto_servicio') {
          detalle = await this.getProductoServicio(fav.contenidoId);
        } else if (fav.tipoContenido === 'logo_servicio') {
          detalle = await this.getLogoServicio(fav.contenidoId);
        } else if (fav.tipoContenido === 'popup') {
          detalle = await this.getPopup(fav.contenidoId);
        } else if (fav.tipoContenido === 'publicidad') {
          detalle = await this.getPublicidad(fav.contenidoId);
        }
        return { ...fav, detalle };
      })
    );
    
    return favoritosConDetalles;
  }

  // ============================================================
  // CONFIGURACIÓN DE COBROS
  // ============================================================
  async getConfiguracionCobros(): Promise<ConfiguracionSaldo | undefined> {
    const [config] = await db.select().from(configuracionSaldos)
      .where(eq(configuracionSaldos.tipoOperacion, 'costo_producto_servicio'));
    return config;
  }

  async updateConfiguracionCobros(data: Partial<InsertConfiguracionSaldo>): Promise<ConfiguracionSaldo> {
    const existing = await this.getConfiguracionCobros();
    
    if (existing) {
      const [actualizado] = await db
        .update(configuracionSaldos)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(configuracionSaldos.id, existing.id))
        .returning();
      return actualizado;
    } else {
      const [nuevo] = await db.insert(configuracionSaldos).values({
        tipoOperacion: 'costo_producto_servicio',
        tipoValor: data.tipoValor || 'monto',
        valor: data.valor || '0',
        descripcion: data.descripcion || 'Costo por agregar producto de servicio local',
        activo: data.activo ?? true,
      }).returning();
      return nuevo;
    }
  }

  // ============================================================
  // INTERACCIONES SOCIALES
  // ============================================================
  async toggleInteraccion(
    usuarioId: string, 
    tipoContenido: string, 
    contenidoId: string, 
    tipoInteraccion: string
  ): Promise<{ accion: 'agregado' | 'eliminado'; interaccion?: InteraccionSocial }> {
    if (tipoInteraccion === 'compartir') {
      const result = await this.registerCompartir(usuarioId, tipoContenido, contenidoId);
      return { accion: 'agregado', interaccion: result };
    }

    const existing = await db.select().from(interaccionesSociales)
      .where(
        and(
          eq(interaccionesSociales.usuarioId, usuarioId),
          eq(interaccionesSociales.tipoContenido, tipoContenido),
          eq(interaccionesSociales.contenidoId, contenidoId),
          eq(interaccionesSociales.tipoInteraccion, tipoInteraccion)
        )
      );

    if (existing.length > 0) {
      await db.delete(interaccionesSociales)
        .where(eq(interaccionesSociales.id, existing[0].id));
      await this.actualizarContadorInteraccion(tipoContenido, contenidoId, tipoInteraccion, -1);
      return { accion: 'eliminado' };
    } else {
      const [nueva] = await db.insert(interaccionesSociales).values({
        usuarioId,
        tipoContenido,
        contenidoId,
        tipoInteraccion,
      }).returning();
      await this.actualizarContadorInteraccion(tipoContenido, contenidoId, tipoInteraccion, 1);
      return { accion: 'agregado', interaccion: nueva };
    }
  }

  async registerCompartir(
    usuarioId: string, 
    tipoContenido: string, 
    contenidoId: string
  ): Promise<InteraccionSocial> {
    const [nueva] = await db.insert(interaccionesSociales).values({
      usuarioId,
      tipoContenido,
      contenidoId,
      tipoInteraccion: 'compartir',
    }).returning();
    
    await this.actualizarContadorInteraccion(tipoContenido, contenidoId, 'compartir', 1);
    return nueva;
  }

  private async actualizarContadorInteraccion(
    tipoContenido: string, 
    contenidoId: string, 
    tipoInteraccion: string, 
    delta: number
  ): Promise<void> {
    const campo = tipoInteraccion === 'like' ? 'totalLikes' : 
                  tipoInteraccion === 'favorito' ? 'totalFavoritos' : 
                  tipoInteraccion === 'compartir' ? 'totalCompartidos' : null;
    
    if (!campo) return;

    if (tipoContenido === 'logo_servicio') {
      await db.execute(sql`
        UPDATE logos_servicios 
        SET ${sql.raw(`"${campo}"`)} = COALESCE(${sql.raw(`"${campo}"`)}, 0) + ${delta}
        WHERE id = ${contenidoId}
      `);
    } else if (tipoContenido === 'producto_servicio') {
      await db.execute(sql`
        UPDATE productos_servicio 
        SET ${sql.raw(`"${campo}"`)} = COALESCE(${sql.raw(`"${campo}"`)}, 0) + ${delta}
        WHERE id = ${contenidoId}
      `);
    } else if (tipoContenido === 'popup') {
      await db.execute(sql`
        UPDATE popups_publicitarios 
        SET ${sql.raw(`"${campo}"`)} = COALESCE(${sql.raw(`"${campo}"`)}, 0) + ${delta}
        WHERE id = ${contenidoId}
      `);
    }
  }

  async getInteraccionesStats(tipoContenido: string, contenidoId: string): Promise<{
    likes: number;
    favoritos: number;
    compartidos: number;
    comentarios: number;
  }> {
    const [stats] = await db.execute(sql`
      SELECT 
        COALESCE(SUM(CASE WHEN tipo_interaccion = 'like' THEN 1 ELSE 0 END), 0) as likes,
        COALESCE(SUM(CASE WHEN tipo_interaccion = 'favorito' THEN 1 ELSE 0 END), 0) as favoritos,
        COALESCE(SUM(CASE WHEN tipo_interaccion = 'compartir' THEN 1 ELSE 0 END), 0) as compartidos
      FROM interacciones_sociales
      WHERE tipo_contenido = ${tipoContenido} AND contenido_id = ${contenidoId}
    `);

    const [comentariosCount] = await db.execute(sql`
      SELECT COUNT(*) as total FROM comentarios
      WHERE tipo_contenido = ${tipoContenido} AND contenido_id = ${contenidoId}
    `);

    return {
      likes: Number((stats as any)?.likes || 0),
      favoritos: Number((stats as any)?.favoritos || 0),
      compartidos: Number((stats as any)?.compartidos || 0),
      comentarios: Number((comentariosCount as any)?.total || 0),
    };
  }

  async getInteraccionesUsuario(
    usuarioId: string, 
    tipoContenido: string, 
    contenidoId: string
  ): Promise<{ liked: boolean; favorito: boolean; compartido: boolean }> {
    const interacciones = await db.select().from(interaccionesSociales)
      .where(
        and(
          eq(interaccionesSociales.usuarioId, usuarioId),
          eq(interaccionesSociales.tipoContenido, tipoContenido),
          eq(interaccionesSociales.contenidoId, contenidoId)
        )
      );

    return {
      liked: interacciones.some(i => i.tipoInteraccion === 'like'),
      favorito: interacciones.some(i => i.tipoInteraccion === 'favorito'),
      compartido: interacciones.some(i => i.tipoInteraccion === 'compartir'),
    };
  }

  // ============================================================
  // COMENTARIOS
  // ============================================================
  async getComentarios(tipoContenido: string, contenidoId: string): Promise<Comentario[]> {
    return await db.select().from(comentarios)
      .where(
        and(
          eq(comentarios.tipoContenido, tipoContenido),
          eq(comentarios.contenidoId, contenidoId)
        )
      )
      .orderBy(desc(comentarios.createdAt));
  }

  async getComentario(id: string): Promise<Comentario | undefined> {
    const [comentario] = await db.select().from(comentarios).where(eq(comentarios.id, id));
    return comentario;
  }

  async createComentario(data: InsertComentario): Promise<Comentario> {
    const [comentario] = await db.insert(comentarios).values(data).returning();
    return comentario;
  }

  async updateComentario(id: string, data: { texto: string }): Promise<Comentario | undefined> {
    const [actualizado] = await db
      .update(comentarios)
      .set({ texto: data.texto, updatedAt: new Date() })
      .where(eq(comentarios.id, id))
      .returning();
    return actualizado;
  }

  async deleteComentario(id: string): Promise<void> {
    await db.delete(comentarios).where(eq(comentarios.id, id));
  }

  // ============================================================
  // SISTEMA DE CARTERA Y SALDOS
  // ============================================================

  // Métodos de pago
  async getMetodosPago(usuarioId?: string, esPlataforma?: boolean): Promise<MetodoPago[]> {
    let query = db.select().from(metodosPago);
    
    if (usuarioId && esPlataforma !== undefined) {
      return await db.select().from(metodosPago)
        .where(and(
          eq(metodosPago.usuarioId, usuarioId),
          eq(metodosPago.esPlataforma, esPlataforma)
        ))
        .orderBy(metodosPago.orden);
    } else if (usuarioId) {
      return await db.select().from(metodosPago)
        .where(eq(metodosPago.usuarioId, usuarioId))
        .orderBy(metodosPago.orden);
    } else if (esPlataforma !== undefined) {
      return await db.select().from(metodosPago)
        .where(eq(metodosPago.esPlataforma, esPlataforma))
        .orderBy(metodosPago.orden);
    }
    
    return await db.select().from(metodosPago).orderBy(metodosPago.orden);
  }

  async getMetodoPago(id: string): Promise<MetodoPago | undefined> {
    const [metodo] = await db.select().from(metodosPago).where(eq(metodosPago.id, id));
    return metodo || undefined;
  }

  async createMetodoPago(data: InsertMetodoPago): Promise<MetodoPago> {
    const [metodo] = await db.insert(metodosPago).values(data).returning();
    return metodo;
  }

  async updateMetodoPago(id: string, data: Partial<InsertMetodoPago>): Promise<MetodoPago | undefined> {
    const [actualizado] = await db
      .update(metodosPago)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(metodosPago.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteMetodoPago(id: string): Promise<void> {
    await db.delete(metodosPago).where(eq(metodosPago.id, id));
  }

  // Monedas y tipos de cambio
  async getMonedas(): Promise<Moneda[]> {
    return await db.select().from(monedas).orderBy(monedas.orden);
  }

  async getMoneda(codigo: string): Promise<Moneda | undefined> {
    const [moneda] = await db.select().from(monedas).where(eq(monedas.codigo, codigo));
    return moneda || undefined;
  }

  async createMoneda(data: InsertMoneda): Promise<Moneda> {
    const [moneda] = await db.insert(monedas).values(data).returning();
    return moneda;
  }

  async updateMoneda(id: string, data: Partial<InsertMoneda>): Promise<Moneda | undefined> {
    const [actualizado] = await db
      .update(monedas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(monedas.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteMoneda(id: string): Promise<void> {
    await db.delete(monedas).where(eq(monedas.id, id));
  }

  // Saldos de usuarios
  async getSaldoUsuario(usuarioId: string): Promise<SaldoUsuario | undefined> {
    const [saldo] = await db.select().from(saldosUsuarios).where(eq(saldosUsuarios.usuarioId, usuarioId));
    return saldo || undefined;
  }

  async getAllSaldosUsuarios(): Promise<SaldoUsuario[]> {
    return await db.select().from(saldosUsuarios).orderBy(desc(saldosUsuarios.saldo));
  }

  async upsertSaldoUsuario(data: InsertSaldoUsuario): Promise<SaldoUsuario> {
    const [saldo] = await db
      .insert(saldosUsuarios)
      .values(data)
      .onConflictDoUpdate({
        target: saldosUsuarios.usuarioId,
        set: {
          saldo: data.saldo,
          monedaPreferida: data.monedaPreferida,
          totalIngresos: data.totalIngresos,
          totalEgresos: data.totalEgresos,
          ultimaActualizacion: new Date(),
        },
      })
      .returning();
    return saldo;
  }

  async actualizarSaldo(usuarioId: string, monto: number, tipo: 'ingreso' | 'egreso'): Promise<SaldoUsuario> {
    const saldoActual = await this.getSaldoUsuario(usuarioId);
    
    const nuevoSaldo = tipo === 'ingreso' 
      ? (parseFloat(saldoActual?.saldo || '0') + monto)
      : (parseFloat(saldoActual?.saldo || '0') - monto);
    
    const totalIngresos = tipo === 'ingreso'
      ? (parseFloat(saldoActual?.totalIngresos || '0') + monto)
      : parseFloat(saldoActual?.totalIngresos || '0');
    
    const totalEgresos = tipo === 'egreso'
      ? (parseFloat(saldoActual?.totalEgresos || '0') + monto)
      : parseFloat(saldoActual?.totalEgresos || '0');

    return await this.upsertSaldoUsuario({
      usuarioId,
      saldo: nuevoSaldo.toFixed(2),
      totalIngresos: totalIngresos.toFixed(2),
      totalEgresos: totalEgresos.toFixed(2),
      monedaPreferida: saldoActual?.monedaPreferida || 'PEN',
    });
  }

  // Solicitudes de saldo (recargas y retiros)
  async getSolicitudesSaldo(estado?: string): Promise<SolicitudSaldo[]> {
    if (estado) {
      return await db.select().from(solicitudesSaldo)
        .where(eq(solicitudesSaldo.estado, estado))
        .orderBy(desc(solicitudesSaldo.createdAt));
    }
    return await db.select().from(solicitudesSaldo).orderBy(desc(solicitudesSaldo.createdAt));
  }

  async getSolicitudesSaldoPorUsuario(usuarioId: string): Promise<SolicitudSaldo[]> {
    return await db.select().from(solicitudesSaldo)
      .where(eq(solicitudesSaldo.usuarioId, usuarioId))
      .orderBy(desc(solicitudesSaldo.createdAt));
  }

  async getSolicitudSaldo(id: string): Promise<SolicitudSaldo | undefined> {
    const [solicitud] = await db.select().from(solicitudesSaldo).where(eq(solicitudesSaldo.id, id));
    return solicitud || undefined;
  }

  async createSolicitudSaldo(data: InsertSolicitudSaldo): Promise<SolicitudSaldo> {
    const [solicitud] = await db.insert(solicitudesSaldo).values(data).returning();
    return solicitud;
  }

  async updateSolicitudSaldo(id: string, data: Partial<InsertSolicitudSaldo>): Promise<SolicitudSaldo | undefined> {
    const [actualizado] = await db
      .update(solicitudesSaldo)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(solicitudesSaldo.id, id))
      .returning();
    return actualizado || undefined;
  }

  async aprobarSolicitudSaldo(id: string, aprobadoPor: string): Promise<SolicitudSaldo | undefined> {
    const solicitud = await this.getSolicitudSaldo(id);
    if (!solicitud) return undefined;

    // Actualizar saldo del usuario
    const tipoOperacion = solicitud.tipo === 'recarga' ? 'ingreso' : 'egreso';
    await this.actualizarSaldo(solicitud.usuarioId, parseFloat(solicitud.monto), tipoOperacion as 'ingreso' | 'egreso');

    // Registrar transacción
    const saldoActual = await this.getSaldoUsuario(solicitud.usuarioId);
    await this.createTransaccionSaldo({
      usuarioId: solicitud.usuarioId,
      tipo: solicitud.tipo,
      concepto: solicitud.tipo === 'recarga' ? 'Recarga de saldo aprobada' : 'Retiro de saldo aprobado',
      monto: solicitud.monto,
      saldoAnterior: (parseFloat(saldoActual?.saldo || '0') - (tipoOperacion === 'ingreso' ? parseFloat(solicitud.monto) : -parseFloat(solicitud.monto))).toFixed(2),
      saldoNuevo: saldoActual?.saldo || '0',
      referenciaId: id,
      referenciaTipo: 'solicitud_saldo',
      estado: 'completado',
    });

    // Actualizar solicitud
    const [actualizado] = await db
      .update(solicitudesSaldo)
      .set({
        estado: 'aprobado',
        aprobadoPor,
        fechaAprobacion: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(solicitudesSaldo.id, id))
      .returning();
    return actualizado || undefined;
  }

  async rechazarSolicitudSaldo(id: string, motivoRechazo: string): Promise<SolicitudSaldo | undefined> {
    const [actualizado] = await db
      .update(solicitudesSaldo)
      .set({
        estado: 'rechazado',
        motivoRechazo,
        updatedAt: new Date(),
      })
      .where(eq(solicitudesSaldo.id, id))
      .returning();
    return actualizado || undefined;
  }

  // Transacciones de saldo
  async getTransaccionesSaldo(usuarioId?: string): Promise<TransaccionSaldo[]> {
    if (usuarioId) {
      return await db.select().from(transaccionesSaldo)
        .where(eq(transaccionesSaldo.usuarioId, usuarioId))
        .orderBy(desc(transaccionesSaldo.createdAt));
    }
    return await db.select().from(transaccionesSaldo).orderBy(desc(transaccionesSaldo.createdAt));
  }

  async createTransaccionSaldo(data: InsertTransaccionSaldo): Promise<TransaccionSaldo> {
    const [transaccion] = await db.insert(transaccionesSaldo).values(data).returning();
    return transaccion;
  }
}

export const storage = new DatabaseStorage();
