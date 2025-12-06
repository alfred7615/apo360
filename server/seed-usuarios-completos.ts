import { db } from "./db";
import { usuarios } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as crypto from "crypto";

const todosLosUsuarios = [
  // =========================================
  // SUPER ADMINISTRADOR
  // =========================================
  {
    id: "super-admin-001",
    email: "admin@apo360.net",
    firstName: "Carlos Alberto",
    lastName: "Mendoza Ramos",
    telefono: "+51 952 100 001",
    dni: "10234567",
    rol: "super_admin",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro Cívico",
    direccion: "Plaza de Armas 100",
    gpsLatitud: -18.0146,
    gpsLongitud: -70.2505,
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
    alias: "superadmin"
  },

  // =========================================
  // ADMINISTRADORES DE SEGUNDO NIVEL
  // =========================================
  {
    id: "admin-bomberos-001",
    email: "javier.huanca@bomberos.tacna.pe",
    firstName: "Javier",
    lastName: "Huanca Quispe",
    telefono: "+51 952 789 123",
    dni: "42567891",
    rol: "bombero",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. Coronel Mendoza 567",
    gpsLatitud: -18.0134,
    gpsLongitud: -70.2498,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/61.jpg",
    alias: "jhuanca_bomb"
  },
  {
    id: "bombero-002",
    email: "maria.quispe@bomberos.tacna.pe",
    firstName: "María Eugenia",
    lastName: "Quispe Huanca",
    telefono: "+51 967 891 234",
    dni: "23456789",
    rol: "bombero",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Ciudad Nueva",
    sector: "La Esperanza",
    direccion: "Av. Jorge Basadre 678",
    gpsLatitud: -18.0234,
    gpsLongitud: -70.2489,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/48.jpg",
    alias: "mquispe_bomb"
  },

  // =========================================
  // POLICÍA
  // =========================================
  {
    id: "admin-policia-001",
    email: "roberto.vargas@pnp.tacna.pe",
    firstName: "Roberto",
    lastName: "Vargas Condori",
    telefono: "+51 963 852 147",
    dni: "35789123",
    rol: "policia",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Jr. Zela 234",
    gpsLatitud: -18.0156,
    gpsLongitud: -70.2512,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/41.jpg",
    alias: "rvargas_pnp"
  },
  {
    id: "policia-002",
    email: "elena.mamani@pnp.tacna.pe",
    firstName: "Elena Patricia",
    lastName: "Mamani Chura",
    telefono: "+51 974 123 456",
    dni: "45678912",
    rol: "policia",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "Intiorko",
    direccion: "Av. Tarata 456",
    gpsLatitud: -18.0078,
    gpsLongitud: -70.2434,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/41.jpg",
    alias: "emamani_pnp"
  },

  // =========================================
  // SERENAZGO
  // =========================================
  {
    id: "serenazgo-001",
    email: "walter.calisaya@serenazgo.tacna.pe",
    firstName: "Walter",
    lastName: "Calisaya Poma",
    telefono: "+51 923 456 789",
    dni: "78912345",
    rol: "serenazgo",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. Bolognesi 890",
    gpsLatitud: -18.0145,
    gpsLongitud: -70.2534,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/52.jpg",
    alias: "wcalisaya_seren"
  },
  {
    id: "serenazgo-002",
    email: "luis.ramos@serenazgo.tacna.pe",
    firstName: "Luis Fernando",
    lastName: "Ramos Choque",
    telefono: "+51 934 567 891",
    dni: "89123456",
    rol: "serenazgo",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Gregorio Albarracín",
    sector: "PROMUVI",
    direccion: "Calle Los Álamos 234",
    gpsLatitud: -18.0356,
    gpsLongitud: -70.2389,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/58.jpg",
    alias: "lramos_seren"
  },

  // =========================================
  // SAMU (Emergencias Médicas)
  // =========================================
  {
    id: "samu-001",
    email: "carmen.laura@samu.tacna.pe",
    firstName: "Carmen Rosa",
    lastName: "Laura Vilca",
    telefono: "+51 945 678 912",
    dni: "91234567",
    rol: "samu",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. Hipólito Unanue 345",
    gpsLatitud: -18.0178,
    gpsLongitud: -70.2467,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/56.jpg",
    alias: "claura_samu"
  },
  {
    id: "samu-002",
    email: "jorge.nina@samu.tacna.pe",
    firstName: "Jorge Antonio",
    lastName: "Nina Ticona",
    telefono: "+51 956 789 123",
    dni: "12345679",
    rol: "samu",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "Juan Velasco",
    direccion: "Jr. Cusco 567",
    gpsLatitud: -18.0089,
    gpsLongitud: -70.2398,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/36.jpg",
    alias: "jnina_samu"
  },

  // =========================================
  // CONDUCTORES DE TAXI
  // =========================================
  {
    id: "conductor-taxi-001",
    email: "miguel.apaza@taxitacna.com",
    firstName: "Miguel Ángel",
    lastName: "Apaza Torres",
    telefono: "+51 945 678 234",
    dni: "48123567",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Gregorio Albarracín",
    sector: "La Esperanza",
    direccion: "Calle Los Pinos 789",
    gpsLatitud: -18.0345,
    gpsLongitud: -70.2367,
    modoTaxi: "conductor",
    vehiculoModelo: "Chevrolet Aveo 2021",
    vehiculoPlaca: "TNA-234",
    disponibleTaxi: true,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/28.jpg",
    alias: "mapaza_taxi"
  },
  {
    id: "conductor-taxi-002",
    email: "fernando.choque@gmail.com",
    firstName: "Fernando José",
    lastName: "Choque Vilca",
    telefono: "+51 956 234 567",
    dni: "56789012",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Ciudad Nueva",
    sector: "San Martín",
    direccion: "Av. Municipal 234",
    gpsLatitud: -18.0267,
    gpsLongitud: -70.2445,
    modoTaxi: "conductor",
    vehiculoModelo: "Toyota Yaris 2022",
    vehiculoPlaca: "TNA-567",
    disponibleTaxi: true,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/33.jpg",
    alias: "fchoque_taxi"
  },
  {
    id: "conductor-taxi-003",
    email: "rosa.gutierrez@hotmail.com",
    firstName: "Rosa Elvira",
    lastName: "Gutiérrez Paco",
    telefono: "+51 967 345 678",
    dni: "67890123",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Leoncio Prado",
    direccion: "Jr. Ayacucho 567",
    gpsLatitud: -18.0189,
    gpsLongitud: -70.2478,
    modoTaxi: "conductor",
    vehiculoModelo: "Hyundai Accent 2020",
    vehiculoPlaca: "TNA-890",
    disponibleTaxi: true,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/29.jpg",
    alias: "rgutierrez_taxi"
  },

  // =========================================
  // PASAJEROS (USUARIOS NORMALES)
  // =========================================
  {
    id: "usuario-pasajero-001",
    email: "ana.ticona@gmail.com",
    firstName: "Ana María",
    lastName: "Ticona Flores",
    telefono: "+51 978 234 567",
    dni: "56123789",
    rol: "usuario",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Ciudad Nueva",
    sector: "San Antonio",
    direccion: "Av. Internacional 456",
    gpsLatitud: -18.0245,
    gpsLongitud: -70.2456,
    modoTaxi: "pasajero",
    nivelUsuario: 3,
    profileImageUrl: "https://randomuser.me/api/portraits/women/33.jpg",
    alias: "ana_ticona"
  },
  {
    id: "usuario-pasajero-002",
    email: "pedro.ccama@hotmail.com",
    firstName: "Pedro Luis",
    lastName: "Ccama Mamani",
    telefono: "+51 912 345 678",
    dni: "67891234",
    rol: "usuario",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "Intiorko",
    direccion: "Jr. Ayacucho 123",
    gpsLatitud: -18.0067,
    gpsLongitud: -70.2423,
    modoTaxi: "pasajero",
    nivelUsuario: 2,
    profileImageUrl: "https://randomuser.me/api/portraits/men/47.jpg",
    alias: "pedro_ccama"
  },
  {
    id: "usuario-pasajero-003",
    email: "lucia.mamani@gmail.com",
    firstName: "Lucía Esperanza",
    lastName: "Mamani Condori",
    telefono: "+51 923 567 890",
    dni: "78901234",
    rol: "usuario",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Gregorio Albarracín",
    sector: "Vista Hermosa",
    direccion: "Calle Los Rosales 345",
    gpsLatitud: -18.0378,
    gpsLongitud: -70.2356,
    modoTaxi: "pasajero",
    nivelUsuario: 3,
    profileImageUrl: "https://randomuser.me/api/portraits/women/22.jpg",
    alias: "lucia_mamani"
  },

  // =========================================
  // COMERCIOS LOCALES
  // =========================================
  {
    id: "local-001",
    email: "bodega.tacna@gmail.com",
    firstName: "José Armando",
    lastName: "Pinto Calderón",
    telefono: "+51 945 789 012",
    dni: "34567890",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Jr. San Martín 456",
    gpsLatitud: -18.0167,
    gpsLongitud: -70.2489,
    nombreLocal: "Bodega Don José",
    categoriaLocal: "Abarrotes",
    direccionLocal: "Jr. San Martín 456, Centro - Tacna",
    descripcionLocal: "Abarrotes, bebidas, golosinas y productos de primera necesidad. Atención de 7am a 10pm.",
    gpsLocalLatitud: -18.0167,
    gpsLocalLongitud: -70.2489,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/55.jpg",
    alias: "bodega_donjose"
  },
  {
    id: "local-002",
    email: "farmacia.salud@gmail.com",
    firstName: "Silvia Beatriz",
    lastName: "Ramos Huanca",
    telefono: "+51 956 890 123",
    dni: "45678901",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Ciudad Nueva",
    sector: "San Martín",
    direccion: "Av. Municipal 789",
    gpsLatitud: -18.0256,
    gpsLongitud: -70.2434,
    nombreLocal: "Farmacia Salud Total",
    categoriaLocal: "Farmacia",
    direccionLocal: "Av. Municipal 789, San Martín - Ciudad Nueva",
    descripcionLocal: "Medicamentos, productos de higiene personal y atención farmacéutica. Delivery disponible.",
    gpsLocalLatitud: -18.0256,
    gpsLocalLongitud: -70.2434,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/45.jpg",
    alias: "farma_salud"
  },
  {
    id: "local-003",
    email: "restaurant.sabor@gmail.com",
    firstName: "Ricardo Martín",
    lastName: "Flores Quispe",
    telefono: "+51 967 901 234",
    dni: "56789012",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Bolognesi",
    direccion: "Av. Bolognesi 1234",
    gpsLatitud: -18.0145,
    gpsLongitud: -70.2523,
    nombreLocal: "Restaurant El Sabor Tacneño",
    categoriaLocal: "Restaurante",
    direccionLocal: "Av. Bolognesi 1234, Centro - Tacna",
    descripcionLocal: "Comida típica tacneña, almuerzos ejecutivos y platos a la carta. Capacidad para 50 personas.",
    ruc: "20123456789",
    gpsLocalLatitud: -18.0145,
    gpsLocalLongitud: -70.2523,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/42.jpg",
    alias: "sabor_tacneno"
  },
  {
    id: "local-004",
    email: "delivery.rapido@gmail.com",
    firstName: "Karen Yolanda",
    lastName: "Vilca Torres",
    telefono: "+51 978 012 345",
    dni: "67890123",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Gregorio Albarracín",
    sector: "La Esperanza",
    direccion: "Calle Los Cedros 567",
    gpsLatitud: -18.0367,
    gpsLongitud: -70.2378,
    nombreLocal: "Delivery Express Tacna",
    categoriaLocal: "Delivery",
    direccionLocal: "Calle Los Cedros 567, La Esperanza - G. Albarracín",
    descripcionLocal: "Servicio de delivery de cualquier producto en Tacna. Pedidos por WhatsApp y app.",
    gpsLocalLatitud: -18.0367,
    gpsLocalLongitud: -70.2378,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/38.jpg",
    alias: "delivery_express"
  },

  // =========================================
  // CAMBISTAS (CASAS DE CAMBIO)
  // =========================================
  {
    id: "cambista-001",
    email: "cambio.sol@gmail.com",
    firstName: "Eduardo César",
    lastName: "Alanoca Mamani",
    telefono: "+51 989 123 456",
    dni: "78901234",
    rol: "cambista",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Jr. Zela 567",
    gpsLatitud: -18.0156,
    gpsLongitud: -70.2501,
    nombreLocal: "Casa de Cambio Sol y Luna",
    categoriaLocal: "Casa de Cambio",
    direccionLocal: "Jr. Zela 567, Centro - Tacna",
    descripcionLocal: "Cambio de dólares, soles, pesos chilenos, bolivianos. Las mejores tasas de Tacna.",
    gpsLocalLatitud: -18.0156,
    gpsLocalLongitud: -70.2501,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/49.jpg",
    alias: "cambio_sol"
  },

  // =========================================
  // ADMINISTRADORES ESPECIALIZADOS
  // =========================================
  {
    id: "admin-publicidad-001",
    email: "publicidad@apo360.net",
    firstName: "Vanessa Patricia",
    lastName: "Condori Ramos",
    telefono: "+51 990 234 567",
    dni: "89012345",
    rol: "admin_publicidad",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. Bolognesi 890",
    gpsLatitud: -18.0148,
    gpsLongitud: -70.2515,
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/women/31.jpg",
    alias: "admin_publicidad"
  },
  {
    id: "admin-radio-001",
    email: "radio@apo360.net",
    firstName: "Mauricio Andrés",
    lastName: "Ticona Vilca",
    telefono: "+51 991 345 678",
    dni: "90123456",
    rol: "admin_radio",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Jr. Bolívar 234",
    gpsLatitud: -18.0152,
    gpsLongitud: -70.2508,
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/men/44.jpg",
    alias: "admin_radio"
  },
  {
    id: "admin-cartera-001",
    email: "cartera@apo360.net",
    firstName: "Gloria Esperanza",
    lastName: "Huanca Pinto",
    telefono: "+51 992 456 789",
    dni: "01234567",
    rol: "admin_cartera",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Jr. Deustua 456",
    gpsLatitud: -18.0158,
    gpsLongitud: -70.2498,
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/women/35.jpg",
    alias: "admin_cartera"
  },
  {
    id: "admin-operaciones-001",
    email: "operaciones@apo360.net",
    firstName: "Hernán Alberto",
    lastName: "Ccama Torres",
    telefono: "+51 993 567 890",
    dni: "12345670",
    rol: "admin_operaciones",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. Hipólito Unanue 678",
    gpsLatitud: -18.0163,
    gpsLongitud: -70.2495,
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/men/51.jpg",
    alias: "admin_operaciones"
  },
  {
    id: "supervisor-001",
    email: "supervisor@apo360.net",
    firstName: "Patricia Carmen",
    lastName: "Vilca Choque",
    telefono: "+51 994 678 901",
    dni: "23456701",
    rol: "supervisor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Jr. Bolívar 567",
    gpsLatitud: -18.0155,
    gpsLongitud: -70.2502,
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/women/40.jpg",
    alias: "supervisor_paty"
  }
];

async function insertarUsuariosCompletos() {
  console.log("🚀 Insertando usuarios de prueba con todos los roles...\n");
  console.log("━".repeat(70));
  
  let insertados = 0;
  let existentes = 0;
  
  const resumenPorRol: Record<string, string[]> = {};
  
  for (const usuario of todosLosUsuarios) {
    try {
      const existente = await db.select().from(usuarios).where(sql`id = ${usuario.id}`);
      
      if (existente.length > 0) {
        console.log(`⏭️  Ya existe: ${usuario.firstName} ${usuario.lastName} (${usuario.rol})`);
        existentes++;
        continue;
      }
      
      const passwordHash = crypto.createHash('sha256').update('Tacna2025!').digest('hex');
      
      await db.insert(usuarios).values({
        ...usuario,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      
      if (!resumenPorRol[usuario.rol]) {
        resumenPorRol[usuario.rol] = [];
      }
      resumenPorRol[usuario.rol].push(`${usuario.email}`);
      
      console.log(`✅ ${usuario.firstName} ${usuario.lastName} - ${usuario.rol.toUpperCase()}`);
      insertados++;
    } catch (error) {
      console.error(`❌ Error con ${usuario.email}:`, error);
    }
  }
  
  console.log("\n" + "━".repeat(70));
  console.log("\n📊 RESUMEN DE USUARIOS CREADOS:");
  console.log("━".repeat(70));
  
  console.log(`
┌──────────────────────────────────────────────────────────────────────┐
│  🔐 CREDENCIALES DE ACCESO - TODOS LOS USUARIOS                     │
│  Contraseña universal: Tacna2025!                                    │
└──────────────────────────────────────────────────────────────────────┘
`);
  
  console.log("\n📋 LISTADO COMPLETO POR ROL:\n");
  
  const rolesOrdenados = [
    'super_admin',
    'admin_publicidad', 
    'admin_radio',
    'admin_cartera',
    'admin_operaciones',
    'supervisor',
    'bombero',
    'policia',
    'serenazgo',
    'samu',
    'conductor',
    'local',
    'cambista',
    'usuario'
  ];
  
  for (const rol of rolesOrdenados) {
    const usuariosRol = todosLosUsuarios.filter(u => u.rol === rol);
    if (usuariosRol.length === 0) continue;
    
    console.log(`\n🏷️  ${rol.toUpperCase()} (${usuariosRol.length}):`);
    console.log("─".repeat(50));
    
    for (const u of usuariosRol) {
      console.log(`   📧 ${u.email}`);
      console.log(`      👤 ${u.firstName} ${u.lastName}`);
      console.log(`      📱 ${u.telefono}`);
      if (u.nombreLocal) {
        console.log(`      🏪 ${u.nombreLocal}`);
      }
      if (u.vehiculoModelo) {
        console.log(`      🚗 ${u.vehiculoModelo} (${u.vehiculoPlaca})`);
      }
      console.log("");
    }
  }
  
  console.log("\n" + "━".repeat(70));
  console.log(`\n📈 ESTADÍSTICAS:`);
  console.log(`   - Usuarios nuevos insertados: ${insertados}`);
  console.log(`   - Usuarios ya existentes: ${existentes}`);
  console.log(`   - Total procesados: ${todosLosUsuarios.length}`);
  console.log("\n🔑 CONTRASEÑA PARA TODOS: Tacna2025!");
  console.log("━".repeat(70));
}

insertarUsuariosCompletos()
  .then(() => {
    console.log("\n✅ Proceso completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
