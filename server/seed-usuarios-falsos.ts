import { db } from "./db";
import { usuarios } from "@shared/schema";
import { sql } from "drizzle-orm";

const usuariosFalsos = [
  // 3 Administradores secundarios (vendedores de local)
  {
    id: "fake-admin-local-001",
    nombre: "María Elena Torres",
    email: "maria.torres@tacnafm.com",
    firstName: "María Elena",
    lastName: "Torres Quispe",
    telefono: "+51 952 341 567",
    dni: "45678912",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. Bolognesi 456",
    gpsLatitud: -18.0146,
    gpsLongitud: -70.2536,
    nombreLocal: "Tienda La Estrella",
    ruc: "20567891234",
    direccionLocal: "Av. Bolognesi 456, Centro de Tacna",
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/women/45.jpg"
  },
  {
    id: "fake-admin-local-002",
    nombre: "Carlos Alberto Mendoza",
    email: "carlos.mendoza@tacnafm.com",
    firstName: "Carlos Alberto",
    lastName: "Mendoza Vargas",
    telefono: "+51 987 654 321",
    dni: "78912345",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "Intiorko",
    direccion: "Calle Los Jazmines 123",
    gpsLatitud: -18.0056,
    gpsLongitud: -70.2410,
    nombreLocal: "Restaurante El Sabor Tacneño",
    ruc: "20891234567",
    direccionLocal: "Calle Los Jazmines 123, Alto de la Alianza",
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    id: "fake-admin-local-003",
    nombre: "Rosa María Flores",
    email: "rosa.flores@tacnafm.com",
    firstName: "Rosa María",
    lastName: "Flores Huanca",
    telefono: "+51 963 852 741",
    dni: "32145678",
    rol: "local",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Ciudad Nueva",
    sector: "La Esperanza",
    direccion: "Jr. Tacna 890",
    gpsLatitud: -18.0230,
    gpsLongitud: -70.2480,
    nombreLocal: "Farmacia Salud Total",
    ruc: "20345678901",
    direccionLocal: "Jr. Tacna 890, Ciudad Nueva",
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/women/68.jpg"
  },

  // 4 Taxistas
  {
    id: "fake-taxista-001",
    nombre: "Juan Pedro Mamani",
    email: "juan.mamani@taxi.tacnafm.com",
    firstName: "Juan Pedro",
    lastName: "Mamani Condori",
    telefono: "+51 945 123 789",
    dni: "56789123",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Centro",
    direccion: "Av. San Martín 234",
    gpsLatitud: -18.0140,
    gpsLongitud: -70.2520,
    modoTaxi: "conductor",
    tipoVehiculo: "auto",
    vehiculoModelo: "Toyota Yaris 2020",
    vehiculoPlaca: "TNA-456",
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/55.jpg"
  },
  {
    id: "fake-taxista-002",
    nombre: "Roberto Carlos Silva",
    email: "roberto.silva@taxi.tacnafm.com",
    firstName: "Roberto Carlos",
    lastName: "Silva Apaza",
    telefono: "+51 978 456 123",
    dni: "89123456",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Gregorio Albarracín",
    sector: "PROMUVI",
    direccion: "Calle Los Olivos 567",
    gpsLatitud: -18.0350,
    gpsLongitud: -70.2380,
    modoTaxi: "conductor",
    tipoVehiculo: "auto",
    vehiculoModelo: "Hyundai Accent 2019",
    vehiculoPlaca: "TNA-789",
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/22.jpg"
  },
  {
    id: "fake-taxista-003",
    nombre: "Miguel Ángel Quispe",
    email: "miguel.quispe@taxi.tacnafm.com",
    firstName: "Miguel Ángel",
    lastName: "Quispe Ramos",
    telefono: "+51 912 789 456",
    dni: "23456789",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Coronel Gregorio Albarracín",
    sector: "Villa El Salvador",
    direccion: "Av. Municipal 789",
    gpsLatitud: -18.0420,
    gpsLongitud: -70.2290,
    modoTaxi: "conductor",
    tipoVehiculo: "auto",
    vehiculoModelo: "Kia Rio 2021",
    vehiculoPlaca: "TNA-321",
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/41.jpg"
  },
  {
    id: "fake-taxista-004",
    nombre: "Luis Fernando Vargas",
    email: "luis.vargas@taxi.tacnafm.com",
    firstName: "Luis Fernando",
    lastName: "Vargas Choque",
    telefono: "+51 934 567 890",
    dni: "67891234",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Pocollay",
    sector: "Micaela Bastidas",
    direccion: "Calle Grau 456",
    gpsLatitud: -18.0050,
    gpsLongitud: -70.2350,
    modoTaxi: "conductor",
    tipoVehiculo: "camioneta",
    vehiculoModelo: "Toyota Hilux 2018",
    vehiculoPlaca: "TNA-654",
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/67.jpg"
  },

  // 2 Mudanzas
  {
    id: "fake-mudanza-001",
    nombre: "Jorge Luis Cáceres",
    email: "jorge.caceres@mudanzas.tacnafm.com",
    firstName: "Jorge Luis",
    lastName: "Cáceres Ticona",
    telefono: "+51 956 234 567",
    dni: "34567891",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "La Natividad",
    direccion: "Av. Internacional 1234",
    gpsLatitud: -18.0080,
    gpsLongitud: -70.2400,
    modoTaxi: "conductor",
    tipoVehiculo: "camion",
    vehiculoModelo: "Hyundai HD78 2017",
    vehiculoPlaca: "TNA-987",
    nombreLocal: "Mudanzas Cáceres Express",
    ruc: "10345678901",
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/men/78.jpg"
  },
  {
    id: "fake-mudanza-002",
    nombre: "Pedro Antonio Ramos",
    email: "pedro.ramos@mudanzas.tacnafm.com",
    firstName: "Pedro Antonio",
    lastName: "Ramos Huanca",
    telefono: "+51 923 678 901",
    dni: "91234567",
    rol: "conductor",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Ciudad Nueva",
    sector: "Miguel Grau",
    direccion: "Jr. Bolívar 567",
    gpsLatitud: -18.0190,
    gpsLongitud: -70.2510,
    modoTaxi: "conductor",
    tipoVehiculo: "camion",
    vehiculoModelo: "JMC N900 2019",
    vehiculoPlaca: "TNA-147",
    nombreLocal: "Transportes Ramos",
    ruc: "10891234567",
    nivelUsuario: 5,
    profileImageUrl: "https://randomuser.me/api/portraits/men/89.jpg"
  },

  // 2 Policía
  {
    id: "fake-policia-001",
    nombre: "Cap. José Manuel Díaz",
    email: "jose.diaz@pnp.tacna.gob.pe",
    firstName: "José Manuel",
    lastName: "Díaz Huarachi",
    telefono: "+51 940 111 222",
    dni: "12378945",
    rol: "policia",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Comisaría Central",
    direccion: "Av. Dos de Mayo 456, Comisaría de Tacna",
    gpsLatitud: -18.0135,
    gpsLongitud: -70.2545,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/35.jpg"
  },
  {
    id: "fake-policia-002",
    nombre: "Tte. Carmen Rosa Velásquez",
    email: "carmen.velasquez@pnp.tacna.gob.pe",
    firstName: "Carmen Rosa",
    lastName: "Velásquez Pari",
    telefono: "+51 940 333 444",
    dni: "45612378",
    rol: "policia",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "Comisaría Alto de la Alianza",
    direccion: "Av. Jorge Basadre 789",
    gpsLatitud: -18.0072,
    gpsLongitud: -70.2420,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/29.jpg"
  },

  // 2 Bomberos
  {
    id: "fake-bombero-001",
    nombre: "Brig. Víctor Hugo Ponce",
    email: "victor.ponce@bomberos.tacna.gob.pe",
    firstName: "Víctor Hugo",
    lastName: "Ponce Medina",
    telefono: "+51 941 555 666",
    dni: "78945612",
    rol: "bombero",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Estación de Bomberos Central",
    direccion: "Av. Hipólito Unanue 234, Estación Bomberos",
    gpsLatitud: -18.0120,
    gpsLongitud: -70.2558,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/47.jpg"
  },
  {
    id: "fake-bombero-002",
    nombre: "Sbte. Ana Lucía Fernández",
    email: "ana.fernandez@bomberos.tacna.gob.pe",
    firstName: "Ana Lucía",
    lastName: "Fernández Chura",
    telefono: "+51 941 777 888",
    dni: "12345891",
    rol: "bombero",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Gregorio Albarracín",
    sector: "Compañía de Bomberos N° 2",
    direccion: "Av. Municipal 567, Estación Bomberos Sur",
    gpsLatitud: -18.0380,
    gpsLongitud: -70.2350,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/52.jpg"
  },

  // 2 Serenazgo (diferentes municipalidades)
  {
    id: "fake-serenazgo-001",
    nombre: "Sgto. Marco Antonio Castro",
    email: "marco.castro@munitacna.gob.pe",
    firstName: "Marco Antonio",
    lastName: "Castro Quispe",
    telefono: "+51 942 999 000",
    dni: "56781234",
    rol: "serenazgo",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Tacna",
    sector: "Central de Serenazgo Municipal",
    direccion: "Av. San Martín 890, Municipalidad de Tacna",
    gpsLatitud: -18.0138,
    gpsLongitud: -70.2532,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/men/63.jpg"
  },
  {
    id: "fake-serenazgo-002",
    nombre: "Sgto. Patricia Elena Vargas",
    email: "patricia.vargas@munialtoalianza.gob.pe",
    firstName: "Patricia Elena",
    lastName: "Vargas Cohaila",
    telefono: "+51 942 111 222",
    dni: "89123567",
    rol: "serenazgo",
    estado: "activo",
    pais: "Perú",
    departamento: "Tacna",
    distrito: "Alto de la Alianza",
    sector: "Base Serenazgo Alto de la Alianza",
    direccion: "Av. Ejercito 456, Municipalidad Alto de la Alianza",
    gpsLatitud: -18.0068,
    gpsLongitud: -70.2415,
    nivelUsuario: 4,
    profileImageUrl: "https://randomuser.me/api/portraits/women/38.jpg"
  }
];

async function seedUsuariosFalsos() {
  console.log("🌱 Iniciando seed de usuarios falsos...");
  
  for (const usuario of usuariosFalsos) {
    try {
      const existente = await db.select().from(usuarios).where(sql`${usuarios.id} = ${usuario.id}`);
      
      if (existente.length === 0) {
        await db.insert(usuarios).values({
          ...usuario,
          activo: true,
          enLinea: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);
        console.log(`✅ Usuario creado: ${usuario.nombre} (${usuario.rol})`);
      } else {
        console.log(`⏭️ Usuario ya existe: ${usuario.nombre}`);
      }
    } catch (error: any) {
      console.error(`❌ Error creando ${usuario.nombre}:`, error.message);
    }
  }
  
  console.log("🎉 Seed de usuarios falsos completado!");
}

seedUsuariosFalsos()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exit(1);
  });
