import { db } from "./db";
import { metodosPago, monedas, saldosUsuarios, solicitudesSaldo, transaccionesSaldo, usuarios } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedCartera() {
  console.log("Iniciando seed de datos de cartera...");

  try {
    const allUsuarios = await db.select().from(usuarios);
    console.log(`Encontrados ${allUsuarios.length} usuarios`);

    if (allUsuarios.length === 0) {
      console.log("No hay usuarios en la BD. Ejecute primero seed-nuevos-usuarios.ts");
      return;
    }

    console.log("\n1. Insertando monedas...");
    const monedasData = [
      { codigo: "PEN", nombre: "Sol Peruano", simbolo: "S/", tasaCambio: "1.00", activo: true, orden: 1 },
      { codigo: "USD", nombre: "Dolar Americano", simbolo: "$", tasaCambio: "3.80", activo: true, orden: 2 },
      { codigo: "EUR", nombre: "Euro", simbolo: "€", tasaCambio: "4.10", activo: true, orden: 3 },
    ];

    for (const moneda of monedasData) {
      try {
        await db.insert(monedas).values(moneda);
        console.log(`  Moneda ${moneda.codigo} creada`);
      } catch (e: any) {
        if (e.code === "23505") {
          console.log(`  Moneda ${moneda.codigo} ya existe`);
        } else {
          throw e;
        }
      }
    }

    console.log("\n2. Insertando metodos de pago de plataforma...");
    const metodosData = [
      {
        tipo: "cuenta_bancaria",
        nombre: "BCP Soles",
        numero: "191-12345678-0-01",
        titular: "SEG-APO SAC",
        banco: "BCP",
        moneda: "PEN",
        esPlataforma: true,
        activo: true,
        orden: 1,
      },
      {
        tipo: "cuenta_bancaria",
        nombre: "BBVA Soles",
        numero: "0011-0123-0456789012",
        titular: "SEG-APO SAC",
        banco: "BBVA",
        moneda: "PEN",
        esPlataforma: true,
        activo: true,
        orden: 2,
      },
      {
        tipo: "interbancaria",
        nombre: "BCP CCI",
        numero: "002-191-012345678-0-01",
        titular: "SEG-APO SAC",
        banco: "BCP",
        moneda: "PEN",
        esPlataforma: true,
        activo: true,
        orden: 3,
      },
      {
        tipo: "yape",
        nombre: "Yape Corporativo",
        numero: "951123456",
        titular: "SEG-APO",
        moneda: "PEN",
        esPlataforma: true,
        activo: true,
        orden: 4,
      },
      {
        tipo: "plin",
        nombre: "Plin Corporativo",
        numero: "952654321",
        titular: "SEG-APO",
        moneda: "PEN",
        esPlataforma: true,
        activo: true,
        orden: 5,
      },
      {
        tipo: "paypal",
        nombre: "PayPal",
        numero: "pagos@seg-apo.com",
        titular: "SEG-APO SAC",
        moneda: "USD",
        esPlataforma: true,
        activo: true,
        orden: 6,
      },
    ];

    for (const metodo of metodosData) {
      try {
        await db.insert(metodosPago).values(metodo);
        console.log(`  Metodo ${metodo.nombre} creado`);
      } catch (e: any) {
        if (e.code === "23505") {
          console.log(`  Metodo ${metodo.nombre} ya existe`);
        } else {
          throw e;
        }
      }
    }

    console.log("\n3. Creando saldos para usuarios existentes...");
    const usuariosConSaldo = allUsuarios.slice(0, 10);
    
    for (let i = 0; i < usuariosConSaldo.length; i++) {
      const user = usuariosConSaldo[i];
      const saldoInicial = (Math.random() * 200 + 50).toFixed(2);
      const totalIngresos = (parseFloat(saldoInicial) + Math.random() * 100).toFixed(2);
      const totalEgresos = (parseFloat(totalIngresos) - parseFloat(saldoInicial)).toFixed(2);
      
      try {
        await db.insert(saldosUsuarios).values({
          usuarioId: user.id,
          saldo: saldoInicial,
          monedaPreferida: "PEN",
          totalIngresos: totalIngresos,
          totalEgresos: totalEgresos,
        });
        console.log(`  Saldo para ${user.firstName || user.email}: S/ ${saldoInicial}`);
      } catch (e: any) {
        if (e.code === "23505") {
          console.log(`  Saldo para ${user.firstName || user.email} ya existe`);
        } else {
          throw e;
        }
      }
    }

    console.log("\n4. Creando solicitudes de saldo de ejemplo...");
    const metodosCreados = await db.select().from(metodosPago).limit(3);
    
    if (metodosCreados.length > 0) {
      const solicitudesData = [
        {
          usuarioId: usuariosConSaldo[0]?.id,
          tipo: "recarga",
          monto: "100.00",
          metodoPagoId: metodosCreados[0]?.id,
          numeroOperacion: "OP-2025-001",
          estado: "pendiente",
          notas: "Deposito BCP",
        },
        {
          usuarioId: usuariosConSaldo[1]?.id,
          tipo: "recarga",
          monto: "50.00",
          metodoPagoId: metodosCreados[1]?.id,
          numeroOperacion: "OP-2025-002",
          estado: "pendiente",
          notas: "Yape",
        },
        {
          usuarioId: usuariosConSaldo[2]?.id,
          tipo: "retiro",
          monto: "30.00",
          metodoPagoId: metodosCreados[0]?.id,
          estado: "pendiente",
          notas: "Retiro a cuenta BCP",
        },
        {
          usuarioId: usuariosConSaldo[0]?.id,
          tipo: "recarga",
          monto: "200.00",
          metodoPagoId: metodosCreados[2]?.id,
          numeroOperacion: "OP-2025-003",
          estado: "aprobado",
          aprobadoPor: "admin",
          fechaAprobacion: new Date(),
        },
        {
          usuarioId: usuariosConSaldo[1]?.id,
          tipo: "retiro",
          monto: "25.00",
          estado: "rechazado",
          motivoRechazo: "Saldo insuficiente en el momento de la solicitud",
        },
      ];

      for (const solicitud of solicitudesData) {
        if (solicitud.usuarioId) {
          try {
            await db.insert(solicitudesSaldo).values(solicitud);
            console.log(`  Solicitud ${solicitud.tipo} de S/ ${solicitud.monto} creada`);
          } catch (e: any) {
            console.log(`  Error creando solicitud: ${e.message}`);
          }
        }
      }
    }

    console.log("\n5. Creando transacciones de ejemplo...");
    for (let i = 0; i < 5; i++) {
      const user = usuariosConSaldo[i];
      if (!user) continue;

      const saldoAnterior = (Math.random() * 100).toFixed(2);
      const monto = (Math.random() * 50 + 10).toFixed(2);
      const tipo = i % 2 === 0 ? "recarga" : "retiro";
      const saldoNuevo = tipo === "recarga" 
        ? (parseFloat(saldoAnterior) + parseFloat(monto)).toFixed(2)
        : (parseFloat(saldoAnterior) - parseFloat(monto)).toFixed(2);

      try {
        await db.insert(transaccionesSaldo).values({
          usuarioId: user.id,
          tipo: tipo,
          concepto: tipo === "recarga" ? "Recarga de saldo via Yape" : "Retiro de saldo a cuenta bancaria",
          monto: monto,
          saldoAnterior: saldoAnterior,
          saldoNuevo: saldoNuevo,
          estado: "completado",
        });
        console.log(`  Transaccion ${tipo} de S/ ${monto} para ${user.firstName || user.email}`);
      } catch (e: any) {
        console.log(`  Error creando transaccion: ${e.message}`);
      }
    }

    console.log("\nSeed de cartera completado exitosamente!");
    
  } catch (error) {
    console.error("Error en seed de cartera:", error);
    throw error;
  }
}

seedCartera()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
