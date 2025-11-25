import { db } from "./db";
import { gruposChat, miembrosGrupo, mensajes, usuarios } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seedChat() {
  console.log("🌱 Iniciando seed de grupos de chat...");

  try {
    // Obtener usuarios existentes
    const usuariosExistentes = await db.select().from(usuarios).limit(10);
    
    if (usuariosExistentes.length === 0) {
      console.log("⚠️ No hay usuarios en la base de datos. Ejecute seed-nuevos-usuarios.ts primero.");
      return;
    }

    console.log(`📋 Encontrados ${usuariosExistentes.length} usuarios existentes`);

    // Crear grupos de chat de emergencia
    const gruposEmergencia = [
      {
        id: "grupo-policia",
        nombre: "Policía Nacional - Tacna",
        descripcion: "Grupo oficial de la Policía Nacional del Perú en Tacna para emergencias ciudadanas",
        tipo: "emergencia",
        esEmergencia: true,
        estado: "activo" as const,
        estrellasMinimas: 1,
        maxMiembros: 5000,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
      {
        id: "grupo-bomberos",
        nombre: "Bomberos Voluntarios Tacna",
        descripcion: "Compañía de Bomberos Voluntarios de Tacna - Emergencias de incendios y rescates",
        tipo: "emergencia",
        esEmergencia: true,
        estado: "activo" as const,
        estrellasMinimas: 1,
        maxMiembros: 2000,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
      {
        id: "grupo-serenazgo",
        nombre: "Serenazgo Tacna",
        descripcion: "Seguridad ciudadana municipal - Reportes de incidentes y emergencias locales",
        tipo: "emergencia",
        esEmergencia: true,
        estado: "activo" as const,
        estrellasMinimas: 1,
        maxMiembros: 3000,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
      {
        id: "grupo-samu",
        nombre: "SAMU Tacna - Emergencias Médicas",
        descripcion: "Sistema de Atención Móvil de Urgencia - Emergencias médicas y primeros auxilios",
        tipo: "emergencia",
        esEmergencia: true,
        estado: "activo" as const,
        estrellasMinimas: 1,
        maxMiembros: 2000,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
    ];

    // Crear grupos comunitarios
    const gruposComunitarios = [
      {
        id: "grupo-vecinos-centro",
        nombre: "Vecinos Centro de Tacna",
        descripcion: "Grupo de vecinos del centro histórico de Tacna - Coordinación y seguridad barrial",
        tipo: "comunidad",
        esEmergencia: false,
        estado: "activo" as const,
        estrellasMinimas: 3,
        maxMiembros: 500,
        tipoCobro: "por_usuario" as const,
        tarifaMensual: 5.00,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
      {
        id: "grupo-conductores-taxi",
        nombre: "Conductores de Taxi Tacna",
        descripcion: "Red de taxistas de Tacna - Coordinación, alertas y apoyo mutuo",
        tipo: "profesional",
        esEmergencia: false,
        estado: "activo" as const,
        estrellasMinimas: 2,
        maxMiembros: 1000,
        tipoCobro: "por_grupo" as const,
        tarifaMensual: 20.00,
        avatarUrl: null,
        creadorId: usuariosExistentes[1]?.id || usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[1]?.id || usuariosExistentes[0].id,
      },
      {
        id: "grupo-comerciantes",
        nombre: "Comerciantes de Tacna",
        descripcion: "Asociación de comerciantes locales - Seguridad, alertas y ofertas",
        tipo: "profesional",
        esEmergencia: false,
        estado: "activo" as const,
        estrellasMinimas: 3,
        maxMiembros: 800,
        tipoCobro: "por_usuario" as const,
        tarifaMensual: 3.00,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
      {
        id: "grupo-madres-tacna",
        nombre: "Madres de Tacna Unidas",
        descripcion: "Red de apoyo y seguridad para madres de familia - Información y alertas",
        tipo: "comunidad",
        esEmergencia: false,
        estado: "activo" as const,
        estrellasMinimas: 2,
        maxMiembros: 1500,
        tipoCobro: null,
        tarifaMensual: null,
        avatarUrl: null,
        creadorId: usuariosExistentes[0].id,
        adminGrupoId: usuariosExistentes[0].id,
      },
    ];

    const todosLosGrupos = [...gruposEmergencia, ...gruposComunitarios];

    // Insertar grupos
    for (const grupo of todosLosGrupos) {
      await db
        .insert(gruposChat)
        .values(grupo)
        .onConflictDoNothing({ target: gruposChat.id });
      console.log(`✅ Grupo creado: ${grupo.nombre}`);
    }

    // Agregar miembros a los grupos
    for (const grupo of todosLosGrupos) {
      // Agregar al creador como admin
      await db
        .insert(miembrosGrupo)
        .values({
          grupoId: grupo.id,
          usuarioId: grupo.creadorId,
          rol: "admin",
          estado: "activo",
          estrellas: 5,
        })
        .onConflictDoNothing();

      // Agregar otros usuarios como miembros
      for (let i = 1; i < Math.min(usuariosExistentes.length, 5); i++) {
        await db
          .insert(miembrosGrupo)
          .values({
            grupoId: grupo.id,
            usuarioId: usuariosExistentes[i].id,
            rol: "miembro",
            estado: "activo",
            estrellas: 3,
          })
          .onConflictDoNothing();
      }
    }
    console.log("✅ Miembros agregados a los grupos");

    // Crear mensajes de prueba en algunos grupos
    const mensajesPrueba = [
      {
        grupoId: "grupo-vecinos-centro",
        remitenteId: usuariosExistentes[0].id,
        contenido: "Bienvenidos al grupo de vecinos del centro. Por favor respeten las normas de convivencia.",
        tipo: "texto",
      },
      {
        grupoId: "grupo-vecinos-centro",
        remitenteId: usuariosExistentes[1]?.id || usuariosExistentes[0].id,
        contenido: "Hola vecinos, vi actividad sospechosa en la esquina de Bolognesi con San Martín hace unos minutos.",
        tipo: "texto",
      },
      {
        grupoId: "grupo-vecinos-centro",
        remitenteId: usuariosExistentes[2]?.id || usuariosExistentes[0].id,
        contenido: "Gracias por el aviso. Ya alerté al serenazgo de la zona.",
        tipo: "texto",
      },
      {
        grupoId: "grupo-policia",
        remitenteId: usuariosExistentes[0].id,
        contenido: "Grupo oficial de la Policía Nacional. Para emergencias graves llame al 105.",
        tipo: "texto",
      },
      {
        grupoId: "grupo-conductores-taxi",
        remitenteId: usuariosExistentes[1]?.id || usuariosExistentes[0].id,
        contenido: "Buenos días colegas. Cuidado con la zona de Alto de la Alianza, hay tráfico pesado por obras.",
        tipo: "texto",
      },
      {
        grupoId: "grupo-conductores-taxi",
        remitenteId: usuariosExistentes[3]?.id || usuariosExistentes[0].id,
        contenido: "Gracias por el aviso. También hay mucho movimiento por el terminal terrestre.",
        tipo: "texto",
      },
    ];

    for (const msg of mensajesPrueba) {
      await db
        .insert(mensajes)
        .values(msg);
    }
    console.log("✅ Mensajes de prueba creados");

    // Actualizar contadores de grupos
    for (const grupo of todosLosGrupos) {
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(miembrosGrupo)
        .where(sql`grupo_id = ${grupo.id} AND estado = 'activo'`);
      
      const totalMiembros = Number(countResult[0]?.count || 0);
      
      const msgCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(mensajes)
        .where(sql`grupo_id = ${grupo.id}`);
      
      const totalMensajes = Number(msgCountResult[0]?.count || 0);

      await db
        .update(gruposChat)
        .set({
          totalMiembros,
          totalMensajes,
          updatedAt: new Date(),
        })
        .where(sql`id = ${grupo.id}`);
    }
    console.log("✅ Contadores de grupos actualizados");

    console.log("🎉 Seed de chat completado exitosamente!");
    console.log(`   - ${gruposEmergencia.length} grupos de emergencia`);
    console.log(`   - ${gruposComunitarios.length} grupos comunitarios`);
    console.log(`   - ${mensajesPrueba.length} mensajes de prueba`);

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  }
}

seedChat()
  .then(() => {
    console.log("✨ Script de seed finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error fatal:", error);
    process.exit(1);
  });
