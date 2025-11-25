import {
  usuarios,
  publicidad,
  servicios,
  productosDelivery,
  gruposChat,
  miembrosGrupo,
  mensajes,
  emergencias,
  viajeTaxi,
  pedidosDelivery,
  radiosOnline,
  archivosMp3,
  configuracionSitio,
  usuarioRoles,
  administradores,
  configuracionSaldos,
  encuestas,
  popupsPublicitarios,
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
  type Usuario,
  type InsertUsuario,
  type Publicidad,
  type PublicidadInsert,
  type Servicio,
  type ServicioInsert,
  type ProductoDelivery,
  type ProductoDeliveryInsert,
  type GrupoChat,
  type GrupoChatInsert,
  type Mensaje,
  type MensajeInsert,
  type Emergencia,
  type EmergenciaInsert,
  type ViajeTaxi,
  type ViajeTaxiInsert,
  type PedidoDelivery,
  type PedidoDeliveryInsert,
  type RadioOnline,
  type RadioOnlineInsert,
  type ArchivoMp3,
  type ArchivoMp3Insert,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interfaz del storage
export interface IStorage {
  // Operaciones de usuarios (obligatorias para Replit Auth)
  getUser(id: string): Promise<Usuario | undefined>;
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
  getPopup(id: string): Promise<PopupPublicitario | undefined>;
  createPopup(data: InsertPopupPublicitario): Promise<PopupPublicitario>;
  updatePopup(id: string, data: Partial<InsertPopupPublicitario>): Promise<PopupPublicitario | undefined>;
  deletePopup(id: string): Promise<void>;
  
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
}

export class DatabaseStorage implements IStorage {
  // ============================================================
  // USUARIOS
  // ============================================================
  
  async getUser(id: string): Promise<Usuario | undefined> {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return usuario || undefined;
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
    // Obtener grupos usando la tabla normalizada miembros_grupo
    const gruposConMiembros = await db
      .select({
        id: gruposChat.id,
        nombre: gruposChat.nombre,
        tipo: gruposChat.tipo,
        miembros: gruposChat.miembros,
        creadorId: gruposChat.creadorId,
        createdAt: gruposChat.createdAt,
        updatedAt: gruposChat.updatedAt,
      })
      .from(gruposChat)
      .innerJoin(miembrosGrupo, eq(gruposChat.id, miembrosGrupo.grupoId))
      .where(eq(miembrosGrupo.usuarioId, usuarioId))
      .orderBy(desc(gruposChat.createdAt));
    
    return gruposConMiembros;
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
    return mensaje;
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
    const roles = await db.select()
      .from(usuarioRoles)
      .where(eq(usuarioRoles.usuarioId, usuarioId));
    return roles.map(r => r.rol!);
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
}

export const storage = new DatabaseStorage();
