import {
  usuarios,
  publicidad,
  servicios,
  productosDelivery,
  gruposChat,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interfaz del storage
export interface IStorage {
  // Operaciones de usuarios (obligatorias para Replit Auth)
  getUser(id: string): Promise<Usuario | undefined>;
  upsertUsuario(usuario: Partial<InsertUsuario> & { id: string }): Promise<Usuario>;
  
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
  agregarMiembroGrupo(data: { grupoId: string; usuarioId: string; rol: string }): Promise<void>;
  getMensajesPorGrupo(grupoId: string): Promise<Mensaje[]>;
  createMensaje(mensaje: MensajeInsert): Promise<Mensaje>;
  
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
    // Los miembros están almacenados como JSON array en gruposChat.miembros
    const grupos = await db.select().from(gruposChat).orderBy(desc(gruposChat.createdAt));
    // Filtrar grupos donde el usuario es miembro
    return grupos.filter(g => g.miembros?.includes(usuarioId));
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
    return grupo;
  }

  async agregarMiembroGrupo(data: { grupoId: string; usuarioId: string; rol: string }): Promise<void> {
    // Nota: Esta tabla no existe aún, se creará cuando se necesite
    // Por ahora es un stub para que routes.ts funcione
    console.log('agregarMiembroGrupo llamado:', data);
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
}

export const storage = new DatabaseStorage();
