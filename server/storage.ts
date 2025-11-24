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
  type Publicidad,
  type Servicio,
  type ProductoDelivery,
  type GrupoChat,
  type Mensaje,
  type Emergencia,
  type ViajeTaxi,
  type PedidoDelivery,
  type RadioOnline,
  type ArchivoMp3,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interfaz del storage
export interface IStorage {
  // Operaciones de usuarios (obligatorias para Replit Auth)
  getUser(id: string): Promise<Usuario | undefined>;
  upsertUsuario(usuario: UpsertUsuario): Promise<Usuario>;
  
  // Operaciones de publicidad
  getPublicidades(tipo?: string): Promise<Publicidad[]>;
  createPublicidad(publicidad: InsertPublicidad): Promise<Publicidad>;
  updatePublicidad(id: string, data: Partial<InsertPublicidad>): Promise<Publicidad | undefined>;
  deletePublicidad(id: string): Promise<void>;
  
  // Operaciones de servicios
  getServicios(): Promise<Servicio[]>;
  getServicio(id: string): Promise<Servicio | undefined>;
  createServicio(servicio: InsertServicio): Promise<Servicio>;
  updateServicio(id: string, data: Partial<InsertServicio>): Promise<Servicio | undefined>;
  
  // Operaciones de productos delivery
  getProductosPorServicio(servicioId: string): Promise<ProductoDelivery[]>;
  createProducto(producto: InsertProductoDelivery): Promise<ProductoDelivery>;
  
  // Operaciones de chat
  getGruposPorUsuario(usuarioId: string): Promise<GrupoChat[]>;
  getGrupo(id: string): Promise<GrupoChat | undefined>;
  createGrupo(grupo: InsertGrupoChat): Promise<GrupoChat>;
  agregarMiembroGrupo(miembro: InsertMiembroGrupo): Promise<MiembroGrupo>;
  getMensajesPorGrupo(grupoId: string): Promise<Mensaje[]>;
  createMensaje(mensaje: InsertMensaje): Promise<Mensaje>;
  
  // Operaciones de emergencias
  getEmergencias(): Promise<Emergencia[]>;
  getEmergenciasRecientes(limite?: number): Promise<Emergencia[]>;
  createEmergencia(emergencia: InsertEmergencia): Promise<Emergencia>;
  updateEmergencia(id: string, data: Partial<InsertEmergencia>): Promise<Emergencia | undefined>;
  
  // Operaciones de taxi
  getViajesTaxi(usuarioId?: string): Promise<ViajeTaxi[]>;
  createViajeTaxi(viaje: InsertViajeTaxi): Promise<ViajeTaxi>;
  updateViajeTaxi(id: string, data: Partial<InsertViajeTaxi>): Promise<ViajeTaxi | undefined>;
  
  // Operaciones de delivery
  getPedidosDelivery(usuarioId?: string): Promise<PedidoDelivery[]>;
  createPedidoDelivery(pedido: InsertPedidoDelivery): Promise<PedidoDelivery>;
  updatePedidoDelivery(id: string, data: Partial<InsertPedidoDelivery>): Promise<PedidoDelivery | undefined>;
  
  // Operaciones de radio y audio
  getRadiosOnline(): Promise<RadioOnline[]>;
  createRadioOnline(radio: InsertRadioOnline): Promise<RadioOnline>;
  getArchivosMp3(): Promise<ArchivoMp3[]>;
  createArchivoMp3(archivo: InsertArchivoMp3): Promise<ArchivoMp3>;
  
  // Operaciones de configuración
  getConfiguracion(clave: string): Promise<ConfiguracionSitio | undefined>;
  setConfiguracion(config: InsertConfiguracionSitio): Promise<ConfiguracionSitio>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================
  // USUARIOS
  // ============================================================
  
  async getUser(id: string): Promise<Usuario | undefined> {
    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return usuario || undefined;
  }

  async upsertUsuario(usuarioData: UpsertUsuario): Promise<Usuario> {
    const [usuario] = await db
      .insert(usuarios)
      .values(usuarioData)
      .onConflictDoUpdate({
        target: usuarios.id,
        set: {
          ...usuarioData,
          updatedAt: new Date(),
        },
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
    const result = await db
      .select({ grupo: gruposChat })
      .from(gruposChat)
      .leftJoin(miembrosGrupo, eq(gruposChat.id, miembrosGrupo.grupoId))
      .where(eq(miembrosGrupo.usuarioId, usuarioId))
      .orderBy(desc(gruposChat.updatedAt));
    
    return result.map(r => r.grupo);
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

  async agregarMiembroGrupo(miembroData: InsertMiembroGrupo): Promise<MiembroGrupo> {
    const [miembro] = await db
      .insert(miembrosGrupo)
      .values(miembroData)
      .returning();
    return miembro;
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
          updatedAt: new Date(),
        },
      })
      .returning();
    return config;
  }
}

export const storage = new DatabaseStorage();
