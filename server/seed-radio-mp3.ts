import { db } from "./db";
import { radiosOnline, listasMp3, archivosMp3 } from "@shared/schema";

async function seedRadioMp3() {
  console.log("Insertando datos de prueba para Radio Online y Listas MP3...");

  try {
    const radiosData = [
      {
        nombre: "TacnaFM.apo",
        url: "https://mediastreamm.com/8158/",
        iframeCode: '<iframe src="https://mediastreamm.com/8158/stream" frameborder="0" allow="autoplay" width="100%" height="80"></iframe>',
        descripcion: "Radio TacnaFM - La mejor musica de Tacna",
        logoUrl: "/assets/radio-tacnafm.png",
        orden: 1,
        esPredeterminada: true,
        estado: "activo",
      },
      {
        nombre: "La Juvenil",
        url: "https://mediastreamm.com:7089/",
        iframeCode: '<iframe src="https://mediastreamm.com:7089/stream" frameborder="0" allow="autoplay" width="100%" height="80"></iframe>',
        descripcion: "Radio La Juvenil - Musica juvenil las 24 horas",
        logoUrl: "/assets/radio-juvenil.png",
        orden: 2,
        esPredeterminada: false,
        estado: "activo",
      },
    ];

    for (const radio of radiosData) {
      await db.insert(radiosOnline).values(radio).onConflictDoNothing();
    }
    console.log(`Insertadas ${radiosData.length} radios online`);

    const listasData = [
      {
        nombre: "Rock Clasico",
        descripcion: "Los mejores exitos del rock clasico",
        rutaCarpeta: "/public_html/assets/mp3/rock",
        imagenUrl: "/assets/lista-rock.jpg",
        genero: "Rock",
        orden: 1,
        estado: "activo",
      },
      {
        nombre: "Cumbia Mix",
        descripcion: "Las mejores cumbias para bailar",
        rutaCarpeta: "/public_html/assets/mp3/cumbia",
        imagenUrl: "/assets/lista-cumbia.jpg",
        genero: "Cumbia",
        orden: 2,
        estado: "activo",
      },
      {
        nombre: "Exitos del Momento",
        descripcion: "Los hits mas sonados del momento",
        rutaCarpeta: "/public_html/assets/mp3/exitos",
        imagenUrl: "/assets/lista-exitos.jpg",
        genero: "Pop",
        orden: 3,
        estado: "activo",
      },
      {
        nombre: "Mix Variado",
        descripcion: "Mezcla de todos los generos",
        rutaCarpeta: "/public_html/assets/mp3/mix",
        imagenUrl: "/assets/lista-mix.jpg",
        genero: "Variado",
        orden: 4,
        estado: "activo",
      },
      {
        nombre: "Romantica",
        descripcion: "Baladas y musica romantica",
        rutaCarpeta: "/public_html/assets/mp3/romantica",
        imagenUrl: "/assets/lista-romantica.jpg",
        genero: "Romantica",
        orden: 5,
        estado: "activo",
      },
    ];

    const insertedListas: { id: number; nombre: string }[] = [];
    for (const lista of listasData) {
      const result = await db.insert(listasMp3).values(lista).returning({ id: listasMp3.id, nombre: listasMp3.nombre });
      if (result.length > 0) {
        insertedListas.push(result[0]);
      }
    }
    console.log(`Insertadas ${insertedListas.length} listas MP3`);

    const archivosData: {
      listaId: number;
      titulo: string;
      artista: string;
      archivoUrl: string;
      duracion: number;
      orden: number;
      estado: string;
    }[] = [];

    for (const lista of insertedListas) {
      const numArchivos = Math.floor(Math.random() * 5) + 3;
      for (let i = 1; i <= numArchivos; i++) {
        archivosData.push({
          listaId: lista.id,
          titulo: `Cancion ${i} - ${lista.nombre}`,
          artista: `Artista ${Math.floor(Math.random() * 10) + 1}`,
          archivoUrl: `/assets/mp3/${lista.nombre.toLowerCase().replace(/\s+/g, "_")}/track_${i}.mp3`,
          duracion: Math.floor(Math.random() * 180) + 120,
          orden: i,
          estado: "activo",
        });
      }
    }

    for (const archivo of archivosData) {
      await db.insert(archivosMp3).values(archivo).onConflictDoNothing();
    }
    console.log(`Insertados ${archivosData.length} archivos MP3`);

    console.log("Datos de prueba insertados exitosamente!");
  } catch (error) {
    console.error("Error al insertar datos de prueba:", error);
    throw error;
  }
}

seedRadioMp3()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
