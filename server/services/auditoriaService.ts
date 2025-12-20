import { db } from '../db';
import { registroAuditoria } from '../../shared/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

export interface DatosAuditoria {
  usuarioId?: string;
  usuarioNombre?: string;
  usuarioRol?: string;
  tipoAccion: 'crear' | 'modificar' | 'eliminar' | 'suspender' | 'activar' | 'aprobar' | 'rechazar' | 'login' | 'logout';
  entidad: string;
  entidadId?: string;
  descripcion?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  ip?: string;
  userAgent?: string;
  modulo?: string;
}

export async function registrarActividad(datos: DatosAuditoria): Promise<void> {
  try {
    await db.insert(registroAuditoria).values({
      usuarioId: datos.usuarioId || null,
      usuarioNombre: datos.usuarioNombre || 'Sistema',
      usuarioRol: datos.usuarioRol || 'sistema',
      tipoAccion: datos.tipoAccion,
      entidad: datos.entidad,
      entidadId: datos.entidadId || null,
      descripcion: datos.descripcion || null,
      datosAnteriores: datos.datosAnteriores ? JSON.stringify(datos.datosAnteriores) : null,
      datosNuevos: datos.datosNuevos ? JSON.stringify(datos.datosNuevos) : null,
      ip: datos.ip || null,
      userAgent: datos.userAgent || null,
      modulo: datos.modulo || null,
    });
    console.log(`[Auditoria] ${datos.tipoAccion} en ${datos.entidad} por ${datos.usuarioNombre || 'Sistema'}`);
  } catch (error) {
    console.error('[Auditoria] Error al registrar actividad:', error);
  }
}

export interface FiltroAuditoria {
  desde?: Date;
  hasta?: Date;
  usuarioId?: string;
  tipoAccion?: string;
  entidad?: string;
  modulo?: string;
  limite?: number;
}

export async function obtenerRegistrosAuditoria(filtro: FiltroAuditoria = {}) {
  const conditions = [];
  
  if (filtro.desde) {
    conditions.push(gte(registroAuditoria.createdAt, filtro.desde));
  }
  if (filtro.hasta) {
    conditions.push(lte(registroAuditoria.createdAt, filtro.hasta));
  }
  if (filtro.usuarioId) {
    conditions.push(eq(registroAuditoria.usuarioId, filtro.usuarioId));
  }
  if (filtro.tipoAccion) {
    conditions.push(eq(registroAuditoria.tipoAccion, filtro.tipoAccion));
  }
  if (filtro.entidad) {
    conditions.push(eq(registroAuditoria.entidad, filtro.entidad));
  }
  if (filtro.modulo) {
    conditions.push(eq(registroAuditoria.modulo, filtro.modulo));
  }

  const query = db.select()
    .from(registroAuditoria)
    .orderBy(desc(registroAuditoria.createdAt))
    .limit(filtro.limite || 500);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  
  return query;
}

export async function obtenerEstadisticasAuditoria(desde?: Date, hasta?: Date) {
  const ahora = new Date();
  const fechaDesde = desde || new Date(ahora.setDate(ahora.getDate() - 7));
  const fechaHasta = hasta || new Date();

  const registros = await obtenerRegistrosAuditoria({ desde: fechaDesde, hasta: fechaHasta, limite: 10000 });
  
  const porTipo: Record<string, number> = {};
  const porModulo: Record<string, number> = {};
  const porUsuario: Record<string, { nombre: string; cantidad: number }> = {};
  const porDia: Record<string, number> = {};

  for (const r of registros) {
    porTipo[r.tipoAccion] = (porTipo[r.tipoAccion] || 0) + 1;
    
    if (r.modulo) {
      porModulo[r.modulo] = (porModulo[r.modulo] || 0) + 1;
    }
    
    if (r.usuarioId) {
      if (!porUsuario[r.usuarioId]) {
        porUsuario[r.usuarioId] = { nombre: r.usuarioNombre || 'Desconocido', cantidad: 0 };
      }
      porUsuario[r.usuarioId].cantidad++;
    }
    
    const fecha = r.createdAt.toISOString().split('T')[0];
    porDia[fecha] = (porDia[fecha] || 0) + 1;
  }

  return {
    totalActividades: registros.length,
    porTipo,
    porModulo,
    porUsuario: Object.entries(porUsuario)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10),
    porDia: Object.entries(porDia)
      .map(([fecha, cantidad]) => ({ fecha, cantidad }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}

export function extraerInfoUsuario(req: any): { usuarioId?: string; usuarioNombre?: string; usuarioRol?: string; ip?: string; userAgent?: string } {
  const usuario = req.user;
  return {
    usuarioId: usuario?.id,
    usuarioNombre: usuario ? `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || usuario.email : undefined,
    usuarioRol: usuario?.rol || 'usuario',
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers?.['user-agent'],
  };
}
