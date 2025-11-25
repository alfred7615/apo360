import { db } from "./db";
import { usuarios, encuestas, popupsPublicitarios } from "@shared/schema";

export async function seedEncuestasYPopups() {
  console.log("🌱 Insertando datos de prueba para encuestas y popups...");

  try {
    // Insertar 23 usuarios falsos
    const usuariosFake = [
      { id: 'user-fake-001', email: 'maria.garcia@gmail.com', firstName: 'María', lastName: 'García Rodríguez', telefono: '952345678', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/1.jpg' },
      { id: 'user-fake-002', email: 'juan.perez@gmail.com', firstName: 'Juan Carlos', lastName: 'Pérez Luna', telefono: '953456789', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/1.jpg' },
      { id: 'user-fake-003', email: 'ana.martinez@gmail.com', firstName: 'Ana María', lastName: 'Martínez Quispe', telefono: '954567890', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/2.jpg' },
      { id: 'user-fake-004', email: 'carlos.lopez@gmail.com', firstName: 'Carlos', lastName: 'López Mendoza', telefono: '955678901', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/2.jpg' },
      { id: 'user-fake-005', email: 'rosa.fernandez@gmail.com', firstName: 'Rosa Elena', lastName: 'Fernández Ticona', telefono: '956789012', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/3.jpg' },
      { id: 'user-fake-006', email: 'pedro.sanchez@gmail.com', firstName: 'Pedro', lastName: 'Sánchez Mamani', telefono: '957890123', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/3.jpg' },
      { id: 'user-fake-007', email: 'lucia.morales@gmail.com', firstName: 'Lucía', lastName: 'Morales Choque', telefono: '958901234', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/4.jpg' },
      { id: 'user-fake-008', email: 'miguel.torres@gmail.com', firstName: 'Miguel Ángel', lastName: 'Torres Flores', telefono: '959012345', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/4.jpg' },
      { id: 'user-fake-009', email: 'carmen.vargas@gmail.com', firstName: 'Carmen', lastName: 'Vargas Condori', telefono: '951234567', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/5.jpg' },
      { id: 'user-fake-010', email: 'roberto.ramirez@gmail.com', firstName: 'Roberto', lastName: 'Ramírez Apaza', telefono: '952345670', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/5.jpg' },
      { id: 'user-fake-011', email: 'patricia.gomez@gmail.com', firstName: 'Patricia', lastName: 'Gómez Huanca', telefono: '953456780', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/6.jpg' },
      { id: 'user-fake-012', email: 'fernando.diaz@gmail.com', firstName: 'Fernando', lastName: 'Díaz Poma', telefono: '954567891', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/6.jpg' },
      { id: 'user-fake-013', email: 'elena.ruiz@gmail.com', firstName: 'Elena', lastName: 'Ruiz Chambi', telefono: '955678902', rol: 'conductor', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/7.jpg' },
      { id: 'user-fake-014', email: 'jorge.herrera@gmail.com', firstName: 'Jorge Luis', lastName: 'Herrera Ccama', telefono: '956789013', rol: 'conductor', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/7.jpg' },
      { id: 'user-fake-015', email: 'sofia.castro@gmail.com', firstName: 'Sofía', lastName: 'Castro Laura', telefono: '957890124', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/8.jpg' },
      { id: 'user-fake-016', email: 'antonio.reyes@gmail.com', firstName: 'Antonio', lastName: 'Reyes Calisaya', telefono: '958901235', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/8.jpg' },
      { id: 'user-fake-017', email: 'isabel.rivera@gmail.com', firstName: 'Isabel', lastName: 'Rivera Nina', telefono: '959012346', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/9.jpg' },
      { id: 'user-fake-018', email: 'david.ortiz@gmail.com', firstName: 'David', lastName: 'Ortiz Quispe', telefono: '951234568', rol: 'local', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/9.jpg' },
      { id: 'user-fake-019', email: 'gabriela.jimenez@gmail.com', firstName: 'Gabriela', lastName: 'Jiménez Marca', telefono: '952345679', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/10.jpg' },
      { id: 'user-fake-020', email: 'raul.silva@gmail.com', firstName: 'Raúl', lastName: 'Silva Catacora', telefono: '953456781', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/10.jpg' },
      { id: 'user-fake-021', email: 'beatriz.mendez@gmail.com', firstName: 'Beatriz', lastName: 'Méndez Chipana', telefono: '954567892', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/11.jpg' },
      { id: 'user-fake-022', email: 'oscar.gonzalez@gmail.com', firstName: 'Oscar', lastName: 'González Huayhua', telefono: '955678903', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/men/11.jpg' },
      { id: 'user-fake-023', email: 'adriana.vega@gmail.com', firstName: 'Adriana', lastName: 'Vega Ticahuanca', telefono: '956789014', rol: 'usuario', estado: 'activo', profileImageUrl: 'https://randomuser.me/api/portraits/women/12.jpg' },
    ];

    for (const usuario of usuariosFake) {
      await db.insert(usuarios).values(usuario).onConflictDoNothing();
    }
    console.log("✅ 23 usuarios de prueba insertados");

    // Insertar 5 encuestas de prueba
    const encuestasPrueba = [
      {
        id: crypto.randomUUID(),
        titulo: 'Encuesta de Seguridad Ciudadana 2025',
        descripcion: 'Ayúdanos a conocer tu percepción sobre la seguridad en Tacna',
        preguntas: [
          { pregunta: '¿Qué tan seguro te sientes caminando en tu barrio de noche?', opciones: ['Muy seguro', 'Seguro', 'Poco seguro', 'Nada seguro'] },
          { pregunta: '¿Has sido víctima de algún delito en los últimos 6 meses?', opciones: ['Sí', 'No'] },
          { pregunta: '¿Qué tipo de delito considera más frecuente en su zona?', opciones: ['Robo al paso', 'Asalto', 'Hurto de vehículos', 'Otros'] }
        ],
        imagenUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400',
        estado: 'activa',
        fechaInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalRespuestas: 45,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Satisfacción con Servicios de Taxi',
        descripcion: 'Evalúa la calidad del servicio de taxi en nuestra comunidad',
        preguntas: [
          { pregunta: '¿Con qué frecuencia usas el servicio de taxi?', opciones: ['Diariamente', 'Semanalmente', 'Mensualmente', 'Raramente'] },
          { pregunta: '¿Cómo calificarías la puntualidad de los conductores?', opciones: ['Excelente', 'Buena', 'Regular', 'Mala'] },
          { pregunta: '¿Recomendarías nuestro servicio de taxi?', opciones: ['Definitivamente sí', 'Probablemente sí', 'Probablemente no', 'Definitivamente no'] }
        ],
        imagenUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400',
        estado: 'activa',
        fechaInicio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        totalRespuestas: 78,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Mejoras para el Comercio Local',
        descripcion: 'Tu opinión nos ayuda a mejorar el comercio en Tacna',
        preguntas: [
          { pregunta: '¿Qué tipo de negocios te gustaría ver más en tu zona?', opciones: ['Restaurantes', 'Tiendas de ropa', 'Servicios de salud', 'Entretenimiento'] },
          { pregunta: '¿Prefieres comprar en tiendas locales o centros comerciales?', opciones: ['Tiendas locales', 'Centros comerciales', 'Ambos por igual', 'Compras online'] }
        ],
        imagenUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        estado: 'activa',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        totalRespuestas: 32,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Transporte Público en Tacna',
        descripcion: 'Ayúdanos a mejorar el sistema de transporte público',
        preguntas: [
          { pregunta: '¿Cuál es tu principal medio de transporte?', opciones: ['Bus', 'Taxi', 'Mototaxi', 'Vehículo propio', 'Caminar'] },
          { pregunta: '¿Qué mejorarías del transporte público?', opciones: ['Frecuencia', 'Limpieza', 'Seguridad', 'Rutas', 'Precios'] },
          { pregunta: '¿Cuánto tiempo esperas normalmente el bus?', opciones: ['Menos de 5 min', '5-10 min', '10-20 min', 'Más de 20 min'] }
        ],
        imagenUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
        estado: 'activa',
        fechaInicio: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        totalRespuestas: 156,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Eventos Culturales 2025',
        descripcion: 'Cuéntanos qué eventos te gustaría ver en Tacna',
        preguntas: [
          { pregunta: '¿Qué tipo de eventos culturales prefieres?', opciones: ['Conciertos', 'Ferias gastronómicas', 'Exposiciones de arte', 'Teatro', 'Festivales tradicionales'] },
          { pregunta: '¿Con qué frecuencia asistes a eventos culturales?', opciones: ['Semanalmente', 'Mensualmente', 'Cada 3 meses', 'Una vez al año', 'Nunca'] }
        ],
        imagenUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
        estado: 'pausada',
        fechaInicio: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        totalRespuestas: 89,
      },
    ];

    for (const encuesta of encuestasPrueba) {
      await db.insert(encuestas).values(encuesta).onConflictDoNothing();
    }
    console.log("✅ 5 encuestas de prueba insertadas");

    // Insertar popups de prueba (3 personas desaparecidas, 2 mascotas, 5 publicidad)
    const popupsPrueba = [
      // 3 Personas desaparecidas
      {
        id: crypto.randomUUID(),
        titulo: 'URGENTE: Juan Manuel Quispe - Desaparecido',
        tipoContenido: 'Joven de 17 años desaparecido desde el 20 de noviembre. Última vez visto en el centro de Tacna.',
        imagenUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        tipo: 'persona_desaparecida',
        duracionSegundos: 45,
        segundosObligatorios: 8,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        vistas: 234,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'ALERTA: María Elena Condori - Desaparecida',
        tipoContenido: 'Señora de 65 años con Alzheimer. Desapareció el 22 de noviembre en Alto de la Alianza.',
        imagenUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        tipo: 'persona_desaparecida',
        duracionSegundos: 45,
        segundosObligatorios: 8,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        vistas: 178,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'BÚSQUEDA: Carlos Mendoza Huanca',
        tipoContenido: 'Hombre de 35 años no regresó a casa desde el 18 de noviembre. Trabaja como taxista.',
        imagenUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        tipo: 'persona_desaparecida',
        duracionSegundos: 40,
        segundosObligatorios: 7,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        vistas: 312,
      },
      // 2 Mascotas desaparecidas
      {
        id: crypto.randomUUID(),
        titulo: 'SE BUSCA: "Toby" - Perro Golden Retriever',
        tipoContenido: 'Perro macho, color dorado, 3 años. Se perdió en Ciudad Nueva el 21 de noviembre.',
        imagenUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
        tipo: 'mascota_desaparecida',
        duracionSegundos: 30,
        segundosObligatorios: 5,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        vistas: 156,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'PERDIDO: "Michi" - Gato Siamés',
        tipoContenido: 'Gata hembra, ojos azules, 2 años. Escapó de casa en Pocollay el 19 de noviembre.',
        imagenUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        tipo: 'mascota_desaparecida',
        duracionSegundos: 25,
        segundosObligatorios: 4,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        vistas: 98,
      },
      // 5 Publicidad comercial
      {
        id: crypto.randomUUID(),
        titulo: 'Restaurante El Buen Sabor - 20% Descuento',
        tipoContenido: 'Disfruta de la mejor comida tacneña con 20% de descuento este fin de semana.',
        imagenUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        tipo: 'publicidad',
        duracionSegundos: 20,
        segundosObligatorios: 5,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        vistas: 456,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Farmacia San Juan - Delivery Gratis',
        tipoContenido: 'Ahora con delivery GRATIS en toda Tacna. Medicamentos, productos de higiene y más.',
        imagenUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
        tipo: 'publicidad',
        duracionSegundos: 15,
        segundosObligatorios: 3,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        vistas: 287,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Clases de Inglés - Instituto Cambridge Tacna',
        tipoContenido: 'Aprende inglés con metodología Cambridge. Niños, jóvenes y adultos. Matrícula GRATIS.',
        imagenUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400',
        tipo: 'publicidad',
        duracionSegundos: 20,
        segundosObligatorios: 4,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        fechaFin: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        vistas: 345,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Taller Mecánico Los Andes - Revisión Gratis',
        tipoContenido: 'Revisión técnica vehicular GRATIS. Cambio de aceite, frenos, suspensión.',
        imagenUrl: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=400',
        tipo: 'publicidad',
        duracionSegundos: 18,
        segundosObligatorios: 4,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        vistas: 198,
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Gimnasio FitLife - Promoción Verano 2025',
        tipoContenido: '¡Prepárate para el verano! 3 meses por el precio de 2. Todas las máquinas incluidas.',
        imagenUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        tipo: 'publicidad',
        duracionSegundos: 25,
        segundosObligatorios: 5,
        puedeOmitir: true,
        estado: 'activo',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        vistas: 412,
      },
    ];

    for (const popup of popupsPrueba) {
      await db.insert(popupsPublicitarios).values(popup).onConflictDoNothing();
    }
    console.log("✅ 10 popups de prueba insertados (3 personas, 2 mascotas, 5 publicidad)");

    console.log("🎉 Datos de prueba insertados exitosamente");
  } catch (error) {
    console.error("❌ Error insertando datos de prueba:", error);
    throw error;
  }
}
