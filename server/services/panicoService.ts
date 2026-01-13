import { db } from "../db";
import { storage } from "../storage";
import { eq, and, lt, lte, or, sql } from "drizzle-orm";
import { 
  saldosUsuarios, 
  transaccionesSaldo,
  usuarios
} from "@shared/schema";
import { notificarUsuario } from "../websocket";

// ============================================================
// SERVICIO DE CARTERA PARA SISTEMA DE PÁNICO
// Manejo de saldos, débitos y verificación de membresías
// ============================================================

interface ResultadoDebito {
  exito: boolean;
  saldoAnterior: number;
  saldoNuevo: number;
  transaccionId?: string;
  mensaje: string;
}

interface EstadoSuscripcion {
  tieneAcceso: boolean;
  razon: string;
  diasRestantes?: number;
  esGratuito?: boolean;
  requiereRecarga?: boolean;
  montoRequerido?: number;
}

// Debitar saldo de la cartera del usuario con locking transaccional
export async function debitarSaldo(
  usuarioId: string, 
  monto: number, 
  concepto: string,
  referencia?: string
): Promise<ResultadoDebito> {
  try {
    // Validar parámetros de entrada
    if (!usuarioId || typeof usuarioId !== 'string') {
      return {
        exito: false,
        saldoAnterior: 0,
        saldoNuevo: 0,
        mensaje: "ID de usuario inválido"
      };
    }
    
    if (typeof monto !== 'number' || isNaN(monto) || monto <= 0) {
      return {
        exito: false,
        saldoAnterior: 0,
        saldoNuevo: 0,
        mensaje: "Monto inválido"
      };
    }
    
    // Usar transacción con SELECT FOR UPDATE para locking
    const resultado = await db.transaction(async (trx: any) => {
      // Primero asegurar que el registro existe (UPSERT)
      await trx.execute(sql`
        INSERT INTO saldos_usuarios (usuario_id, saldo, moneda_preferida, total_ingresos, total_egresos, ultima_actualizacion)
        VALUES (${usuarioId}, '0.00', 'PEN', '0.00', '0.00', NOW())
        ON CONFLICT (usuario_id) DO NOTHING
      `);
      
      // Obtener saldo actual con lock FOR UPDATE
      const saldoQuery = await trx.execute(sql`
        SELECT * FROM saldos_usuarios 
        WHERE usuario_id = ${usuarioId} 
        FOR UPDATE
      `);
      
      const saldoActual = saldoQuery.rows[0] as any;
      
      if (!saldoActual) {
        return {
          exito: false,
          saldoAnterior: 0,
          saldoNuevo: 0,
          mensaje: "Error al obtener saldo del usuario"
        };
      }
      
      const saldoAnterior = parseFloat(saldoActual.saldo || "0") || 0;
      
      // Verificar si hay saldo suficiente
      if (saldoAnterior < monto) {
        return {
          exito: false,
          saldoAnterior,
          saldoNuevo: saldoAnterior,
          mensaje: `Saldo insuficiente. Tienes S/ ${saldoAnterior.toFixed(2)} y necesitas S/ ${monto.toFixed(2)}`
        };
      }
      
      const saldoNuevo = saldoAnterior - monto;
      
      // Actualizar saldo dentro de la transacción
      await trx.execute(sql`
        UPDATE saldos_usuarios 
        SET saldo = ${saldoNuevo.toFixed(2)},
            total_egresos = COALESCE(total_egresos::numeric, 0) + ${monto},
            ultima_actualizacion = NOW()
        WHERE usuario_id = ${usuarioId}
      `);
      
      // Registrar transacción dentro de la misma transacción
      const transResult = await trx.execute(sql`
        INSERT INTO transacciones_saldo (
          usuario_id, tipo, concepto, monto, saldo_anterior, saldo_nuevo,
          estado, referencia, metodo_pago, created_at
        ) VALUES (
          ${usuarioId}, 'egreso', ${concepto}, ${monto.toFixed(2)}, 
          ${saldoAnterior.toFixed(2)}, ${saldoNuevo.toFixed(2)},
          'completado', ${referencia || null}, 'billetera', NOW()
        ) RETURNING id
      `);
      
      const transaccionId = (transResult.rows[0] as any)?.id;
      
      return {
        exito: true,
        saldoAnterior,
        saldoNuevo,
        transaccionId,
        mensaje: `Débito exitoso de S/ ${monto.toFixed(2)}. Nuevo saldo: S/ ${saldoNuevo.toFixed(2)}`
      };
    });
    
    return resultado;
  } catch (error) {
    console.error("Error al debitar saldo:", error);
    return {
      exito: false,
      saldoAnterior: 0,
      saldoNuevo: 0,
      mensaje: "Error al procesar el débito"
    };
  }
}

// Verificar si el usuario puede usar el botón de pánico
export async function verificarAccesoPanico(usuarioId: string): Promise<EstadoSuscripcion> {
  try {
    // Obtener saldo del usuario
    const saldo = await storage.getSaldoUsuario(usuarioId);
    const saldoActual = saldo ? parseFloat(saldo.saldo || "0") : 0;
    
    // Buscar suscripciones activas del usuario
    const suscripciones = await db.execute(sql`
      SELECT sp.*, pp.nombre as plan_nombre
      FROM suscripciones_panico sp
      LEFT JOIN planes_panico pp ON sp.plan_id = pp.id
      WHERE sp.usuario_id = ${usuarioId}
      AND sp.estado IN ('activo', 'cortesia')
      AND (sp.fecha_fin IS NULL OR sp.fecha_fin > NOW())
    `);
    
    // Si tiene suscripción activa con cortesía
    if (suscripciones.rows && suscripciones.rows.length > 0) {
      const suscripcion = suscripciones.rows[0] as any;
      
      if (suscripcion.cortesia_meses_restantes > 0) {
        return {
          tieneAcceso: true,
          razon: `Tienes ${suscripcion.cortesia_meses_restantes} mes(es) de cortesía restantes`,
          esGratuito: true,
          diasRestantes: calcularDiasRestantes(suscripcion.fecha_fin)
        };
      }
      
      // Suscripción activa pagada
      return {
        tieneAcceso: true,
        razon: "Suscripción activa",
        diasRestantes: calcularDiasRestantes(suscripcion.fecha_fin)
      };
    }
    
    // Sin suscripción activa, verificar saldo mínimo para activar
    const costoMinimo = 1.00; // Costo mínimo para grupos normales
    
    if (saldoActual >= costoMinimo) {
      return {
        tieneAcceso: true,
        razon: "Saldo disponible para servicio de pánico",
        requiereRecarga: false
      };
    }
    
    return {
      tieneAcceso: false,
      razon: "Para usar el botón de pánico, necesitas saldo en tu cartera o una suscripción activa",
      requiereRecarga: true,
      montoRequerido: costoMinimo - saldoActual
    };
  } catch (error) {
    console.error("Error al verificar acceso al pánico:", error);
    return {
      tieneAcceso: false,
      razon: "Error al verificar acceso"
    };
  }
}

// Obtener planes de pánico disponibles
export async function getPlanesPanico() {
  const planes = await db.execute(sql`
    SELECT * FROM planes_panico WHERE activo = true ORDER BY monto_mensual ASC
  `);
  return planes.rows;
}

// Crear o activar suscripción de pánico para un grupo
export async function activarSuscripcionPanico(
  usuarioId: string,
  grupoId: string,
  tipoGrupo: 'chat_org' | 'chat_normal',
  mesesCortesia: number = 0
): Promise<{ exito: boolean; mensaje: string; suscripcionId?: string }> {
  try {
    const montoMensual = tipoGrupo === 'chat_org' ? 5.00 : 1.00;
    const planId = tipoGrupo === 'chat_org' ? 'plan-chat-org' : 'plan-chat-normal';
    
    // Verificar si ya existe suscripción
    const existente = await db.execute(sql`
      SELECT * FROM suscripciones_panico 
      WHERE usuario_id = ${usuarioId} AND grupo_id = ${grupoId}
    `);
    
    if (existente.rows && existente.rows.length > 0) {
      // Reactivar si estaba suspendida
      await db.execute(sql`
        UPDATE suscripciones_panico 
        SET estado = 'activo',
            cortesia_meses_restantes = ${mesesCortesia},
            fecha_inicio = NOW(),
            fecha_proximo_cobro = NOW() + INTERVAL '1 month',
            updated_at = NOW()
        WHERE usuario_id = ${usuarioId} AND grupo_id = ${grupoId}
      `);
      
      return {
        exito: true,
        mensaje: "Suscripción reactivada correctamente",
        suscripcionId: (existente.rows[0] as any).id
      };
    }
    
    // Crear nueva suscripción
    const resultado = await db.execute(sql`
      INSERT INTO suscripciones_panico (
        usuario_id, grupo_id, plan_id, tipo_grupo, monto_mensual,
        estado, cortesia_meses_restantes, cortesia_meses_totales,
        fecha_inicio, fecha_proximo_cobro
      ) VALUES (
        ${usuarioId}, ${grupoId}, ${planId}, ${tipoGrupo}, ${montoMensual},
        ${mesesCortesia > 0 ? 'cortesia' : 'activo'},
        ${mesesCortesia}, ${mesesCortesia},
        NOW(), NOW() + INTERVAL '1 month'
      ) RETURNING id
    `);
    
    const suscripcionId = (resultado.rows[0] as any)?.id;
    
    return {
      exito: true,
      mensaje: mesesCortesia > 0 
        ? `Suscripción activada con ${mesesCortesia} mes(es) de cortesía`
        : "Suscripción activada correctamente",
      suscripcionId
    };
  } catch (error) {
    console.error("Error al activar suscripción:", error);
    return {
      exito: false,
      mensaje: "Error al activar la suscripción"
    };
  }
}

// Procesar cobro mensual de suscripción
export async function procesarCobroMensual(suscripcionId: string): Promise<{
  exito: boolean;
  mensaje: string;
  estadoCobro: string;
}> {
  try {
    // Obtener suscripción
    const suscripcion = await db.execute(sql`
      SELECT * FROM suscripciones_panico WHERE id = ${suscripcionId}
    `);
    
    if (!suscripcion.rows || suscripcion.rows.length === 0) {
      return { exito: false, mensaje: "Suscripción no encontrada", estadoCobro: "fallido" };
    }
    
    const sub = suscripcion.rows[0] as any;
    
    // Si tiene meses de cortesía, descontar uno
    if (sub.cortesia_meses_restantes > 0) {
      await db.execute(sql`
        UPDATE suscripciones_panico 
        SET cortesia_meses_restantes = cortesia_meses_restantes - 1,
            fecha_proximo_cobro = NOW() + INTERVAL '1 month',
            fecha_ultimo_cobro = NOW(),
            estado = CASE WHEN cortesia_meses_restantes - 1 <= 0 THEN 'activo' ELSE 'cortesia' END,
            updated_at = NOW()
        WHERE id = ${suscripcionId}
      `);
      
      // Registrar en historial
      await db.execute(sql`
        INSERT INTO historial_cobros_panico (
          suscripcion_id, usuario_id, periodo_inicio, periodo_fin,
          monto_cobrado, estado_cobro
        ) VALUES (
          ${suscripcionId}, ${sub.usuario_id}, NOW() - INTERVAL '1 month', NOW(),
          0, 'cortesia'
        )
      `);
      
      return { exito: true, mensaje: "Mes de cortesía aplicado", estadoCobro: "cortesia" };
    }
    
    // Intentar cobrar del saldo
    const monto = parseFloat(sub.monto_mensual);
    const resultado = await debitarSaldo(
      sub.usuario_id,
      monto,
      `Cobro mensual - Plan de pánico ${sub.tipo_grupo === 'chat_org' ? 'Organizacional' : 'Familiar'}`,
      suscripcionId
    );
    
    if (resultado.exito) {
      // Actualizar suscripción
      await db.execute(sql`
        UPDATE suscripciones_panico 
        SET fecha_proximo_cobro = NOW() + INTERVAL '1 month',
            fecha_ultimo_cobro = NOW(),
            updated_at = NOW()
        WHERE id = ${suscripcionId}
      `);
      
      // Registrar en historial
      await db.execute(sql`
        INSERT INTO historial_cobros_panico (
          suscripcion_id, usuario_id, periodo_inicio, periodo_fin,
          monto_cobrado, saldo_previo, saldo_posterior, estado_cobro, transaccion_cartera_id
        ) VALUES (
          ${suscripcionId}, ${sub.usuario_id}, NOW() - INTERVAL '1 month', NOW(),
          ${monto}, ${resultado.saldoAnterior}, ${resultado.saldoNuevo}, 'exitoso', ${resultado.transaccionId}
        )
      `);
      
      return { exito: true, mensaje: `Cobro exitoso de S/ ${monto.toFixed(2)}`, estadoCobro: "exitoso" };
    } else {
      // Suspender suscripción por falta de saldo
      await db.execute(sql`
        UPDATE suscripciones_panico 
        SET estado = 'suspendido',
            fecha_suspension = NOW(),
            motivo_suspension = 'Saldo insuficiente',
            updated_at = NOW()
        WHERE id = ${suscripcionId}
      `);
      
      // Registrar en historial
      await db.execute(sql`
        INSERT INTO historial_cobros_panico (
          suscripcion_id, usuario_id, periodo_inicio, periodo_fin,
          monto_cobrado, saldo_previo, estado_cobro, motivo_fallo
        ) VALUES (
          ${suscripcionId}, ${sub.usuario_id}, NOW() - INTERVAL '1 month', NOW(),
          ${monto}, ${resultado.saldoAnterior}, 'fallido', 'Saldo insuficiente'
        )
      `);
      
      // Notificar al usuario
      notificarUsuario(sub.usuario_id, {
        tipo: "general",
        titulo: "Suscripción suspendida",
        mensaje: "Tu suscripción al servicio de pánico fue suspendida por falta de saldo. Recarga tu cartera para continuar.",
        metadata: { suscripcionId, montoRequerido: monto }
      });
      
      return { exito: false, mensaje: "Saldo insuficiente, suscripción suspendida", estadoCobro: "fallido" };
    }
  } catch (error) {
    console.error("Error al procesar cobro:", error);
    return { exito: false, mensaje: "Error al procesar el cobro", estadoCobro: "error" };
  }
}

// Función auxiliar para calcular días restantes
function calcularDiasRestantes(fechaFin: Date | null): number {
  if (!fechaFin) return 30;
  const ahora = new Date();
  const fin = new Date(fechaFin);
  const diferencia = fin.getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(diferencia / (1000 * 60 * 60 * 24)));
}

// Obtener suscripciones de un usuario
export async function getSuscripcionesUsuario(usuarioId: string) {
  const suscripciones = await db.execute(sql`
    SELECT sp.*, 
           pp.nombre as plan_nombre,
           gc.nombre as grupo_nombre
    FROM suscripciones_panico sp
    LEFT JOIN planes_panico pp ON sp.plan_id = pp.id
    LEFT JOIN grupos_chat gc ON sp.grupo_id = gc.id
    WHERE sp.usuario_id = ${usuarioId}
    ORDER BY sp.created_at DESC
  `);
  return suscripciones.rows;
}

// Obtener historial de cobros de un usuario
export async function getHistorialCobrosUsuario(usuarioId: string) {
  const historial = await db.execute(sql`
    SELECT hcp.*, sp.tipo_grupo, gc.nombre as grupo_nombre
    FROM historial_cobros_panico hcp
    JOIN suscripciones_panico sp ON hcp.suscripcion_id = sp.id
    LEFT JOIN grupos_chat gc ON sp.grupo_id = gc.id
    WHERE hcp.usuario_id = ${usuarioId}
    ORDER BY hcp.fecha_cobro DESC
    LIMIT 50
  `);
  return historial.rows;
}
