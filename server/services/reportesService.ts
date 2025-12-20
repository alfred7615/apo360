import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db';
import { transaccionesSaldo, saldosUsuarios, usuarios } from '../../shared/schema';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'cartera');

function asegurarDirectorio(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export interface FiltroReporte {
  periodo?: 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'anual';
  desde?: Date;
  hasta?: Date;
  usuarioId?: string;
}

export interface ResumenReporte {
  totalIngresos: number;
  totalEgresos: number;
  cantidadTransacciones: number;
  saldoPromedio: number;
  transaccionesPorTipo: Record<string, { cantidad: number; monto: number }>;
  transaccionesPorDia: { fecha: string; ingresos: number; egresos: number }[];
}

function calcularRangoFechas(periodo: string): { desde: Date; hasta: Date } {
  const ahora = new Date();
  const hasta = new Date(ahora);
  hasta.setHours(23, 59, 59, 999);
  
  let desde = new Date(ahora);
  desde.setHours(0, 0, 0, 0);
  
  switch (periodo) {
    case 'diario':
      break;
    case 'semanal':
      desde.setDate(desde.getDate() - 7);
      break;
    case 'mensual':
      desde.setMonth(desde.getMonth() - 1);
      break;
    case 'trimestral':
      desde.setMonth(desde.getMonth() - 3);
      break;
    case 'anual':
      desde.setFullYear(desde.getFullYear() - 1);
      break;
    default:
      break;
  }
  
  return { desde, hasta };
}

export async function obtenerReporteCartera(filtro: FiltroReporte): Promise<ResumenReporte> {
  let desde: Date;
  let hasta: Date;
  
  if (filtro.desde && filtro.hasta) {
    desde = new Date(filtro.desde);
    hasta = new Date(filtro.hasta);
    hasta.setHours(23, 59, 59, 999);
  } else if (filtro.periodo) {
    const periodosValidos = ['diario', 'semanal', 'mensual', 'trimestral', 'anual'];
    const periodoValidado = periodosValidos.includes(filtro.periodo) ? filtro.periodo : 'diario';
    const rango = calcularRangoFechas(periodoValidado);
    desde = rango.desde;
    hasta = rango.hasta;
  } else {
    const rango = calcularRangoFechas('diario');
    desde = rango.desde;
    hasta = rango.hasta;
  }
  
  const conditions = [
    gte(transaccionesSaldo.createdAt, desde),
    lte(transaccionesSaldo.createdAt, hasta),
  ];
  
  if (filtro.usuarioId) {
    conditions.push(eq(transaccionesSaldo.usuarioId, filtro.usuarioId));
  }
  
  let transacciones = await db.select()
    .from(transaccionesSaldo)
    .where(and(...conditions))
    .orderBy(desc(transaccionesSaldo.createdAt));
  
  let totalIngresos = 0;
  let totalEgresos = 0;
  const transaccionesPorTipo: Record<string, { cantidad: number; monto: number }> = {};
  const transaccionesPorDiaMap: Record<string, { ingresos: number; egresos: number }> = {};
  
  for (const t of transacciones) {
    const monto = parseFloat(t.monto || '0');
    const tipo = t.tipo || 'otro';
    const fecha = t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : 'sin-fecha';
    
    if (tipo === 'ingreso' || tipo === 'recarga') {
      totalIngresos += monto;
      if (!transaccionesPorDiaMap[fecha]) {
        transaccionesPorDiaMap[fecha] = { ingresos: 0, egresos: 0 };
      }
      transaccionesPorDiaMap[fecha].ingresos += monto;
    } else {
      totalEgresos += monto;
      if (!transaccionesPorDiaMap[fecha]) {
        transaccionesPorDiaMap[fecha] = { ingresos: 0, egresos: 0 };
      }
      transaccionesPorDiaMap[fecha].egresos += monto;
    }
    
    if (!transaccionesPorTipo[tipo]) {
      transaccionesPorTipo[tipo] = { cantidad: 0, monto: 0 };
    }
    transaccionesPorTipo[tipo].cantidad++;
    transaccionesPorTipo[tipo].monto += monto;
  }
  
  const saldos = await db.select().from(saldosUsuarios);
  const saldoPromedio = saldos.length > 0 
    ? saldos.reduce((sum: number, s: { saldo: string | null }) => sum + parseFloat(s.saldo || '0'), 0) / saldos.length 
    : 0;
  
  const transaccionesPorDia = Object.entries(transaccionesPorDiaMap)
    .map(([fecha, data]) => ({ fecha, ...data }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  
  return {
    totalIngresos,
    totalEgresos,
    cantidadTransacciones: transacciones.length,
    saldoPromedio,
    transaccionesPorTipo,
    transaccionesPorDia,
  };
}

export async function generarPDFReporte(filtro: FiltroReporte): Promise<Buffer> {
  const reporte = await obtenerReporteCartera(filtro);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    doc.fontSize(20).text('APO-360 - Reporte de Cartera', { align: 'center' });
    doc.moveDown();
    
    const fechaGeneracion = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });
    doc.fontSize(10).text(`Generado: ${fechaGeneracion}`, { align: 'center' });
    doc.moveDown(2);
    
    let periodoTexto = '';
    if (filtro.desde && filtro.hasta) {
      periodoTexto = `Desde ${new Date(filtro.desde).toLocaleDateString('es-PE')} hasta ${new Date(filtro.hasta).toLocaleDateString('es-PE')}`;
    } else if (filtro.periodo) {
      periodoTexto = `Período: ${filtro.periodo.charAt(0).toUpperCase() + filtro.periodo.slice(1)}`;
    }
    doc.fontSize(12).text(periodoTexto, { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(14).text('Resumen General', { underline: true });
    doc.moveDown();
    
    doc.fontSize(11);
    doc.text(`Total Ingresos: S/ ${reporte.totalIngresos.toFixed(2)}`);
    doc.text(`Total Egresos: S/ ${reporte.totalEgresos.toFixed(2)}`);
    doc.text(`Balance: S/ ${(reporte.totalIngresos - reporte.totalEgresos).toFixed(2)}`);
    doc.text(`Cantidad de Transacciones: ${reporte.cantidadTransacciones}`);
    doc.text(`Saldo Promedio por Usuario: S/ ${reporte.saldoPromedio.toFixed(2)}`);
    doc.moveDown(2);
    
    doc.fontSize(14).text('Transacciones por Tipo', { underline: true });
    doc.moveDown();
    
    doc.fontSize(10);
    for (const [tipo, data] of Object.entries(reporte.transaccionesPorTipo)) {
      doc.text(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: ${data.cantidad} transacciones - S/ ${data.monto.toFixed(2)}`);
    }
    doc.moveDown(2);
    
    if (reporte.transaccionesPorDia.length > 0 && reporte.transaccionesPorDia.length <= 31) {
      doc.fontSize(14).text('Detalle Diario', { underline: true });
      doc.moveDown();
      
      doc.fontSize(9);
      doc.text('Fecha                  Ingresos           Egresos', { continued: false });
      doc.moveDown(0.5);
      
      for (const dia of reporte.transaccionesPorDia) {
        doc.text(`${dia.fecha}          S/ ${dia.ingresos.toFixed(2).padStart(10)}     S/ ${dia.egresos.toFixed(2).padStart(10)}`);
      }
    }
    
    doc.moveDown(2);
    doc.fontSize(8).text('Este documento fue generado automáticamente por APO-360', { align: 'center' });
    
    doc.end();
  });
}

export async function generarBackupDiario(): Promise<string> {
  const ahora = new Date();
  const año = ahora.getFullYear().toString();
  const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
  const dia = ahora.getDate().toString().padStart(2, '0');
  
  const dirBackup = path.join(BACKUP_DIR, año, mes);
  
  try {
    asegurarDirectorio(dirBackup);
  } catch (error) {
    console.error('[Backup] Error al crear directorio:', error);
    throw new Error('No se pudo crear el directorio de backup');
  }
  
  const nombreArchivo = `backup_cartera_${año}${mes}${dia}_${ahora.getHours().toString().padStart(2, '0')}${ahora.getMinutes().toString().padStart(2, '0')}.pdf`;
  const rutaArchivo = path.join(dirBackup, nombreArchivo);
  
  const ayer = new Date(ahora);
  ayer.setDate(ayer.getDate() - 1);
  ayer.setHours(0, 0, 0, 0);
  
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);
  
  const pdfBuffer = await generarPDFReporte({
    desde: ayer,
    hasta: hoy,
  });
  
  try {
    await fs.promises.writeFile(rutaArchivo, pdfBuffer);
    console.log(`[Backup] Archivo generado: ${rutaArchivo}`);
    return rutaArchivo;
  } catch (error) {
    console.error('[Backup] Error al escribir archivo:', error);
    throw new Error('No se pudo escribir el archivo de backup');
  }
}

export function listarBackups(): { archivo: string; fecha: Date; tamaño: number }[] {
  const backups: { archivo: string; fecha: Date; tamaño: number }[] = [];
  
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return backups;
    }
    
    function buscarPDFs(dir: string) {
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const ruta = path.join(dir, item);
          try {
            const stat = fs.statSync(ruta);
            if (stat.isDirectory()) {
              buscarPDFs(ruta);
            } else if (item.endsWith('.pdf')) {
              backups.push({
                archivo: ruta.replace(process.cwd() + '/', ''),
                fecha: stat.mtime,
                tamaño: stat.size,
              });
            }
          } catch (statError) {
            console.warn(`[Backup] Error al leer stats de ${ruta}:`, statError);
          }
        }
      } catch (readError) {
        console.warn(`[Backup] Error al leer directorio ${dir}:`, readError);
      }
    }
    
    buscarPDFs(BACKUP_DIR);
  } catch (error) {
    console.error('[Backup] Error general al listar backups:', error);
  }
  
  return backups.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

export function obtenerRutaBackup(nombreArchivo: string): string | null {
  const backups = listarBackups();
  const backup = backups.find(b => b.archivo.includes(nombreArchivo));
  return backup ? path.join(process.cwd(), backup.archivo) : null;
}
