import {
  usuarios,
  publicidad,
  servicios,
  productosDelivery,
  gruposChat,
  miembrosGrupo,
  mensajes,
  emergencias,
  contactosFamiliares,
  viajesTaxi,
  pedidosDelivery,
  radiosOnline,
  listasMp3,
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
  subcategoriasServicio,
  logosServicios,
  productosServicio,
  transaccionesSaldo,
  notificacionesChat,
  metodosPago,
  monedas,
  solicitudesSaldo,
  saldosUsuarios,
  sectores,
  lugaresUsuario,
  tasasCambioLocales,
  configuracionMonedas,
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
  type ListaMp3,
  type InsertListaMp3,
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
  type SubcategoriaServicio,
  type InsertSubcategoriaServicio,
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
  type TasaCambioLocal,
  type InsertTasaCambioLocal,
  type ConfiguracionMoneda,
  type InsertConfiguracionMoneda,
  type ContactoFamiliar,
  type InsertContactoFamiliar,
  type Sector,
  type InsertSector,
  type LugarUsuario,
  type InsertLugarUsuario,
  planesMembresia,
  membresiasUsuarios,
  categoriasProductosUsuario,
  productosUsuario,
  configuracionCostos,
  type PlanMembresia,
  type InsertPlanMembresia,
  type MembresiaUsuario,
  type InsertMembresiaUsuario,
  type CategoriaProductoUsuario,
  type InsertCategoriaProductoUsuario,
  type ProductoUsuario,
  type InsertProductoUsuario,
  type ConfiguracionCosto,
  type InsertConfiguracionCosto,
  categoriasRol,
  subcategoriasRol,
  type CategoriaRol,
  type InsertCategoriaRol,
  type SubcategoriaRol,
  type InsertSubcategoriaRol,
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
  getUsersByRole(rol: string): Promise<Usuario[]>;
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
  
  // Operaciones de contactos familiares
  getContactosFamiliares(usuarioId: string): Promise<ContactoFamiliar[]>;
  createContactoFamiliar(contacto: InsertContactoFamiliar): Promise<ContactoFamiliar>;
  updateContactoFamiliar(id: string, data: Partial<InsertContactoFamiliar>): Promise<ContactoFamiliar | undefined>;
  deleteContactoFamiliar(id: string): Promise<void>;
  
  // Operaciones de lugares frecuentes del usuario
  getLugaresUsuario(usuarioId: string): Promise<LugarUsuario[]>;
  getLugarUsuario(id: string): Promise<LugarUsuario | undefined>;
  createLugarUsuario(lugar: InsertLugarUsuario): Promise<LugarUsuario>;
  updateLugarUsuario(id: string, data: Partial<InsertLugarUsuario>): Promise<LugarUsuario | undefined>;
  deleteLugarUsuario(id: string): Promise<void>;
  
  // Operaciones de taxi
  getViajesTaxi(usuarioId?: string): Promise<ViajeTaxi[]>;
  getViajesConductor(conductorId: string): Promise<ViajeTaxi[]>;
  createViajeTaxi(viaje: ViajeTaxiInsert): Promise<ViajeTaxi>;
  updateViajeTaxi(id: string, data: Partial<ViajeTaxiInsert>): Promise<ViajeTaxi | undefined>;
  
  // Operaciones de delivery
  getPedidosDelivery(usuarioId?: string): Promise<PedidoDelivery[]>;
  createPedidoDelivery(pedido: PedidoDeliveryInsert): Promise<PedidoDelivery>;
  updatePedidoDelivery(id: string, data: Partial<PedidoDeliveryInsert>): Promise<PedidoDelivery | undefined>;
  
  // Operaciones de radio online
  getRadiosOnline(): Promise<RadioOnline[]>;
  getRadioOnline(id: number): Promise<RadioOnline | undefined>;
  getRadioPredeterminada(): Promise<RadioOnline | undefined>;
  createRadioOnline(radio: InsertRadioOnline): Promise<RadioOnline>;
  updateRadioOnline(id: number, data: Partial<InsertRadioOnline>): Promise<RadioOnline | undefined>;
  deleteRadioOnline(id: number): Promise<void>;
  
  // Operaciones de listas MP3
  getListasMp3(): Promise<ListaMp3[]>;
  getListaMp3(id: number): Promise<ListaMp3 | undefined>;
  createListaMp3(lista: InsertListaMp3): Promise<ListaMp3>;
  updateListaMp3(id: number, data: Partial<InsertListaMp3>): Promise<ListaMp3 | undefined>;
  deleteListaMp3(id: number): Promise<void>;
  
  // Operaciones de archivos MP3
  getArchivosMp3(): Promise<ArchivoMp3[]>;
  getArchivosMp3PorLista(listaId: number): Promise<ArchivoMp3[]>;
  getArchivoMp3(id: string): Promise<ArchivoMp3 | undefined>;
  createArchivoMp3(archivo: InsertArchivoMp3): Promise<ArchivoMp3>;
  updateArchivoMp3(id: string, data: Partial<InsertArchivoMp3>): Promise<ArchivoMp3 | undefined>;
  deleteArchivoMp3(id: string): Promise<void>;
  reordenarArchivosMp3(listaId: number, orden: { id: string; orden: number }[]): Promise<void>;
  
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
  observarSolicitudSaldo(id: string, notas: string | null): Promise<SolicitudSaldo | undefined>;
  
  // Transacciones de saldo
  getTransaccionesSaldo(usuarioId?: string): Promise<TransaccionSaldo[]>;
  createTransaccionSaldo(data: InsertTransaccionSaldo): Promise<TransaccionSaldo>;
  
  // Estadísticas públicas
  getEstadisticasPublicas(): Promise<{
    usuariosActivos: number;
    serviciosLocales: number;
    monitoreo24h: boolean;
    satisfaccion: number;
  }>;
  
  // ============================================================
  // INTERACCIONES DE PUBLICIDAD
  // ============================================================
  getContadoresPublicidad(publicidadId: string): Promise<{ likes: number; favoritos: number; compartidos: number; impresiones: number; comentarios: number; agendados: number } | null>;
  getInteraccionesUsuario(publicidadId: string, usuarioId: string): Promise<{ hasLike: boolean; hasFavorito: boolean }>;
  toggleLikePublicidad(publicidadId: string, usuarioId: string): Promise<{ liked: boolean; totalLikes: number }>;
  toggleFavoritoPublicidad(publicidadId: string, usuarioId: string): Promise<{ favorito: boolean; totalFavoritos: number }>;
  registrarCompartidoPublicidad(publicidadId: string, usuarioId: string, redSocial: string): Promise<{ compartidos: number }>;
  registrarImpresionPublicidad(publicidadId: string, usuarioId: string): Promise<{ impresiones: number }>;
  registrarAgendaPublicidad(publicidadId: string, usuarioId: string): Promise<{ agendados: number }>;
  getComentariosPublicidad(publicidadId: string): Promise<any[]>;
  crearComentarioPublicidad(publicidadId: string, usuarioId: string, contenido: string): Promise<any>;
  eliminarComentarioPublicidad(comentarioId: string, usuarioId: string): Promise<void>;
  getFavoritosUsuario(usuarioId: string): Promise<any[]>;
  
  // ============================================================
  // SECTORES (autocompletado)
  // ============================================================
  getSectores(departamento?: string, distrito?: string): Promise<Sector[]>;
  buscarSectores(texto: string, departamento?: string, distrito?: string): Promise<Sector[]>;
  createSector(data: InsertSector): Promise<Sector>;
  
  // ============================================================
  // PLANES DE MEMBRESÍA
  // ============================================================
  getPlanesMembresia(soloActivos?: boolean): Promise<PlanMembresia[]>;
  getPlanMembresia(id: string): Promise<PlanMembresia | undefined>;
  createPlanMembresia(data: InsertPlanMembresia): Promise<PlanMembresia>;
  updatePlanMembresia(id: string, data: Partial<InsertPlanMembresia>): Promise<PlanMembresia | undefined>;
  deletePlanMembresia(id: string): Promise<void>;
  
  // ============================================================
  // MEMBRESÍAS DE USUARIOS
  // ============================================================
  getMembresiasUsuarios(): Promise<MembresiaUsuario[]>;
  getMembresiaUsuario(usuarioId: string): Promise<MembresiaUsuario | undefined>;
  getMembresiaActiva(usuarioId: string): Promise<MembresiaUsuario | undefined>;
  createMembresiaUsuario(data: InsertMembresiaUsuario): Promise<MembresiaUsuario>;
  updateMembresiaUsuario(id: string, data: Partial<InsertMembresiaUsuario>): Promise<MembresiaUsuario | undefined>;
  
  // ============================================================
  // CATEGORÍAS DE PRODUCTOS DE USUARIO
  // ============================================================
  getCategoriasProductosUsuario(incluyeInactivas?: boolean): Promise<CategoriaProductoUsuario[]>;
  getSubcategorias(categoriaPadreId: string): Promise<CategoriaProductoUsuario[]>;
  getCategoriaProductoUsuario(id: string): Promise<CategoriaProductoUsuario | undefined>;
  createCategoriaProductoUsuario(data: InsertCategoriaProductoUsuario): Promise<CategoriaProductoUsuario>;
  updateCategoriaProductoUsuario(id: string, data: Partial<InsertCategoriaProductoUsuario>): Promise<CategoriaProductoUsuario | undefined>;
  deleteCategoriaProductoUsuario(id: string): Promise<void>;
  
  // ============================================================
  // PRODUCTOS DE USUARIO
  // ============================================================
  getProductosUsuario(filtros?: { usuarioId?: string; categoriaId?: string; estado?: string }): Promise<ProductoUsuario[]>;
  getProductoUsuario(id: string): Promise<ProductoUsuario | undefined>;
  createProductoUsuario(data: InsertProductoUsuario): Promise<ProductoUsuario>;
  updateProductoUsuario(id: string, data: Partial<InsertProductoUsuario>): Promise<ProductoUsuario | undefined>;
  deleteProductoUsuario(id: string): Promise<void>;
  
  // ============================================================
  // CONFIGURACIÓN DE COSTOS
  // ============================================================
  getConfiguracionesCostos(): Promise<ConfiguracionCosto[]>;
  getConfiguracionCosto(tipoServicio: string): Promise<ConfiguracionCosto | undefined>;
  upsertConfiguracionCosto(data: InsertConfiguracionCosto): Promise<ConfiguracionCosto>;
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

  async getUsersByRole(rol: string): Promise<Usuario[]> {
    return await db.select().from(usuarios).where(eq(usuarios.rol, rol));
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
  // INTERACCIONES DE PUBLICIDAD
  // ============================================================

  async getContadoresPublicidad(publicidadId: string): Promise<{ likes: number; favoritos: number; compartidos: number; impresiones: number; comentarios: number; agendados: number } | null> {
    const result = await db.execute(sql`
      SELECT likes, favoritos, compartidos, impresiones, comentarios, agendados 
      FROM contadores_publicidad 
      WHERE publicidad_id = ${publicidadId}
    `);
    if (result.rows.length === 0) {
      return { likes: 0, favoritos: 0, compartidos: 0, impresiones: 0, comentarios: 0, agendados: 0 };
    }
    const row = result.rows[0] as any;
    return {
      likes: row.likes || 0,
      favoritos: row.favoritos || 0,
      compartidos: row.compartidos || 0,
      impresiones: row.impresiones || 0,
      comentarios: row.comentarios || 0,
      agendados: row.agendados || 0,
    };
  }

  async getInteraccionesUsuario(publicidadId: string, usuarioId: string): Promise<{ hasLike: boolean; hasFavorito: boolean }> {
    const result = await db.execute(sql`
      SELECT tipo FROM interacciones_publicidad 
      WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId}
    `);
    const tipos = (result.rows as any[]).map(r => r.tipo);
    return {
      hasLike: tipos.includes('like'),
      hasFavorito: tipos.includes('favorito'),
    };
  }

  private async ensureContadorExists(publicidadId: string): Promise<void> {
    await db.execute(sql`
      INSERT INTO contadores_publicidad (publicidad_id) 
      VALUES (${publicidadId}) 
      ON CONFLICT (publicidad_id) DO NOTHING
    `);
  }

  async toggleLikePublicidad(publicidadId: string, usuarioId: string): Promise<{ liked: boolean; totalLikes: number }> {
    await this.ensureContadorExists(publicidadId);
    
    const existingResult = await db.execute(sql`
      SELECT id FROM interacciones_publicidad 
      WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId} AND tipo = 'like'
    `);
    
    let liked: boolean;
    if (existingResult.rows.length > 0) {
      await db.execute(sql`
        DELETE FROM interacciones_publicidad 
        WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId} AND tipo = 'like'
      `);
      await db.execute(sql`
        UPDATE contadores_publicidad SET likes = likes - 1, updated_at = NOW() 
        WHERE publicidad_id = ${publicidadId}
      `);
      liked = false;
    } else {
      await db.execute(sql`
        INSERT INTO interacciones_publicidad (publicidad_id, usuario_id, tipo) 
        VALUES (${publicidadId}, ${usuarioId}, 'like')
        ON CONFLICT (publicidad_id, usuario_id, tipo) DO NOTHING
      `);
      await db.execute(sql`
        UPDATE contadores_publicidad SET likes = likes + 1, updated_at = NOW() 
        WHERE publicidad_id = ${publicidadId}
      `);
      liked = true;
    }
    
    const countResult = await db.execute(sql`
      SELECT likes FROM contadores_publicidad WHERE publicidad_id = ${publicidadId}
    `);
    const totalLikes = (countResult.rows[0] as any)?.likes || 0;
    
    return { liked, totalLikes };
  }

  async toggleFavoritoPublicidad(publicidadId: string, usuarioId: string): Promise<{ favorito: boolean; totalFavoritos: number }> {
    await this.ensureContadorExists(publicidadId);
    
    const existingResult = await db.execute(sql`
      SELECT id FROM interacciones_publicidad 
      WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId} AND tipo = 'favorito'
    `);
    
    let favorito: boolean;
    if (existingResult.rows.length > 0) {
      await db.execute(sql`
        DELETE FROM interacciones_publicidad 
        WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId} AND tipo = 'favorito'
      `);
      await db.execute(sql`
        DELETE FROM favoritos_usuario 
        WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId}
      `);
      await db.execute(sql`
        UPDATE contadores_publicidad SET favoritos = favoritos - 1, updated_at = NOW() 
        WHERE publicidad_id = ${publicidadId}
      `);
      favorito = false;
    } else {
      await db.execute(sql`
        INSERT INTO interacciones_publicidad (publicidad_id, usuario_id, tipo) 
        VALUES (${publicidadId}, ${usuarioId}, 'favorito')
        ON CONFLICT (publicidad_id, usuario_id, tipo) DO NOTHING
      `);
      await db.execute(sql`
        INSERT INTO favoritos_usuario (publicidad_id, usuario_id) 
        VALUES (${publicidadId}, ${usuarioId})
        ON CONFLICT (usuario_id, publicidad_id) DO NOTHING
      `);
      await db.execute(sql`
        UPDATE contadores_publicidad SET favoritos = favoritos + 1, updated_at = NOW() 
        WHERE publicidad_id = ${publicidadId}
      `);
      favorito = true;
    }
    
    const countResult = await db.execute(sql`
      SELECT favoritos FROM contadores_publicidad WHERE publicidad_id = ${publicidadId}
    `);
    const totalFavoritos = (countResult.rows[0] as any)?.favoritos || 0;
    
    return { favorito, totalFavoritos };
  }

  async registrarCompartidoPublicidad(publicidadId: string, usuarioId: string, redSocial: string): Promise<{ compartidos: number }> {
    await this.ensureContadorExists(publicidadId);
    
    await db.execute(sql`
      INSERT INTO interacciones_publicidad (publicidad_id, usuario_id, tipo, red_social) 
      VALUES (${publicidadId}, ${usuarioId}, 'compartido', ${redSocial})
    `);
    await db.execute(sql`
      UPDATE contadores_publicidad SET compartidos = compartidos + 1, updated_at = NOW() 
      WHERE publicidad_id = ${publicidadId}
    `);
    
    const countResult = await db.execute(sql`
      SELECT compartidos FROM contadores_publicidad WHERE publicidad_id = ${publicidadId}
    `);
    return { compartidos: (countResult.rows[0] as any)?.compartidos || 0 };
  }

  async registrarImpresionPublicidad(publicidadId: string, usuarioId: string): Promise<{ impresiones: number }> {
    await this.ensureContadorExists(publicidadId);
    
    await db.execute(sql`
      INSERT INTO interacciones_publicidad (publicidad_id, usuario_id, tipo) 
      VALUES (${publicidadId}, ${usuarioId}, 'impresion')
    `);
    await db.execute(sql`
      UPDATE contadores_publicidad SET impresiones = impresiones + 1, updated_at = NOW() 
      WHERE publicidad_id = ${publicidadId}
    `);
    
    const countResult = await db.execute(sql`
      SELECT impresiones FROM contadores_publicidad WHERE publicidad_id = ${publicidadId}
    `);
    return { impresiones: (countResult.rows[0] as any)?.impresiones || 0 };
  }

  async registrarAgendaPublicidad(publicidadId: string, usuarioId: string): Promise<{ agendados: number }> {
    await this.ensureContadorExists(publicidadId);
    
    const existingResult = await db.execute(sql`
      SELECT id FROM interacciones_publicidad 
      WHERE publicidad_id = ${publicidadId} AND usuario_id = ${usuarioId} AND tipo = 'agenda'
    `);
    
    if (existingResult.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO interacciones_publicidad (publicidad_id, usuario_id, tipo) 
        VALUES (${publicidadId}, ${usuarioId}, 'agenda')
        ON CONFLICT (publicidad_id, usuario_id, tipo) DO NOTHING
      `);
      await db.execute(sql`
        UPDATE contadores_publicidad SET agendados = agendados + 1, updated_at = NOW() 
        WHERE publicidad_id = ${publicidadId}
      `);
    }
    
    const countResult = await db.execute(sql`
      SELECT agendados FROM contadores_publicidad WHERE publicidad_id = ${publicidadId}
    `);
    return { agendados: (countResult.rows[0] as any)?.agendados || 0 };
  }

  async getComentariosPublicidad(publicidadId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT c.*, u.first_name, u.last_name, u.profile_image_url 
      FROM comentarios_publicidad c
      LEFT JOIN users u ON c.usuario_id = u.id
      WHERE c.publicidad_id = ${publicidadId} AND c.estado = 'activo'
      ORDER BY c.created_at DESC
    `);
    return result.rows as any[];
  }

  async crearComentarioPublicidad(publicidadId: string, usuarioId: string, contenido: string): Promise<any> {
    await this.ensureContadorExists(publicidadId);
    
    const result = await db.execute(sql`
      INSERT INTO comentarios_publicidad (publicidad_id, usuario_id, contenido) 
      VALUES (${publicidadId}, ${usuarioId}, ${contenido})
      RETURNING *
    `);
    
    await db.execute(sql`
      UPDATE contadores_publicidad SET comentarios = comentarios + 1, updated_at = NOW() 
      WHERE publicidad_id = ${publicidadId}
    `);
    
    return result.rows[0];
  }

  async eliminarComentarioPublicidad(comentarioId: string, usuarioId: string): Promise<void> {
    const comentarioResult = await db.execute(sql`
      SELECT publicidad_id, usuario_id FROM comentarios_publicidad WHERE id = ${comentarioId}
    `);
    
    if (comentarioResult.rows.length === 0) {
      throw new Error("Comentario no encontrado");
    }
    
    const comentario = comentarioResult.rows[0] as any;
    if (comentario.usuario_id !== usuarioId) {
      throw new Error("No tienes permiso para eliminar este comentario");
    }
    
    await db.execute(sql`
      UPDATE comentarios_publicidad SET estado = 'eliminado', updated_at = NOW() 
      WHERE id = ${comentarioId}
    `);
    
    await db.execute(sql`
      UPDATE contadores_publicidad SET comentarios = comentarios - 1, updated_at = NOW() 
      WHERE publicidad_id = ${comentario.publicidad_id}
    `);
  }

  async getFavoritosUsuario(usuarioId: string): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT p.*, f.created_at as fecha_favorito 
      FROM favoritos_usuario f
      JOIN publicidad p ON f.publicidad_id = p.id
      WHERE f.usuario_id = ${usuarioId}
      ORDER BY f.created_at DESC
    `);
    return result.rows as any[];
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
    const grupo = await this.getGrupo(grupoId);
    
    if (!grupo) {
      return { puede: false, razon: 'Grupo no encontrado' };
    }
    
    if (grupo.estado !== 'activo') {
      return { puede: false, razon: 'Grupo suspendido' };
    }
    
    // Verificar membresía primero
    const miembro = await this.getMiembroGrupo(grupoId, usuarioId);
    if (!miembro) {
      return { puede: false, razon: 'No eres miembro de este grupo' };
    }
    
    if (miembro.estado !== 'activo') {
      return { puede: false, razon: 'Tu membresía está suspendida' };
    }
    
    // Para conversaciones privadas, no verificar nivel de estrellas
    if (grupo.tipo === 'privado') {
      return { puede: true };
    }
    
    // Para grupos públicos o comunidades, verificar nivel de estrellas
    const nivelUsuario = await this.verificarNivelUsuario(usuarioId);
    const estrellasRequeridas = grupo.estrellasMinimas || 1; // Por defecto nivel 1
    
    if (nivelUsuario < estrellasRequeridas) {
      return { puede: false, razon: `Requiere nivel ${estrellasRequeridas} estrellas. Tu nivel actual es ${nivelUsuario}` };
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
  // CONTACTOS FAMILIARES
  // ============================================================

  async getContactosFamiliares(usuarioId: string): Promise<ContactoFamiliar[]> {
    return await db.select()
      .from(contactosFamiliares)
      .where(eq(contactosFamiliares.usuarioId, usuarioId))
      .orderBy(contactosFamiliares.orden);
  }

  async createContactoFamiliar(contactoData: InsertContactoFamiliar): Promise<ContactoFamiliar> {
    const [contacto] = await db
      .insert(contactosFamiliares)
      .values(contactoData)
      .returning();
    return contacto;
  }

  async updateContactoFamiliar(id: string, data: Partial<InsertContactoFamiliar>): Promise<ContactoFamiliar | undefined> {
    const [actualizado] = await db
      .update(contactosFamiliares)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(contactosFamiliares.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteContactoFamiliar(id: string): Promise<void> {
    await db.delete(contactosFamiliares).where(eq(contactosFamiliares.id, id));
  }

  // ============================================================
  // LUGARES FRECUENTES DEL USUARIO
  // ============================================================

  async getLugaresUsuario(usuarioId: string): Promise<LugarUsuario[]> {
    return await db.select()
      .from(lugaresUsuario)
      .where(eq(lugaresUsuario.usuarioId, usuarioId))
      .orderBy(lugaresUsuario.orden);
  }

  async getLugarUsuario(id: string): Promise<LugarUsuario | undefined> {
    const [lugar] = await db.select()
      .from(lugaresUsuario)
      .where(eq(lugaresUsuario.id, id));
    return lugar || undefined;
  }

  async createLugarUsuario(lugarData: InsertLugarUsuario): Promise<LugarUsuario> {
    const [lugar] = await db
      .insert(lugaresUsuario)
      .values(lugarData)
      .returning();
    return lugar;
  }

  async updateLugarUsuario(id: string, data: Partial<InsertLugarUsuario>): Promise<LugarUsuario | undefined> {
    const [actualizado] = await db
      .update(lugaresUsuario)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lugaresUsuario.id, id))
      .returning();
    return actualizado || undefined;
  }

  async deleteLugarUsuario(id: string): Promise<void> {
    await db.delete(lugaresUsuario).where(eq(lugaresUsuario.id, id));
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

  async getViajesConductor(conductorId: string): Promise<ViajeTaxi[]> {
    return await db.select()
      .from(viajesTaxi)
      .where(eq(viajesTaxi.conductorId, conductorId))
      .orderBy(desc(viajesTaxi.createdAt));
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
  // RADIOS ONLINE
  // ============================================================
  
  async getRadiosOnline(): Promise<RadioOnline[]> {
    return await db.select()
      .from(radiosOnline)
      .orderBy(radiosOnline.orden);
  }

  async getRadioOnline(id: number): Promise<RadioOnline | undefined> {
    const [radio] = await db.select()
      .from(radiosOnline)
      .where(eq(radiosOnline.id, id));
    return radio || undefined;
  }

  async getRadioPredeterminada(): Promise<RadioOnline | undefined> {
    const [radio] = await db.select()
      .from(radiosOnline)
      .where(eq(radiosOnline.esPredeterminada, true));
    return radio || undefined;
  }

  async createRadioOnline(radioData: InsertRadioOnline): Promise<RadioOnline> {
    const [radio] = await db
      .insert(radiosOnline)
      .values(radioData)
      .returning();
    return radio;
  }

  async updateRadioOnline(id: number, data: Partial<InsertRadioOnline>): Promise<RadioOnline | undefined> {
    const [updated] = await db
      .update(radiosOnline)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(radiosOnline.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRadioOnline(id: number): Promise<void> {
    await db.delete(radiosOnline).where(eq(radiosOnline.id, id));
  }

  // ============================================================
  // LISTAS MP3
  // ============================================================
  
  async getListasMp3(): Promise<ListaMp3[]> {
    return await db.select()
      .from(listasMp3)
      .orderBy(listasMp3.orden);
  }

  async getListaMp3(id: number): Promise<ListaMp3 | undefined> {
    const [lista] = await db.select()
      .from(listasMp3)
      .where(eq(listasMp3.id, id));
    return lista || undefined;
  }

  async createListaMp3(listaData: InsertListaMp3): Promise<ListaMp3> {
    const [lista] = await db
      .insert(listasMp3)
      .values(listaData)
      .returning();
    return lista;
  }

  async updateListaMp3(id: number, data: Partial<InsertListaMp3>): Promise<ListaMp3 | undefined> {
    const [updated] = await db
      .update(listasMp3)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(listasMp3.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteListaMp3(id: number): Promise<void> {
    // Primero eliminar todos los archivos MP3 asociados a esta lista
    await db.delete(archivosMp3).where(eq(archivosMp3.listaId, id));
    // Luego eliminar la lista
    await db.delete(listasMp3).where(eq(listasMp3.id, id));
  }

  // ============================================================
  // ARCHIVOS MP3
  // ============================================================
  
  async getArchivosMp3(): Promise<ArchivoMp3[]> {
    return await db.select()
      .from(archivosMp3)
      .orderBy(archivosMp3.orden);
  }

  async getArchivosMp3PorLista(listaId: number): Promise<ArchivoMp3[]> {
    return await db.select()
      .from(archivosMp3)
      .where(eq(archivosMp3.listaId, listaId))
      .orderBy(archivosMp3.orden);
  }

  async getArchivoMp3(id: string): Promise<ArchivoMp3 | undefined> {
    const [archivo] = await db.select()
      .from(archivosMp3)
      .where(eq(archivosMp3.id, id));
    return archivo || undefined;
  }

  async createArchivoMp3(archivoData: InsertArchivoMp3): Promise<ArchivoMp3> {
    const [archivo] = await db
      .insert(archivosMp3)
      .values(archivoData)
      .returning();
    return archivo;
  }

  async updateArchivoMp3(id: string, data: Partial<InsertArchivoMp3>): Promise<ArchivoMp3 | undefined> {
    const [updated] = await db
      .update(archivosMp3)
      .set(data)
      .where(eq(archivosMp3.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteArchivoMp3(id: string): Promise<void> {
    await db.delete(archivosMp3).where(eq(archivosMp3.id, id));
  }

  async reordenarArchivosMp3(listaId: number, orden: { id: string; orden: number }[]): Promise<void> {
    for (const item of orden) {
      await db.update(archivosMp3)
        .set({ orden: item.orden })
        .where(eq(archivosMp3.id, item.id));
    }
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
    await db.delete(subcategoriasServicio).where(eq(subcategoriasServicio.categoriaId, id));
    await db.delete(categoriasServicio).where(eq(categoriasServicio.id, id));
  }

  // ============================================================
  // SUBCATEGORÍAS DE SERVICIOS LOCALES
  // ============================================================
  async getSubcategoriasServicio(categoriaId?: string): Promise<SubcategoriaServicio[]> {
    if (categoriaId) {
      return await db.select().from(subcategoriasServicio)
        .where(eq(subcategoriasServicio.categoriaId, categoriaId))
        .orderBy(subcategoriasServicio.orden);
    }
    return await db.select().from(subcategoriasServicio).orderBy(subcategoriasServicio.orden);
  }

  async getSubcategoriaServicio(id: string): Promise<SubcategoriaServicio | undefined> {
    const [subcategoria] = await db.select().from(subcategoriasServicio).where(eq(subcategoriasServicio.id, id));
    return subcategoria;
  }

  async createSubcategoriaServicio(data: InsertSubcategoriaServicio): Promise<SubcategoriaServicio> {
    const [subcategoria] = await db.insert(subcategoriasServicio).values(data).returning();
    return subcategoria;
  }

  async updateSubcategoriaServicio(id: string, data: Partial<InsertSubcategoriaServicio>): Promise<SubcategoriaServicio | undefined> {
    const [actualizada] = await db
      .update(subcategoriasServicio)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subcategoriasServicio.id, id))
      .returning();
    return actualizada;
  }

  async deleteSubcategoriaServicio(id: string): Promise<void> {
    await db.update(logosServicios)
      .set({ subcategoriaId: null })
      .where(eq(logosServicios.subcategoriaId, id));
    await db.delete(subcategoriasServicio).where(eq(subcategoriasServicio.id, id));
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

  async observarSolicitudSaldo(id: string, notas: string | null): Promise<SolicitudSaldo | undefined> {
    const [actualizado] = await db
      .update(solicitudesSaldo)
      .set({
        estado: 'observado',
        notas,
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

  // Estadísticas públicas
  async getEstadisticasPublicas(): Promise<{
    usuariosActivos: number;
    serviciosLocales: number;
    monitoreo24h: boolean;
    satisfaccion: number;
  }> {
    // Contar todos los usuarios
    const allUsuarios = await db.select().from(usuarios);
    const usuariosActivos = allUsuarios.filter(u => u.estado === 'activo').length;
    
    // Contar todos los servicios activos
    const allServicios = await db.select().from(servicios);
    const serviciosActivos = allServicios.filter(s => s.activo === true).length;
    
    return {
      usuariosActivos,
      serviciosLocales: serviciosActivos,
      monitoreo24h: true,
      satisfaccion: 98,
    };
  }

  // ============================================================
  // SECTORES (autocompletado)
  // ============================================================
  
  async getSectores(departamento?: string, distrito?: string): Promise<Sector[]> {
    let query = db.select().from(sectores);
    
    if (departamento && distrito) {
      return await db.select().from(sectores)
        .where(and(
          eq(sectores.departamento, departamento),
          eq(sectores.distrito, distrito)
        ))
        .orderBy(sectores.nombre);
    } else if (departamento) {
      return await db.select().from(sectores)
        .where(eq(sectores.departamento, departamento))
        .orderBy(sectores.nombre);
    }
    
    return await db.select().from(sectores).orderBy(sectores.nombre);
  }

  async buscarSectores(texto: string, departamento?: string, distrito?: string): Promise<Sector[]> {
    const textoLower = texto.toLowerCase();
    const todosSectores = await this.getSectores(departamento, distrito);
    return todosSectores.filter(s => 
      s.nombre.toLowerCase().includes(textoLower)
    );
  }

  async createSector(data: InsertSector): Promise<Sector> {
    try {
      const [sector] = await db.insert(sectores).values(data).returning();
      return sector;
    } catch (error: any) {
      if (error.code === '23505') {
        const [existente] = await db.select().from(sectores)
          .where(and(
            eq(sectores.nombre, data.nombre),
            eq(sectores.departamento, data.departamento || ''),
            eq(sectores.distrito, data.distrito || '')
          ));
        return existente;
      }
      throw error;
    }
  }

  // ============================================================
  // SISTEMA DE CAMBIO DE MONEDA
  // ============================================================

  async getConfiguracionMonedas(): Promise<ConfiguracionMoneda[]> {
    return await db.select().from(configuracionMonedas)
      .where(eq(configuracionMonedas.activo, true))
      .orderBy(configuracionMonedas.orden);
  }

  async getConfiguracionMoneda(codigo: string): Promise<ConfiguracionMoneda | undefined> {
    const [moneda] = await db.select().from(configuracionMonedas)
      .where(eq(configuracionMonedas.codigo, codigo));
    return moneda;
  }

  async updateConfiguracionMoneda(codigo: string, data: Partial<InsertConfiguracionMoneda>): Promise<ConfiguracionMoneda | undefined> {
    const [actualizada] = await db.update(configuracionMonedas)
      .set({ ...data, updatedAt: new Date(), ultimaActualizacion: new Date() })
      .where(eq(configuracionMonedas.codigo, codigo))
      .returning();
    return actualizada;
  }

  async createConfiguracionMoneda(data: InsertConfiguracionMoneda): Promise<ConfiguracionMoneda> {
    const [moneda] = await db.insert(configuracionMonedas).values(data).returning();
    return moneda;
  }

  // Tasas de cambio locales (Cambistas)
  async getTasasCambioLocales(activo?: boolean): Promise<TasaCambioLocal[]> {
    if (activo !== undefined) {
      return await db.select().from(tasasCambioLocales)
        .where(eq(tasasCambioLocales.activo, activo))
        .orderBy(desc(tasasCambioLocales.updatedAt));
    }
    return await db.select().from(tasasCambioLocales)
      .orderBy(desc(tasasCambioLocales.updatedAt));
  }

  async getTasasCambioLocalPorCambista(cambistaId: string): Promise<TasaCambioLocal[]> {
    return await db.select().from(tasasCambioLocales)
      .where(eq(tasasCambioLocales.cambistaId, cambistaId))
      .orderBy(tasasCambioLocales.monedaOrigenCodigo);
  }

  async getTasaCambioLocal(id: string): Promise<TasaCambioLocal | undefined> {
    const [tasa] = await db.select().from(tasasCambioLocales)
      .where(eq(tasasCambioLocales.id, id));
    return tasa;
  }

  async createTasaCambioLocal(data: InsertTasaCambioLocal): Promise<TasaCambioLocal> {
    const [tasa] = await db.insert(tasasCambioLocales).values(data).returning();
    return tasa;
  }

  async updateTasaCambioLocal(id: string, data: Partial<InsertTasaCambioLocal>): Promise<TasaCambioLocal | undefined> {
    const [actualizada] = await db.update(tasasCambioLocales)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasasCambioLocales.id, id))
      .returning();
    return actualizada;
  }

  async deleteTasaCambioLocal(id: string): Promise<boolean> {
    const result = await db.delete(tasasCambioLocales)
      .where(eq(tasasCambioLocales.id, id));
    return true;
  }

  async getPromedioTasasLocales(monedaOrigenCodigo: string, monedaDestinoCodigo: string): Promise<{ promedioCompra: number; promedioVenta: number } | null> {
    const tasas = await db.select().from(tasasCambioLocales)
      .where(and(
        eq(tasasCambioLocales.monedaOrigenCodigo, monedaOrigenCodigo),
        eq(tasasCambioLocales.monedaDestinoCodigo, monedaDestinoCodigo),
        eq(tasasCambioLocales.activo, true)
      ));
    
    if (tasas.length === 0) return null;
    
    const promedioCompra = tasas.reduce((sum, t) => sum + parseFloat(t.tasaCompra), 0) / tasas.length;
    const promedioVenta = tasas.reduce((sum, t) => sum + parseFloat(t.tasaVenta), 0) / tasas.length;
    
    return { promedioCompra, promedioVenta };
  }

  // Obtener usuarios con rol cambista
  async getCambistas(): Promise<Usuario[]> {
    return await db.select().from(usuarios)
      .where(eq(usuarios.rol, 'cambista'));
  }

  async asignarRolCambista(usuarioId: string): Promise<Usuario | undefined> {
    const [actualizado] = await db.update(usuarios)
      .set({ rol: 'cambista', updatedAt: new Date() })
      .where(eq(usuarios.id, usuarioId))
      .returning();
    return actualizado;
  }

  async removerRolCambista(usuarioId: string): Promise<Usuario | undefined> {
    const [actualizado] = await db.update(usuarios)
      .set({ rol: 'usuario', updatedAt: new Date() })
      .where(eq(usuarios.id, usuarioId))
      .returning();
    return actualizado;
  }

  // ============================================================
  // PLANES DE MEMBRESÍA
  // ============================================================
  async getPlanesMembresia(soloActivos = true): Promise<PlanMembresia[]> {
    if (soloActivos) {
      return await db.select().from(planesMembresia)
        .where(eq(planesMembresia.activo, true))
        .orderBy(planesMembresia.orden);
    }
    return await db.select().from(planesMembresia).orderBy(planesMembresia.orden);
  }

  async getPlanMembresia(id: string): Promise<PlanMembresia | undefined> {
    const [plan] = await db.select().from(planesMembresia)
      .where(eq(planesMembresia.id, id));
    return plan;
  }

  async createPlanMembresia(data: InsertPlanMembresia): Promise<PlanMembresia> {
    const [plan] = await db.insert(planesMembresia).values(data).returning();
    return plan;
  }

  async updatePlanMembresia(id: string, data: Partial<InsertPlanMembresia>): Promise<PlanMembresia | undefined> {
    const [actualizado] = await db.update(planesMembresia)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(planesMembresia.id, id))
      .returning();
    return actualizado;
  }

  async deletePlanMembresia(id: string): Promise<void> {
    await db.delete(planesMembresia).where(eq(planesMembresia.id, id));
  }

  // ============================================================
  // MEMBRESÍAS DE USUARIOS
  // ============================================================
  async getMembresiasUsuarios(): Promise<MembresiaUsuario[]> {
    return await db.select().from(membresiasUsuarios)
      .orderBy(desc(membresiasUsuarios.createdAt));
  }

  async getMembresiaUsuario(usuarioId: string): Promise<MembresiaUsuario | undefined> {
    const [membresia] = await db.select().from(membresiasUsuarios)
      .where(eq(membresiasUsuarios.usuarioId, usuarioId))
      .orderBy(desc(membresiasUsuarios.createdAt))
      .limit(1);
    return membresia;
  }

  async getMembresiaActiva(usuarioId: string): Promise<MembresiaUsuario | undefined> {
    const ahora = new Date();
    const [membresia] = await db.select().from(membresiasUsuarios)
      .where(and(
        eq(membresiasUsuarios.usuarioId, usuarioId),
        eq(membresiasUsuarios.estado, 'activa'),
        gte(membresiasUsuarios.fechaFin, ahora)
      ))
      .limit(1);
    return membresia;
  }

  async createMembresiaUsuario(data: InsertMembresiaUsuario): Promise<MembresiaUsuario> {
    const [membresia] = await db.insert(membresiasUsuarios).values(data).returning();
    return membresia;
  }

  async updateMembresiaUsuario(id: string, data: Partial<InsertMembresiaUsuario>): Promise<MembresiaUsuario | undefined> {
    const [actualizada] = await db.update(membresiasUsuarios)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(membresiasUsuarios.id, id))
      .returning();
    return actualizada;
  }

  // ============================================================
  // CATEGORÍAS DE PRODUCTOS DE USUARIO
  // ============================================================
  async getCategoriasProductosUsuario(incluyeInactivas = false): Promise<CategoriaProductoUsuario[]> {
    if (!incluyeInactivas) {
      return await db.select().from(categoriasProductosUsuario)
        .where(eq(categoriasProductosUsuario.activo, true))
        .orderBy(categoriasProductosUsuario.orden);
    }
    return await db.select().from(categoriasProductosUsuario)
      .orderBy(categoriasProductosUsuario.orden);
  }

  async getSubcategorias(categoriaPadreId: string): Promise<CategoriaProductoUsuario[]> {
    return await db.select().from(categoriasProductosUsuario)
      .where(and(
        eq(categoriasProductosUsuario.categoriaPadreId, categoriaPadreId),
        eq(categoriasProductosUsuario.activo, true)
      ))
      .orderBy(categoriasProductosUsuario.orden);
  }

  async getCategoriaProductoUsuario(id: string): Promise<CategoriaProductoUsuario | undefined> {
    const [categoria] = await db.select().from(categoriasProductosUsuario)
      .where(eq(categoriasProductosUsuario.id, id));
    return categoria;
  }

  async createCategoriaProductoUsuario(data: InsertCategoriaProductoUsuario): Promise<CategoriaProductoUsuario> {
    const [categoria] = await db.insert(categoriasProductosUsuario).values(data).returning();
    return categoria;
  }

  async updateCategoriaProductoUsuario(id: string, data: Partial<InsertCategoriaProductoUsuario>): Promise<CategoriaProductoUsuario | undefined> {
    const [actualizada] = await db.update(categoriasProductosUsuario)
      .set(data)
      .where(eq(categoriasProductosUsuario.id, id))
      .returning();
    return actualizada;
  }

  async deleteCategoriaProductoUsuario(id: string): Promise<void> {
    await db.update(categoriasProductosUsuario)
      .set({ activo: false })
      .where(eq(categoriasProductosUsuario.id, id));
  }

  // ============================================================
  // PRODUCTOS DE USUARIO
  // ============================================================
  async getProductosUsuario(filtros?: { usuarioId?: string; categoriaId?: string; estado?: string }): Promise<ProductoUsuario[]> {
    let query = db.select().from(productosUsuario);
    
    if (filtros?.usuarioId) {
      query = query.where(eq(productosUsuario.usuarioId, filtros.usuarioId)) as typeof query;
    }
    if (filtros?.categoriaId) {
      query = query.where(eq(productosUsuario.categoriaId, filtros.categoriaId)) as typeof query;
    }
    if (filtros?.estado) {
      query = query.where(eq(productosUsuario.estado, filtros.estado)) as typeof query;
    }
    
    return await query.orderBy(desc(productosUsuario.createdAt));
  }

  async getProductoUsuario(id: string): Promise<ProductoUsuario | undefined> {
    const [producto] = await db.select().from(productosUsuario)
      .where(eq(productosUsuario.id, id));
    return producto;
  }

  async createProductoUsuario(data: InsertProductoUsuario): Promise<ProductoUsuario> {
    const [producto] = await db.insert(productosUsuario).values(data).returning();
    return producto;
  }

  async updateProductoUsuario(id: string, data: Partial<InsertProductoUsuario>): Promise<ProductoUsuario | undefined> {
    const [actualizado] = await db.update(productosUsuario)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productosUsuario.id, id))
      .returning();
    return actualizado;
  }

  async deleteProductoUsuario(id: string): Promise<void> {
    await db.update(productosUsuario)
      .set({ estado: 'eliminado', updatedAt: new Date() })
      .where(eq(productosUsuario.id, id));
  }

  // ============================================================
  // CONFIGURACIÓN DE COSTOS
  // ============================================================
  async getConfiguracionesCostos(): Promise<ConfiguracionCosto[]> {
    return await db.select().from(configuracionCostos);
  }

  async getConfiguracionCosto(tipoServicio: string): Promise<ConfiguracionCosto | undefined> {
    const [config] = await db.select().from(configuracionCostos)
      .where(eq(configuracionCostos.tipoServicio, tipoServicio));
    return config;
  }

  async upsertConfiguracionCosto(data: InsertConfiguracionCosto): Promise<ConfiguracionCosto> {
    const existente = await this.getConfiguracionCosto(data.tipoServicio);
    
    if (existente) {
      const [actualizado] = await db.update(configuracionCostos)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(configuracionCostos.tipoServicio, data.tipoServicio))
        .returning();
      return actualizado;
    }
    
    const [nuevo] = await db.insert(configuracionCostos).values(data).returning();
    return nuevo;
  }

  // ============================================================
  // CATEGORÍAS DE ROLES
  // ============================================================
  async getCategoriasRol(rolBase?: string): Promise<CategoriaRol[]> {
    if (rolBase) {
      return await db.select().from(categoriasRol)
        .where(eq(categoriasRol.rolBase, rolBase))
        .orderBy(categoriasRol.orden);
    }
    return await db.select().from(categoriasRol).orderBy(categoriasRol.orden);
  }

  async getCategoriaRol(id: string): Promise<CategoriaRol | undefined> {
    const [categoria] = await db.select().from(categoriasRol)
      .where(eq(categoriasRol.id, id));
    return categoria;
  }

  async createCategoriaRol(data: InsertCategoriaRol): Promise<CategoriaRol> {
    const [categoria] = await db.insert(categoriasRol).values(data).returning();
    return categoria;
  }

  async updateCategoriaRol(id: string, data: Partial<InsertCategoriaRol>): Promise<CategoriaRol | undefined> {
    const [actualizado] = await db.update(categoriasRol)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categoriasRol.id, id))
      .returning();
    return actualizado;
  }

  async deleteCategoriaRol(id: string): Promise<void> {
    await db.delete(categoriasRol).where(eq(categoriasRol.id, id));
  }

  // ============================================================
  // SUBCATEGORÍAS DE ROLES
  // ============================================================
  async getSubcategoriasRol(categoriaId?: string): Promise<SubcategoriaRol[]> {
    if (categoriaId) {
      return await db.select().from(subcategoriasRol)
        .where(eq(subcategoriasRol.categoriaId, categoriaId))
        .orderBy(subcategoriasRol.orden);
    }
    return await db.select().from(subcategoriasRol).orderBy(subcategoriasRol.orden);
  }

  async getSubcategoriaRol(id: string): Promise<SubcategoriaRol | undefined> {
    const [subcategoria] = await db.select().from(subcategoriasRol)
      .where(eq(subcategoriasRol.id, id));
    return subcategoria;
  }

  async createSubcategoriaRol(data: InsertSubcategoriaRol): Promise<SubcategoriaRol> {
    const [subcategoria] = await db.insert(subcategoriasRol).values(data).returning();
    return subcategoria;
  }

  async updateSubcategoriaRol(id: string, data: Partial<InsertSubcategoriaRol>): Promise<SubcategoriaRol | undefined> {
    const [actualizado] = await db.update(subcategoriasRol)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subcategoriasRol.id, id))
      .returning();
    return actualizado;
  }

  async deleteSubcategoriaRol(id: string): Promise<void> {
    await db.delete(subcategoriasRol).where(eq(subcategoriasRol.id, id));
  }
}

export const storage = new DatabaseStorage();
