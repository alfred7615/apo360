import { db } from "./db";
import { usuarios } from "@shared/schema";
import { sql } from "drizzle-orm";
import * as crypto from "crypto";

const nuevosUsuarios = [
  // 3 Administradores de segundo nivel (bomberos, policía, taxi)
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
    alias: "jhuanca_bomberos"
  },
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
    id: "admin-taxi-001",
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
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/28.jpg",
    alias: "mapaza_taxi"
  },

  // 2 usuarios con rol "usuario"
  {
    id: "usuario-normal-001",
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
    nivelUsuario: 3,
    profileImageUrl: "https://randomuser.me/api/portraits/women/33.jpg",
    alias: "ana_ticona"
  },
  {
    id: "usuario-normal-002",
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
    nivelUsuario: 2,
    profileImageUrl: "https://randomuser.me/api/portraits/men/47.jpg",
    alias: "pedro_ccama"
  },

  // 2 usuarios con rol "serenazgo"
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

  // 2 usuarios con rol "samu" (emergencias médicas)
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
    dni: "12345678",
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

  // 1 usuario adicional con rol "bombero" (total 2 bomberos)
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
  }
];

async function insertarNuevosUsuarios() {
  console.log("🚀 Insertando 10 nuevos usuarios con datos realistas...\n");
  
  let insertados = 0;
  let existentes = 0;
  
  for (const usuario of nuevosUsuarios) {
    try {
      const existente = await db.select().from(usuarios).where(sql`id = ${usuario.id}`);
      
      if (existente.length > 0) {
        console.log(`⏭️ Usuario ${usuario.firstName} ${usuario.lastName} (${usuario.rol}) ya existe`);
        existentes++;
        continue;
      }
      
      const passwordHash = crypto.createHash('sha256').update('Tacna2025!').digest('hex');
      
      await db.insert(usuarios).values({
        ...usuario,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log(`✅ ${usuario.firstName} ${usuario.lastName} - ${usuario.rol.toUpperCase()} - ${usuario.email}`);
      insertados++;
    } catch (error) {
      console.error(`❌ Error con ${usuario.email}:`, error);
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`   - Nuevos insertados: ${insertados}`);
  console.log(`   - Ya existentes: ${existentes}`);
  console.log(`   - Total procesados: ${nuevosUsuarios.length}`);
  console.log(`\n🔑 Contraseña para todos: Tacna2025!`);
}

insertarNuevosUsuarios()
  .then(() => {
    console.log("\n✅ Proceso completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
