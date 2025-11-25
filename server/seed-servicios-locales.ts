import { db } from "./db";
import { categoriasServicio, logosServicios, productosServicio, configuracionSaldos } from "@shared/schema";
import { randomUUID } from "crypto";

async function seedServiciosLocales() {
  console.log("🌱 Iniciando seed de Servicios Locales...");

  // Limpiar tablas
  await db.delete(productosServicio);
  await db.delete(logosServicios);
  await db.delete(categoriasServicio);

  // Crear categorías de servicios
  const categoriasData = [
    { 
      id: randomUUID(), 
      nombre: "Restaurantes", 
      descripcion: "Restaurantes y locales de comida",
      imagenUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200",
      icono: "utensils",
      orden: 1,
      estado: "activo"
    },
    { 
      id: randomUUID(), 
      nombre: "Farmacias", 
      descripcion: "Farmacias y boticas",
      imagenUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200",
      icono: "pill",
      orden: 2,
      estado: "activo"
    },
    { 
      id: randomUUID(), 
      nombre: "Ferreterías", 
      descripcion: "Ferreterías y materiales de construcción",
      imagenUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200",
      icono: "wrench",
      orden: 3,
      estado: "activo"
    },
    { 
      id: randomUUID(), 
      nombre: "Tiendas", 
      descripcion: "Tiendas de abarrotes y minimarkets",
      imagenUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200",
      icono: "store",
      orden: 4,
      estado: "activo"
    },
    { 
      id: randomUUID(), 
      nombre: "Peluquerías", 
      descripcion: "Salones de belleza y peluquerías",
      imagenUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200",
      icono: "scissors",
      orden: 5,
      estado: "activo"
    },
    { 
      id: randomUUID(), 
      nombre: "Talleres", 
      descripcion: "Talleres mecánicos y servicios automotriz",
      imagenUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200",
      icono: "car",
      orden: 6,
      estado: "activo"
    },
  ];

  const categoriasCreadas = await db.insert(categoriasServicio).values(categoriasData).returning();
  console.log(`✅ ${categoriasCreadas.length} categorías creadas`);

  // Crear logos de servicios (negocios)
  const restauranteId = categoriasCreadas.find(c => c.nombre === "Restaurantes")?.id;
  const farmaciaId = categoriasCreadas.find(c => c.nombre === "Farmacias")?.id;
  const ferreteriaId = categoriasCreadas.find(c => c.nombre === "Ferreterías")?.id;
  const tiendaId = categoriasCreadas.find(c => c.nombre === "Tiendas")?.id;

  const logosData = [
    {
      id: randomUUID(),
      categoriaId: restauranteId,
      usuarioId: null,
      nombre: "Cevichería El Pescador",
      descripcion: "Los mejores ceviches de Tacna",
      logoUrl: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=200",
      direccion: "Av. Bolognesi 234, Tacna",
      telefono: "+51 952 123 456",
      whatsapp: "+51 952 123 456",
      email: "cevicheriaelpescador@gmail.com",
      horario: "Lun-Sab 11:00-17:00",
      estado: "activo",
      verificado: true,
      gpsLatitud: -18.0146,
      gpsLongitud: -70.2536,
      totalLikes: 45,
      totalFavoritos: 23,
    },
    {
      id: randomUUID(),
      categoriaId: restauranteId,
      usuarioId: null,
      nombre: "Pollería La Leña",
      descripcion: "Pollo a la brasa con sabor único",
      logoUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200",
      direccion: "Calle San Martín 567, Tacna",
      telefono: "+51 952 789 012",
      whatsapp: "+51 952 789 012",
      email: "pollerialalena@gmail.com",
      horario: "Lun-Dom 12:00-22:00",
      estado: "activo",
      verificado: true,
      gpsLatitud: -18.0155,
      gpsLongitud: -70.2520,
      totalLikes: 78,
      totalFavoritos: 34,
    },
    {
      id: randomUUID(),
      categoriaId: farmaciaId,
      usuarioId: null,
      nombre: "Botica Mi Salud",
      descripcion: "Tu salud es nuestra prioridad",
      logoUrl: "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200",
      direccion: "Av. Coronel Mendoza 123, Tacna",
      telefono: "+51 952 345 678",
      whatsapp: "+51 952 345 678",
      email: "boticamisalud@gmail.com",
      horario: "24 horas",
      estado: "activo",
      verificado: true,
      gpsLatitud: -18.0130,
      gpsLongitud: -70.2500,
      totalLikes: 32,
      totalFavoritos: 18,
    },
    {
      id: randomUUID(),
      categoriaId: ferreteriaId,
      usuarioId: null,
      nombre: "Ferretería El Constructor",
      descripcion: "Todo para la construcción",
      logoUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200",
      direccion: "Av. Industrial 890, Tacna",
      telefono: "+51 952 567 890",
      whatsapp: "+51 952 567 890",
      email: "ferreteriaelconstructor@gmail.com",
      horario: "Lun-Sab 8:00-18:00",
      estado: "activo",
      verificado: false,
      gpsLatitud: -18.0180,
      gpsLongitud: -70.2480,
      totalLikes: 25,
      totalFavoritos: 12,
    },
    {
      id: randomUUID(),
      categoriaId: tiendaId,
      usuarioId: null,
      nombre: "Minimarket Don José",
      descripcion: "Todo lo que necesitas cerca de ti",
      logoUrl: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200",
      direccion: "Jr. Zela 456, Tacna",
      telefono: "+51 952 012 345",
      whatsapp: "+51 952 012 345",
      email: "minimarketdonjose@gmail.com",
      horario: "Lun-Dom 7:00-23:00",
      estado: "activo",
      verificado: true,
      gpsLatitud: -18.0165,
      gpsLongitud: -70.2545,
      totalLikes: 56,
      totalFavoritos: 29,
    },
  ];

  const logosCreados = await db.insert(logosServicios).values(logosData).returning();
  console.log(`✅ ${logosCreados.length} logos de servicios creados`);

  // Crear productos para cada negocio
  const cevicheriaId = logosCreados.find(l => l.nombre === "Cevichería El Pescador")?.id;
  const polleriaId = logosCreados.find(l => l.nombre === "Pollería La Leña")?.id;
  const boticaId = logosCreados.find(l => l.nombre === "Botica Mi Salud")?.id;
  const ferreteriaLogoId = logosCreados.find(l => l.nombre === "Ferretería El Constructor")?.id;
  const minimarketId = logosCreados.find(l => l.nombre === "Minimarket Don José")?.id;

  const productosData = [
    // Cevichería
    {
      id: randomUUID(),
      logoServicioId: cevicheriaId!,
      codigo: "CEV-001",
      nombre: "Ceviche Mixto",
      descripcion: "Ceviche de pescado, camarones y pulpo",
      precio: "35.00",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=200",
      categoria: "Ceviches",
      stock: 100,
      disponible: true,
      orden: 1,
      totalLikes: 23,
      totalFavoritos: 12,
    },
    {
      id: randomUUID(),
      logoServicioId: cevicheriaId!,
      codigo: "CEV-002",
      nombre: "Ceviche de Pescado",
      descripcion: "Ceviche clásico de pescado fresco",
      precio: "28.00",
      precioOferta: "25.00",
      imagenUrl: "https://images.unsplash.com/photo-1582585604012-1c3f49b8a8fd?w=200",
      categoria: "Ceviches",
      stock: 100,
      disponible: true,
      orden: 2,
      totalLikes: 45,
      totalFavoritos: 20,
    },
    {
      id: randomUUID(),
      logoServicioId: cevicheriaId!,
      codigo: "CHI-001",
      nombre: "Chicharrón de Pescado",
      descripcion: "Pescado frito crujiente con yuca",
      precio: "32.00",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1567533708067-51e0d23d3c64?w=200",
      categoria: "Frituras",
      stock: 100,
      disponible: true,
      orden: 3,
      totalLikes: 18,
      totalFavoritos: 8,
    },
    // Pollería
    {
      id: randomUUID(),
      logoServicioId: polleriaId!,
      codigo: "POL-001",
      nombre: "1/4 Pollo a la Brasa",
      descripcion: "Incluye papas, ensalada y cremas",
      precio: "18.00",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200",
      categoria: "Pollos",
      stock: 200,
      disponible: true,
      orden: 1,
      totalLikes: 67,
      totalFavoritos: 35,
    },
    {
      id: randomUUID(),
      logoServicioId: polleriaId!,
      codigo: "POL-002",
      nombre: "1/2 Pollo a la Brasa",
      descripcion: "Incluye papas, ensalada y cremas",
      precio: "32.00",
      precioOferta: "28.00",
      imagenUrl: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=200",
      categoria: "Pollos",
      stock: 200,
      disponible: true,
      orden: 2,
      totalLikes: 89,
      totalFavoritos: 42,
    },
    // Botica
    {
      id: randomUUID(),
      logoServicioId: boticaId!,
      codigo: "MED-001",
      nombre: "Paracetamol 500mg",
      descripcion: "Caja x 20 tabletas",
      precio: "3.50",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200",
      categoria: "Medicamentos",
      stock: 500,
      disponible: true,
      orden: 1,
      totalLikes: 12,
      totalFavoritos: 5,
    },
    {
      id: randomUUID(),
      logoServicioId: boticaId!,
      codigo: "MED-002",
      nombre: "Vitamina C 1000mg",
      descripcion: "Frasco x 100 tabletas",
      precio: "25.00",
      precioOferta: "22.00",
      imagenUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200",
      categoria: "Vitaminas",
      stock: 150,
      disponible: true,
      orden: 2,
      totalLikes: 28,
      totalFavoritos: 14,
    },
    // Ferretería
    {
      id: randomUUID(),
      logoServicioId: ferreteriaLogoId!,
      codigo: "FER-001",
      nombre: "Cemento Sol 42.5 kg",
      descripcion: "Bolsa de cemento Portland",
      precio: "28.00",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1591955506264-3f5a6834570a?w=200",
      categoria: "Materiales",
      stock: 500,
      disponible: true,
      orden: 1,
      totalLikes: 15,
      totalFavoritos: 7,
    },
    {
      id: randomUUID(),
      logoServicioId: ferreteriaLogoId!,
      codigo: "FER-002",
      nombre: "Martillo de uña",
      descripcion: "Martillo con mango de fibra",
      precio: "35.00",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=200",
      categoria: "Herramientas",
      stock: 50,
      disponible: true,
      orden: 2,
      totalLikes: 8,
      totalFavoritos: 3,
    },
    // Minimarket
    {
      id: randomUUID(),
      logoServicioId: minimarketId!,
      codigo: "MIN-001",
      nombre: "Arroz Costeño 5kg",
      descripcion: "Arroz extra de primera calidad",
      precio: "18.00",
      precioOferta: "16.50",
      imagenUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200",
      categoria: "Abarrotes",
      stock: 100,
      disponible: true,
      orden: 1,
      totalLikes: 34,
      totalFavoritos: 18,
    },
    {
      id: randomUUID(),
      logoServicioId: minimarketId!,
      codigo: "MIN-002",
      nombre: "Aceite Primor 1L",
      descripcion: "Aceite vegetal de primera",
      precio: "12.00",
      precioOferta: null,
      imagenUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200",
      categoria: "Abarrotes",
      stock: 80,
      disponible: true,
      orden: 2,
      totalLikes: 22,
      totalFavoritos: 10,
    },
  ];

  const productosCreados = await db.insert(productosServicio).values(productosData).returning();
  console.log(`✅ ${productosCreados.length} productos creados`);

  // Crear configuración de cobros
  await db.insert(configuracionSaldos).values({
    id: randomUUID(),
    tipoOperacion: "costo_producto_servicio",
    tipoValor: "monto",
    valor: "2.50",
    descripcion: "Costo por agregar producto de servicio local",
    activo: true,
  }).onConflictDoNothing();
  console.log("✅ Configuración de cobros creada");

  console.log("\n🎉 Seed de Servicios Locales completado exitosamente!");
}

seedServiciosLocales()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  });
