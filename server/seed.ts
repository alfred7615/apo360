import { db } from "./db";
import { sql } from "drizzle-orm";
import { usuarios, publicidad, servicios, productosDelivery, gruposChat, miembrosGrupo, radiosOnline, archivosMp3, configuracionSitio } from "@shared/schema";

async function seed() {
  console.log("🌱 Iniciando seed de base de datos...");

  try {
    // Limpiar tablas existentes (solo para desarrollo)
    console.log("🧹 Limpiando datos existentes...");
    await db.delete(archivosMp3);
    await db.delete(radiosOnline);
    await db.delete(productosDelivery);
    await db.delete(servicios);
    await db.delete(publicidad);
    await db.delete(miembrosGrupo);
    await db.delete(gruposChat);
    await db.delete(configuracionSitio);

    // ============================================================
    // USUARIOS DE PRUEBA
    // ============================================================
    console.log("👥 Creando usuarios de prueba...");
    const [adminUser] = await db.insert(usuarios).values({
      id: "admin-test-001",
      email: "admin@segapo.com",
      primerNombre: "Administrador",
      apellido: "Sistema",
      rol: "super_admin",
      estado: "activo",
    }).returning();

    const [localUser1] = await db.insert(usuarios).values({
      id: "local-test-001",
      email: "restaurante@segapo.com",
      primerNombre: "El Buen",
      apellido: "Sabor",
      rol: "local",
      estado: "activo",
    }).returning();

    const [localUser2] = await db.insert(usuarios).values({
      id: "local-test-002",
      email: "farmacia@segapo.com",
      primerNombre: "Farmacia",
      apellido: "San José",
      rol: "local",
      estado: "activo",
    }).returning();

    // ============================================================
    // CONFIGURACIÓN DEL SITIO
    // ============================================================
    console.log("⚙️ Creando configuración del sitio...");
    await db.insert(configuracionSitio).values([
      {
        clave: "nombre_sitio",
        valor: "SEG-APO - Seguridad y Apoyo Comunitario",
        tipo: "texto",
      },
      {
        clave: "franja_emergencia_activa",
        valor: "false",
        tipo: "boolean",
      },
      {
        clave: "franja_emergencia_texto",
        valor: "Alerta de emergencia activa en tu sector",
        tipo: "texto",
      },
    ]);

    // ============================================================
    // PUBLICIDAD - CARRUSEL DE LOGOS
    // ============================================================
    console.log("🎨 Creando publicidad - Carrusel de logos...");
    await db.insert(publicidad).values([
      {
        tipo: "carrusel_logos",
        titulo: "Restaurante El Buen Sabor",
        descripcion: "Comida criolla y regional",
        imagenUrl: "https://placehold.co/200x80/8B5CF6/FFFFFF/png?text=El+Buen+Sabor",
        orden: 1,
        estado: "activo",
      },
      {
        tipo: "carrusel_logos",
        titulo: "Farmacia San José",
        descripcion: "Atención 24 horas",
        imagenUrl: "https://placehold.co/200x80/EC4899/FFFFFF/png?text=Farmacia+San+Jose",
        orden: 2,
        estado: "activo",
      },
      {
        tipo: "carrusel_logos",
        titulo: "Taller Mecánico Express",
        descripcion: "Servicio rápido",
        imagenUrl: "https://placehold.co/200x80/3B82F6/FFFFFF/png?text=Taller+Express",
        orden: 3,
        estado: "activo",
      },
      {
        tipo: "carrusel_logos",
        titulo: "Panadería La Moderna",
        descripcion: "Pan fresco todos los días",
        imagenUrl: "https://placehold.co/200x80/F59E0B/FFFFFF/png?text=La+Moderna",
        orden: 4,
        estado: "activo",
      },
      {
        tipo: "carrusel_logos",
        titulo: "Veterinaria Mascota Feliz",
        descripcion: "Cuidado para tus mascotas",
        imagenUrl: "https://placehold.co/200x80/10B981/FFFFFF/png?text=Mascota+Feliz",
        orden: 5,
        estado: "activo",
      },
    ]);

    // ============================================================
    // PUBLICIDAD - CARRUSEL PRINCIPAL
    // ============================================================
    console.log("🎪 Creando publicidad - Carrusel principal...");
    await db.insert(publicidad).values([
      {
        tipo: "carrusel_principal",
        titulo: "Bienvenido a SEG-APO",
        descripcion: "Tu comunidad más segura y conectada. Únete hoy y sé parte del cambio.",
        imagenUrl: "https://placehold.co/1200x500/8B5CF6/FFFFFF/png?text=SEG-APO+Comunidad+Segura",
        enlaceUrl: "/api/login",
        orden: 1,
        estado: "activo",
      },
      {
        tipo: "carrusel_principal",
        titulo: "Taxi Seguro en Tu Zona",
        descripcion: "Viaja con confianza. Conductores verificados de tu propia comunidad.",
        imagenUrl: "https://placehold.co/1200x500/F59E0B/FFFFFF/png?text=Taxi+Seguro+24/7",
        orden: 2,
        estado: "activo",
      },
      {
        tipo: "carrusel_principal",
        titulo: "Delivery de Comercios Locales",
        descripcion: "Apoya a tu comunidad. Pide desde restaurantes, farmacias y tiendas cercanas.",
        imagenUrl: "https://placehold.co/1200x500/10B981/FFFFFF/png?text=Delivery+Local",
        orden: 3,
        estado: "activo",
      },
    ]);

    // ============================================================
    // SERVICIOS LOCALES
    // ============================================================
    console.log("🏪 Creando servicios locales...");
    const [restaurante] = await db.insert(servicios).values({
      categoria: "restaurante",
      nombreServicio: "Restaurante El Buen Sabor",
      descripcion: "Comida criolla y regional. Atención de lunes a domingo de 11am a 10pm.",
      logoUrl: "https://placehold.co/100x100/8B5CF6/FFFFFF/png?text=RES",
      direccion: "Av. Bolognesi 542, Tacna",
      telefono: "+51 952 123 456",
      horario: "Lunes a Domingo: 11:00 - 22:00",
      estado: "activo",
      usuarioId: localUser1.id,
    }).returning();

    const [farmacia] = await db.insert(servicios).values({
      categoria: "farmacia",
      nombreServicio: "Farmacia San José",
      descripcion: "Farmacia con atención 24 horas. Venta de medicamentos y productos de salud.",
      logoUrl: "https://placehold.co/100x100/EC4899/FFFFFF/png?text=FARM",
      direccion: "Av. San Martín 890, Tacna",
      telefono: "+51 952 789 012",
      horario: "Abierto las 24 horas",
      estado: "activo",
      usuarioId: localUser2.id,
    }).returning();

    await db.insert(servicios).values([
      {
        categoria: "taller",
        nombreServicio: "Taller Mecánico Express",
        descripcion: "Servicio mecánico rápido y confiable. Mantenimiento preventivo y correctivo.",
        logoUrl: "https://placehold.co/100x100/3B82F6/FFFFFF/png?text=TALL",
        direccion: "Jr. Coronel Mendoza 234, Tacna",
        telefono: "+51 952 345 678",
        horario: "Lunes a Sábado: 8:00 - 18:00",
        estado: "activo",
        usuarioId: adminUser.id,
      },
      {
        categoria: "panaderia",
        nombreServicio: "Panadería La Moderna",
        descripcion: "Pan artesanal y pasteles frescos todos los días.",
        logoUrl: "https://placehold.co/100x100/F59E0B/FFFFFF/png?text=PAN",
        direccion: "Av. Gregorio Albarracín 456, Tacna",
        telefono: "+51 952 456 789",
        horario: "Lunes a Domingo: 6:00 - 20:00",
        estado: "activo",
        usuarioId: adminUser.id,
      },
      {
        categoria: "veterinaria",
        nombreServicio: "Veterinaria Mascota Feliz",
        descripcion: "Atención veterinaria integral para tus mascotas.",
        logoUrl: "https://placehold.co/100x100/10B981/FFFFFF/png?text=VET",
        direccion: "Calle Zela 789, Tacna",
        telefono: "+51 952 567 890",
        horario: "Lunes a Sábado: 9:00 - 19:00",
        estado: "activo",
        usuarioId: adminUser.id,
      },
    ]);

    // ============================================================
    // PRODUCTOS DELIVERY
    // ============================================================
    console.log("🍽️ Creando productos de delivery...");
    await db.insert(productosDelivery).values([
      {
        servicioId: restaurante.id,
        nombre: "Ceviche de Pescado",
        descripcion: "Ceviche fresco con pescado del día, limón y camote",
        precio: "25.00",
        imagenUrl: "https://placehold.co/300x200/8B5CF6/FFFFFF/png?text=Ceviche",
        disponible: true,
      },
      {
        servicioId: restaurante.id,
        nombre: "Lomo Saltado",
        descripcion: "Lomo de res salteado con papas fritas y arroz",
        precio: "22.00",
        imagenUrl: "https://placehold.co/300x200/8B5CF6/FFFFFF/png?text=Lomo",
        disponible: true,
      },
      {
        servicioId: restaurante.id,
        nombre: "Arroz con Pollo",
        descripcion: "Arroz especial con pollo y verduras",
        precio: "18.00",
        imagenUrl: "https://placehold.co/300x200/8B5CF6/FFFFFF/png?text=Arroz",
        disponible: true,
      },
      {
        servicioId: farmacia.id,
        nombre: "Paracetamol 500mg",
        descripcion: "Caja con 20 tabletas",
        precio: "5.00",
        imagenUrl: "https://placehold.co/300x200/EC4899/FFFFFF/png?text=Med",
        disponible: true,
      },
      {
        servicioId: farmacia.id,
        nombre: "Alcohol en Gel 250ml",
        descripcion: "Desinfectante antibacterial",
        precio: "8.50",
        imagenUrl: "https://placehold.co/300x200/EC4899/FFFFFF/png?text=Alcohol",
        disponible: true,
      },
    ]);

    // ============================================================
    // GRUPOS DE CHAT
    // ============================================================
    console.log("💬 Creando grupos de chat...");
    await db.insert(gruposChat).values([
      {
        nombre: "Asociación Alfonso Ugarte",
        descripcion: "Grupo oficial de la Asociación Alfonso Ugarte - Sector Norte",
        tipo: "asociacion",
        avatarUrl: "https://placehold.co/100x100/8B5CF6/FFFFFF/png?text=AU",
        creadorId: adminUser.id,
      },
      {
        nombre: "Vecinos Gregorio Albarracín",
        descripcion: "Comunicación entre vecinos del sector Gregorio Albarracín",
        tipo: "comunitario",
        avatarUrl: "https://placehold.co/100x100/EC4899/FFFFFF/png?text=GA",
        creadorId: adminUser.id,
      },
      {
        nombre: "Alertas de Emergencia",
        descripcion: "Canal oficial de notificaciones de emergencia",
        tipo: "emergencia",
        avatarUrl: "https://placehold.co/100x100/EF4444/FFFFFF/png?text=EMERG",
        creadorId: adminUser.id,
      },
      {
        nombre: "Coordinación Serenazgo",
        descripcion: "Canal de comunicación con serenazgo municipal",
        tipo: "emergencia",
        avatarUrl: "https://placehold.co/100x100/3B82F6/FFFFFF/png?text=SER",
        creadorId: adminUser.id,
      },
    ]);

    // ============================================================
    // RADIOS ONLINE
    // ============================================================
    console.log("📻 Creando radios online...");
    await db.insert(radiosOnline).values([
      {
        nombre: "Radio Uno Tacna",
        url: "https://stream.radiouno.pe/tacna",
        descripcion: "La radio de Tacna",
        logoUrl: "https://placehold.co/100x100/8B5CF6/FFFFFF/png?text=R1",
        orden: 1,
        estado: "activo",
      },
      {
        nombre: "Radio Líder",
        url: "https://stream.radiolider.pe/stream",
        descripcion: "Música y noticias",
        logoUrl: "https://placehold.co/100x100/EC4899/FFFFFF/png?text=RL",
        orden: 2,
        estado: "activo",
      },
      {
        nombre: "RPP Tacna",
        url: "https://streaming.rpp.pe/tacna",
        descripcion: "Noticias al instante",
        logoUrl: "https://placehold.co/100x100/F59E0B/FFFFFF/png?text=RPP",
        orden: 3,
        estado: "activo",
      },
    ]);

    // ============================================================
    // ARCHIVOS MP3
    // ============================================================
    console.log("🎵 Creando archivos MP3...");
    await db.insert(archivosMp3).values([
      {
        titulo: "Himno de Tacna",
        archivoUrl: "/audio/himno-tacna.mp3",
        duracion: 180,
        orden: 1,
        estado: "activo",
      },
      {
        titulo: "Mensaje de Bienvenida SEG-APO",
        archivoUrl: "/audio/bienvenida.mp3",
        duracion: 45,
        orden: 2,
        estado: "activo",
      },
      {
        titulo: "Instrucciones de Emergencia",
        archivoUrl: "/audio/emergencia.mp3",
        duracion: 120,
        orden: 3,
        estado: "activo",
      },
    ]);

    console.log("✅ Seed completado exitosamente!");
    console.log("\nDatos creados:");
    console.log("- 3 usuarios de prueba");
    console.log("- 3 configuraciones de sitio");
    console.log("- 8 publicidades (5 logos + 3 carrusel principal)");
    console.log("- 5 servicios locales");
    console.log("- 5 productos de delivery");
    console.log("- 4 grupos de chat");
    console.log("- 3 radios online");
    console.log("- 3 archivos MP3");

  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("\n🎉 Proceso de seed finalizado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed falló:", error);
    process.exit(1);
  });
