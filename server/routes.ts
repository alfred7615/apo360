import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import crypto from "crypto";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, ne, sql, desc } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { createUploadMiddleware, getPublicUrl } from "./uploadConfigByEndpoint";
import { requireSuperAdmin } from "./authMiddleware";
import { requireAdmin } from "./middleware/authorization";
import { 
  insertPublicidadSchema, 
  insertServicioSchema, 
  insertProductoDeliverySchema, 
  insertGrupoChatSchema, 
  insertMensajeSchema, 
  insertEmergenciaSchema, 
  insertContactoFamiliarSchema,
  insertLugarUsuarioSchema,
  insertViajeTaxiSchema, 
  insertPedidoDeliverySchema, 
  insertRadioOnlineSchema, 
  insertListaMp3Schema,
  insertArchivoMp3Schema,
  insertRegistroBasicoSchema,
  insertRegistroChatSchema,
  insertRegistroUbicacionSchema,
  insertRegistroDireccionSchema,
  insertRegistroMarketplaceSchema,
  insertCredencialesConductorSchema,
  rolesRegistroValidos,
  rolesConAprobacion,
  insertSectorSchema,
  mensajes,
  miembrosGrupo,
  widgetsEmbebibles,
  logosServicios,
  publicidad,
  itemsCatalogo,
  categoriasServicio,
  radiosOnline,
  listasMp3,
  configuracionMonedas,
} from "@shared/schema";
import { paises, departamentosPeru, distritosPorDepartamento, obtenerDepartamentos, obtenerDistritos, buscarDepartamentos, buscarDistritos } from "@shared/ubicaciones-peru";
import { registerAdminRoutes } from "./routes-admin";
import { notificarSuperAdmins, notificarUsuario } from "./websocket";
import { obtenerReporteCartera, generarPDFReporte, generarBackupCartera, generarBackupSistema, generarAmbosBackups, listarBackupsCartera, listarBackupsSistema, listarTodosBackups, obtenerRutaBackup } from "./services/reportesService";
import { registrarActividad, obtenerRegistrosAuditoria, obtenerEstadisticasAuditoria, extraerInfoUsuario } from "./services/auditoriaService";
import * as cron from "node-cron";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticación
  await setupAuth(app);

  // Servir archivos estáticos
  const publicPath = path.join(process.cwd(), 'public');
  app.use('/assets', express.static(path.join(publicPath, 'assets')));

  // ============================================================
  // RUTAS DE PERFIL DE USUARIO (debe ir ANTES de rutas admin)
  // Las rutas /api/usuarios/me deben registrarse antes de /api/usuarios/:id
  // ============================================================

  app.get('/api/usuarios', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      
      // Enriquecer usuarios con sus roles jerárquicos activos
      const usuariosConRoles = await Promise.all(usuarios.map(async (usuario) => {
        try {
          const rolesJerarquicos = await storage.getRolesUsuario(usuario.id);
          // Filtrar solo roles activos
          const rolesActivos = (rolesJerarquicos || []).filter((r: any) => r.estado === 'activo');
          return {
            ...usuario,
            rolesJerarquicos: rolesActivos,
          };
        } catch (e) {
          return {
            ...usuario,
            rolesJerarquicos: [],
          };
        }
      }));
      
      res.json(usuariosConRoles);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });

  app.get('/api/usuarios/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      res.status(500).json({ message: "Error al obtener perfil" });
    }
  });

  app.patch('/api/usuarios/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Campos de sistema que no deben ser modificados por el cliente
      const camposSistema = ['id', 'createdAt', 'updatedAt', 'ultimaConexion', 'rol', 'estado'];
      
      // Procesar campos de fecha - convertir strings a Date o null
      const camposFecha = [
        'dniEmision', 'dniCaducidad',
        'breveteEmision', 'breveteCaducidad',
        'soatEmision', 'soatCaducidad',
        'revisionTecnicaEmision', 'revisionTecnicaCaducidad',
        'credencialConductorEmision', 'credencialConductorCaducidad',
        'credencialTaxiEmision', 'credencialTaxiCaducidad'
      ];
      
      const dataProcesada = { ...req.body };
      
      // Eliminar campos de sistema que no deben ser modificados por el cliente
      for (const campo of camposSistema) {
        delete dataProcesada[campo];
      }
      
      for (const campo of camposFecha) {
        if (dataProcesada[campo] !== undefined) {
          const valor = dataProcesada[campo];
          if (valor === null || valor === '' || valor === undefined) {
            dataProcesada[campo] = null;
          } else if (typeof valor === 'string') {
            const fechaParseada = new Date(valor);
            dataProcesada[campo] = isNaN(fechaParseada.getTime()) ? null : fechaParseada;
          } else if (valor instanceof Date) {
            dataProcesada[campo] = valor;
          } else {
            dataProcesada[campo] = null;
          }
        }
      }
      
      const user = await storage.updateUser(userId, dataProcesada);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      res.status(400).json({ message: error.message || "Error al actualizar perfil" });
    }
  });

  // Actualizar usuario por ID (solo super_admin)
  app.patch('/api/usuarios/:id', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Campos de sistema que no deben ser modificados directamente
      const camposSistema = ['id', 'createdAt'];
      
      // Procesar campos de fecha - convertir strings a Date o null
      const camposFecha = [
        'dniEmision', 'dniCaducidad',
        'breveteEmision', 'breveteCaducidad',
        'soatEmision', 'soatCaducidad',
        'revisionTecnicaEmision', 'revisionTecnicaCaducidad',
        'credencialConductorEmision', 'credencialConductorCaducidad',
        'credencialTaxiEmision', 'credencialTaxiCaducidad',
        'fechaSuspension', 'fechaBloqueo'
      ];
      
      const dataProcesada = { ...req.body };
      
      // Validar y normalizar el campo rol
      if (dataProcesada.rol !== undefined) {
        if (typeof dataProcesada.rol !== 'string') {
          if (Array.isArray(dataProcesada.rol)) {
            dataProcesada.rol = dataProcesada.rol[0] || 'usuario';
          } else {
            dataProcesada.rol = 'usuario';
          }
        }
      }
      
      // Eliminar campos de sistema que no deben ser modificados
      for (const campo of camposSistema) {
        delete dataProcesada[campo];
      }
      
      // Procesar campos de fecha
      for (const campo of camposFecha) {
        if (dataProcesada[campo] !== undefined) {
          const valor = dataProcesada[campo];
          if (valor === null || valor === '' || valor === undefined) {
            dataProcesada[campo] = null;
          } else if (typeof valor === 'string') {
            const fechaParseada = new Date(valor);
            dataProcesada[campo] = isNaN(fechaParseada.getTime()) ? null : fechaParseada;
          } else if (valor instanceof Date) {
            dataProcesada[campo] = valor;
          } else {
            dataProcesada[campo] = null;
          }
        }
      }
      
      const user = await storage.updateUser(id, dataProcesada);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      res.status(400).json({ message: error.message || "Error al actualizar usuario" });
    }
  });

  // Verificar completitud del perfil
  app.get('/api/verificar-perfil', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Campos requeridos para perfil básico
      const camposBasicos = {
        nombre: !!(user.firstName || user.lastName),
        telefono: !!user.telefono,
        email: !!user.email,
      };
      const perfilBasicoCompleto = Object.values(camposBasicos).every(v => v);
      const porcentajeBasico = Math.round((Object.values(camposBasicos).filter(v => v).length / Object.keys(camposBasicos).length) * 100);

      // Campos requeridos para chat
      const camposChat = {
        ...camposBasicos,
        alias: !!user.alias,
      };
      const chatHabilitado = Object.values(camposChat).every(v => v);
      const porcentajeChat = Math.round((Object.values(camposChat).filter(v => v).length / Object.keys(camposChat).length) * 100);

      // Campos requeridos para taxi pasajero
      const camposTaxiPasajero = {
        ...camposBasicos,
        direccion: !!(user.direccion || user.avenidaCalle),
      };
      const taxiPasajeroHabilitado = Object.values(camposTaxiPasajero).every(v => v);
      const porcentajeTaxiPasajero = Math.round((Object.values(camposTaxiPasajero).filter(v => v).length / Object.keys(camposTaxiPasajero).length) * 100);

      // Campos requeridos para conductor
      const camposConductor = {
        ...camposBasicos,
        dni: !!user.dni,
        brevete: !!(user.breveteImagenFrente),
        vehiculo: !!(user.vehiculoModelo && user.vehiculoPlaca),
        modoTaxi: user.modoTaxi === 'conductor',
      };
      const conductorHabilitado = Object.values(camposConductor).every(v => v);
      const porcentajeConductor = Math.round((Object.values(camposConductor).filter(v => v).length / Object.keys(camposConductor).length) * 100);

      // Campos requeridos para vender (marketplace)
      const camposVendedor = {
        ...camposBasicos,
        dni: !!user.dni,
      };
      const vendedorHabilitado = Object.values(camposVendedor).every(v => v);
      const porcentajeVendedor = Math.round((Object.values(camposVendedor).filter(v => v).length / Object.keys(camposVendedor).length) * 100);

      res.json({
        perfilBasico: {
          completo: perfilBasicoCompleto,
          porcentaje: porcentajeBasico,
          camposFaltantes: Object.entries(camposBasicos).filter(([, v]) => !v).map(([k]) => k),
        },
        chat: {
          habilitado: chatHabilitado,
          porcentaje: porcentajeChat,
          camposFaltantes: Object.entries(camposChat).filter(([, v]) => !v).map(([k]) => k),
        },
        taxiPasajero: {
          habilitado: taxiPasajeroHabilitado,
          porcentaje: porcentajeTaxiPasajero,
          camposFaltantes: Object.entries(camposTaxiPasajero).filter(([, v]) => !v).map(([k]) => k),
        },
        conductor: {
          habilitado: conductorHabilitado,
          porcentaje: porcentajeConductor,
          camposFaltantes: Object.entries(camposConductor).filter(([, v]) => !v).map(([k]) => k),
        },
        vendedor: {
          habilitado: vendedorHabilitado,
          porcentaje: porcentajeVendedor,
          camposFaltantes: Object.entries(camposVendedor).filter(([, v]) => !v).map(([k]) => k),
        },
      });
    } catch (error: any) {
      console.error("Error al verificar perfil:", error);
      res.status(500).json({ message: error.message || "Error al verificar perfil" });
    }
  });

  // ============================================================
  // CATEGORÍAS DE ROLES (para roles con jerarquía)
  // ============================================================
  
  // Obtener todas las categorías de un rol
  app.get('/api/categorias-rol', async (req, res) => {
    try {
      const { rolBase } = req.query;
      const categorias = await storage.getCategoriasRol(rolBase as string | undefined);
      res.json(categorias);
    } catch (error: any) {
      console.error("Error al obtener categorías de rol:", error);
      res.status(500).json({ message: error.message || "Error al obtener categorías" });
    }
  });

  // Crear categoría de rol
  app.post('/api/categorias-rol', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.createCategoriaRol(req.body);
      res.status(201).json(categoria);
    } catch (error: any) {
      console.error("Error al crear categoría de rol:", error);
      res.status(500).json({ message: error.message || "Error al crear categoría" });
    }
  });

  // Actualizar categoría de rol
  app.patch('/api/categorias-rol/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const categoria = await storage.updateCategoriaRol(id, req.body);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al actualizar categoría de rol:", error);
      res.status(500).json({ message: error.message || "Error al actualizar categoría" });
    }
  });

  // Eliminar categoría de rol
  app.delete('/api/categorias-rol/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategoriaRol(id);
      res.json({ message: "Categoría eliminada correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar categoría de rol:", error);
      res.status(500).json({ message: error.message || "Error al eliminar categoría" });
    }
  });

  // ============================================================
  // SUBCATEGORÍAS DE ROLES
  // ============================================================
  
  // Obtener todas las subcategorías de una categoría
  app.get('/api/subcategorias-rol', async (req, res) => {
    try {
      const { categoriaId } = req.query;
      const subcategorias = await storage.getSubcategoriasRol(categoriaId as string | undefined);
      res.json(subcategorias);
    } catch (error: any) {
      console.error("Error al obtener subcategorías de rol:", error);
      res.status(500).json({ message: error.message || "Error al obtener subcategorías" });
    }
  });

  // Crear subcategoría de rol
  app.post('/api/subcategorias-rol', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const subcategoria = await storage.createSubcategoriaRol(req.body);
      res.status(201).json(subcategoria);
    } catch (error: any) {
      console.error("Error al crear subcategoría de rol:", error);
      res.status(500).json({ message: error.message || "Error al crear subcategoría" });
    }
  });

  // Actualizar subcategoría de rol
  app.patch('/api/subcategorias-rol/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const subcategoria = await storage.updateSubcategoriaRol(id, req.body);
      if (!subcategoria) {
        return res.status(404).json({ message: "Subcategoría no encontrada" });
      }
      res.json(subcategoria);
    } catch (error: any) {
      console.error("Error al actualizar subcategoría de rol:", error);
      res.status(500).json({ message: error.message || "Error al actualizar subcategoría" });
    }
  });

  // Eliminar subcategoría de rol
  app.delete('/api/subcategorias-rol/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSubcategoriaRol(id);
      res.json({ message: "Subcategoría eliminada correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar subcategoría de rol:", error);
      res.status(500).json({ message: error.message || "Error al eliminar subcategoría" });
    }
  });

  // Obtener usuarios básicos para selección
  app.get('/api/usuarios-basico', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const usuarios = await storage.getUsuariosBasico();
      res.json(usuarios);
    } catch (error: any) {
      console.error("Error al obtener usuarios básicos:", error);
      res.status(500).json({ message: error.message || "Error al obtener usuarios" });
    }
  });

  // Obtener usuarios asignados a una subcategoría
  app.get('/api/subcategorias-rol/:id/usuarios', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const usuarios = await storage.getUsuariosSubcategoria(id);
      res.json(usuarios);
    } catch (error: any) {
      console.error("Error al obtener usuarios de subcategoría:", error);
      res.status(500).json({ message: error.message || "Error al obtener usuarios" });
    }
  });

  // Asignar usuarios a una subcategoría
  app.post('/api/subcategorias-rol/:id/usuarios', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { usuarioIds } = req.body;
      
      if (!Array.isArray(usuarioIds) || usuarioIds.length === 0) {
        return res.status(400).json({ message: "Debe proporcionar al menos un usuario" });
      }
      
      // Obtener información de la subcategoría y categoría
      const subcategoria = await storage.getSubcategoriaRol(id);
      if (!subcategoria) {
        return res.status(404).json({ message: "Subcategoría no encontrada" });
      }
      
      const categoria = await storage.getCategoriaRol(subcategoria.categoriaRolId);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      
      // Asignar usuarios a la subcategoría
      await storage.asignarUsuariosSubcategoria(id, usuarioIds, categoria.rol, categoria.id);
      
      // Enviar notificaciones a los usuarios asignados
      for (const usuarioId of usuarioIds) {
        try {
          await storage.crearNotificacionChat({
            usuarioId,
            tipo: 'rol_asignado',
            mensaje: `Has sido asignado al rol ${categoria.rol} - ${categoria.nombre} - ${subcategoria.nombre}`,
            leido: false,
          });
        } catch (notifError) {
          console.error("Error al enviar notificación:", notifError);
        }
      }
      
      res.json({ message: "Usuarios asignados correctamente", cantidad: usuarioIds.length });
    } catch (error: any) {
      console.error("Error al asignar usuarios:", error);
      res.status(500).json({ message: error.message || "Error al asignar usuarios" });
    }
  });

  // ============================================================
  // DATOS DE NEGOCIO (Local Comercial)
  // ============================================================
  
  // Obtener datos de negocio del usuario actual
  app.get('/api/mi-negocio', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const negocio = await storage.getDatosNegocio(usuarioId);
      res.json(negocio || null);
    } catch (error: any) {
      console.error("Error al obtener datos de negocio:", error);
      res.status(500).json({ message: error.message || "Error al obtener datos" });
    }
  });

  // Crear/actualizar datos de negocio
  app.post('/api/mi-negocio', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const existente = await storage.getDatosNegocio(usuarioId);
      
      if (existente) {
        const actualizado = await storage.updateDatosNegocio(existente.id, req.body);
        res.json(actualizado);
      } else {
        const negocio = await storage.createDatosNegocio({
          ...req.body,
          usuarioId,
        });
        res.status(201).json(negocio);
      }
    } catch (error: any) {
      console.error("Error al guardar datos de negocio:", error);
      res.status(500).json({ message: error.message || "Error al guardar datos" });
    }
  });

  // Obtener todos los negocios (admin)
  app.get('/api/negocios', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const negocios = await storage.getAllDatosNegocios();
      res.json(negocios);
    } catch (error: any) {
      console.error("Error al obtener negocios:", error);
      res.status(500).json({ message: error.message || "Error al obtener negocios" });
    }
  });

  // ============================================================
  // CATÁLOGO DE NEGOCIO
  // ============================================================
  
  // Obtener catálogo del usuario actual
  app.get('/api/mi-catalogo', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoNegocioPorUsuario(usuarioId);
      res.json(catalogo);
    } catch (error: any) {
      console.error("Error al obtener catálogo:", error);
      res.status(500).json({ message: error.message || "Error al obtener catálogo" });
    }
  });

  // Agregar item al catálogo
  app.post('/api/mi-catalogo', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const negocio = await storage.getDatosNegocio(usuarioId);
      
      if (!negocio) {
        return res.status(400).json({ message: "Debes configurar tu negocio primero" });
      }

      const item = await storage.createItemCatalogo({
        ...req.body,
        negocioId: negocio.id,
        usuarioId,
      });
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error al agregar item:", error);
      res.status(500).json({ message: error.message || "Error al agregar item" });
    }
  });

  // Actualizar item del catálogo
  app.patch('/api/mi-catalogo/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.updateItemCatalogo(id, req.body);
      res.json(item);
    } catch (error: any) {
      console.error("Error al actualizar item:", error);
      res.status(500).json({ message: error.message || "Error al actualizar item" });
    }
  });

  // Eliminar item del catálogo
  app.delete('/api/mi-catalogo/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteItemCatalogo(id);
      res.json({ message: "Item eliminado correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar item:", error);
      res.status(500).json({ message: error.message || "Error al eliminar item" });
    }
  });

  // ============================================================
  // PERSONAL DEL NEGOCIO
  // ============================================================
  
  // Obtener personal del negocio del usuario actual
  app.get('/api/mi-personal', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const personal = await storage.getPersonalNegocioPorPropietario(usuarioId);
      
      // Enriquecer con datos del usuario
      const personalConDatos = await Promise.all(personal.map(async (p: any) => {
        const usuario = await storage.getUser(p.usuarioId);
        return {
          ...p,
          usuario: usuario ? {
            id: usuario.id,
            firstName: usuario.firstName,
            lastName: usuario.lastName,
            email: usuario.email,
            telefono: usuario.telefono,
            alias: usuario.alias,
            profileImageUrl: usuario.profileImageUrl,
          } : null,
        };
      }));
      
      res.json(personalConDatos);
    } catch (error: any) {
      console.error("Error al obtener personal:", error);
      res.status(500).json({ message: error.message || "Error al obtener personal" });
    }
  });

  // Buscar usuarios para agregar como personal
  app.get('/api/buscar-usuarios', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }
      const usuarios = await storage.buscarUsuariosParaPersonal(q);
      res.json(usuarios);
    } catch (error: any) {
      console.error("Error al buscar usuarios:", error);
      res.status(500).json({ message: error.message || "Error al buscar usuarios" });
    }
  });

  // Agregar personal al negocio
  app.post('/api/mi-personal', isAuthenticated, async (req: any, res) => {
    try {
      const propietarioId = req.user.claims.sub;
      const negocio = await storage.getDatosNegocio(propietarioId);
      
      if (!negocio) {
        return res.status(400).json({ message: "Debes configurar tu negocio primero" });
      }

      const personal = await storage.createPersonalNegocio({
        ...req.body,
        negocioId: negocio.id,
        propietarioId,
      });
      
      // Obtener datos del usuario agregado
      const usuario = await storage.getUser(personal.usuarioId);
      
      res.status(201).json({
        ...personal,
        usuario: usuario ? {
          id: usuario.id,
          firstName: usuario.firstName,
          lastName: usuario.lastName,
          email: usuario.email,
          telefono: usuario.telefono,
          alias: usuario.alias,
          profileImageUrl: usuario.profileImageUrl,
        } : null,
      });
    } catch (error: any) {
      console.error("Error al agregar personal:", error);
      res.status(500).json({ message: error.message || "Error al agregar personal" });
    }
  });

  // Actualizar personal del negocio
  app.patch('/api/mi-personal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const personal = await storage.updatePersonalNegocio(id, req.body);
      res.json(personal);
    } catch (error: any) {
      console.error("Error al actualizar personal:", error);
      res.status(500).json({ message: error.message || "Error al actualizar personal" });
    }
  });

  // Eliminar personal del negocio
  app.delete('/api/mi-personal/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deletePersonalNegocio(id);
      res.json({ message: "Personal eliminado correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar personal:", error);
      res.status(500).json({ message: error.message || "Error al eliminar personal" });
    }
  });

  // ============================================================
  // PUBLICIDAD DEL NEGOCIO (Mi Publicidad)
  // ============================================================
  
  // Obtener publicidad del usuario actual
  app.get('/api/mi-publicidad', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const publicidades = await storage.getPublicidadesByUsuario(usuarioId);
      res.json(publicidades);
    } catch (error: any) {
      console.error("Error al obtener publicidad:", error);
      res.status(500).json({ message: error.message || "Error al obtener publicidad" });
    }
  });

  // Crear nueva publicidad
  app.post('/api/mi-publicidad', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const negocio = await storage.getDatosNegocio(usuarioId);
      
      if (!negocio) {
        return res.status(400).json({ message: "Debes configurar tu negocio primero" });
      }

      const publicidad = await storage.createPublicidad({
        ...req.body,
        usuarioId,
      });
      res.status(201).json(publicidad);
    } catch (error: any) {
      console.error("Error al crear publicidad:", error);
      res.status(500).json({ message: error.message || "Error al crear publicidad" });
    }
  });

  // Actualizar publicidad
  app.patch('/api/mi-publicidad/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.user.claims.sub;
      
      // Verificar que la publicidad pertenece al usuario
      const publicidades = await storage.getPublicidadesByUsuario(usuarioId);
      const esPropia = publicidades.some((p: any) => p.id === id);
      
      if (!esPropia) {
        return res.status(403).json({ message: "No tienes permiso para editar esta publicidad" });
      }

      const publicidad = await storage.updatePublicidad(id, req.body);
      res.json(publicidad);
    } catch (error: any) {
      console.error("Error al actualizar publicidad:", error);
      res.status(500).json({ message: error.message || "Error al actualizar publicidad" });
    }
  });

  // Eliminar publicidad
  app.delete('/api/mi-publicidad/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.user.claims.sub;
      
      // Verificar que la publicidad pertenece al usuario
      const publicidades = await storage.getPublicidadesByUsuario(usuarioId);
      const esPropia = publicidades.some((p: any) => p.id === id);
      
      if (!esPropia) {
        return res.status(403).json({ message: "No tienes permiso para eliminar esta publicidad" });
      }

      await storage.deletePublicidad(id);
      res.json({ message: "Publicidad eliminada correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar publicidad:", error);
      res.status(500).json({ message: error.message || "Error al eliminar publicidad" });
    }
  });

  // ============================================================
  // PEDIDOS DEL NEGOCIO (LocalComercialPanel)
  // ============================================================
  
  // Obtener estadísticas de pedidos del negocio (usa tabla pedidos de carta digital)
  app.get('/api/mi-negocio/pedidos/estadisticas', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Buscar en tabla pedidos por localComercialId
      const todosPedidos = await storage.getPedidosLocal(usuarioId);
      
      // Estados posibles (incluye legacy y nuevos)
      const estadosRecibidos = ['pendiente'];
      const estadosAtendidos = ['aceptado', 'preparando', 'en_preparacion', 'listo', 'listo_para_envio', 'llamando_delivery', 'entregado_a_delivery', 'en_camino'];
      const estadosEntregados = ['entregado', 'confirmado', 'completado', 'recibido_conforme', 'entregado_conforme'];
      
      const estadisticas = {
        recibidos: todosPedidos.filter(p => estadosRecibidos.includes(p.estado)).length,
        atendidos: todosPedidos.filter(p => estadosAtendidos.includes(p.estado)).length,
        entregados: todosPedidos.filter(p => estadosEntregados.includes(p.estado)).length,
      };
      
      res.json(estadisticas);
    } catch (error: any) {
      console.error("Error al obtener estadísticas de pedidos:", error);
      res.status(500).json({ message: error.message || "Error al obtener estadísticas" });
    }
  });

  // Obtener pedidos del negocio (usa tabla pedidos de carta digital)
  app.get('/api/mi-negocio/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { estado } = req.query;
      
      // Buscar en tabla pedidos por localComercialId (que es el ID del usuario dueño del negocio)
      let listaPedidos = await storage.getPedidosLocal(usuarioId, estado !== 'todos' ? estado : undefined);
      
      // Enriquecer con datos del cliente
      const pedidosEnriquecidos = await Promise.all(listaPedidos.map(async (pedido) => {
        const cliente = await storage.getUser(pedido.usuarioId);
        return {
          ...pedido,
          cliente: cliente ? {
            id: cliente.id,
            nombre: cliente.firstName && cliente.lastName 
              ? `${cliente.firstName} ${cliente.lastName}`.trim() 
              : cliente.firstName || cliente.lastName || cliente.alias || 'Cliente',
            telefono: cliente.telefono,
            email: cliente.email,
          } : null,
        };
      }));
      
      res.json(pedidosEnriquecidos);
    } catch (error: any) {
      console.error("Error al obtener pedidos del negocio:", error);
      res.status(500).json({ message: error.message || "Error al obtener pedidos" });
    }
  });

  // Actualizar estado de pedido del negocio (usa tabla pedidos de carta digital)
  // Flujo completo: pendiente → aceptado → preparando → listo → en_camino → entregado → confirmado
  app.patch('/api/mi-negocio/pedidos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.user.claims.sub;
      
      // Verificar que el pedido pertenece al negocio del usuario (usar tabla pedidos)
      const pedidoExistente = await storage.getPedido(id);
      
      if (!pedidoExistente || pedidoExistente.localComercialId !== usuarioId) {
        return res.status(403).json({ message: "No tienes permiso para modificar este pedido" });
      }
      
      const { estado, notas } = req.body;
      
      // Usar función correcta para actualizar pedido de carta digital
      const pedido = await storage.cambiarEstadoPedido(id, estado, usuarioId, 'local', notas);
      
      res.json(pedido);
    } catch (error: any) {
      console.error("Error al actualizar pedido:", error);
      res.status(500).json({ message: error.message || "Error al actualizar pedido" });
    }
  });

  // ============================================================
  // FACTURACIÓN DEL NEGOCIO - Reportes de ventas diarias
  // ============================================================
  
  // Obtener estadísticas de facturación diaria por producto
  app.get('/api/mi-negocio/facturacion', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { fecha } = req.query;
      
      // Definir fecha de inicio y fin del día
      const fechaConsulta = fecha ? new Date(fecha as string) : new Date();
      const inicioDelDia = new Date(fechaConsulta);
      inicioDelDia.setHours(0, 0, 0, 0);
      const finDelDia = new Date(fechaConsulta);
      finDelDia.setHours(23, 59, 59, 999);
      
      // Obtener todos los pedidos del negocio
      const todosPedidos = await storage.getPedidosLocal(usuarioId);
      
      // Filtrar pedidos del día que están completados/pagados
      const estadosCompletados = ['entregado', 'confirmado', 'completado', 'recibido_conforme', 'entregado_conforme'];
      const pedidosDelDia = todosPedidos.filter(p => {
        const fechaPedido = new Date(p.createdAt);
        return fechaPedido >= inicioDelDia && 
               fechaPedido <= finDelDia && 
               estadosCompletados.includes(p.estado);
      });
      
      // Obtener items de todos los pedidos del día
      const productosVendidos: Record<string, {
        codigo: string;
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }> = {};
      
      let totalGeneral = 0;
      let totalPedidos = pedidosDelDia.length;
      
      for (const pedido of pedidosDelDia) {
        const items = await storage.getItemsPedido(pedido.id);
        
        for (const item of items) {
          const key = item.nombreProducto;
          const precio = parseFloat(item.precioUnitario) || 0;
          const cantidad = item.cantidad || 1;
          const subtotal = precio * cantidad;
          
          if (productosVendidos[key]) {
            productosVendidos[key].cantidad += cantidad;
            productosVendidos[key].subtotal += subtotal;
          } else {
            productosVendidos[key] = {
              codigo: item.itemCatalogoId?.substring(0, 8) || item.productoUsuarioId?.substring(0, 8) || '-',
              nombre: item.nombreProducto,
              cantidad: cantidad,
              precioUnitario: precio,
              subtotal: subtotal,
            };
          }
          
          totalGeneral += subtotal;
        }
        
        // Agregar montos adicionales si existen
        const montoAdicional = parseFloat(pedido.montoAdicional || "0");
        if (montoAdicional > 0) {
          totalGeneral += montoAdicional;
          if (productosVendidos["Adicionales"]) {
            productosVendidos["Adicionales"].cantidad += 1;
            productosVendidos["Adicionales"].subtotal += montoAdicional;
          } else {
            productosVendidos["Adicionales"] = {
              codigo: "ADIC",
              nombre: "Adicionales (pedidos extras)",
              cantidad: 1,
              precioUnitario: montoAdicional,
              subtotal: montoAdicional,
            };
          }
        }
      }
      
      // Convertir a array y ordenar por subtotal descendente
      const productos = Object.values(productosVendidos).sort((a, b) => b.subtotal - a.subtotal);
      
      res.json({
        fecha: fechaConsulta.toISOString().split('T')[0],
        totalPedidos,
        totalGeneral,
        productos,
        moneda: "PEN",
      });
    } catch (error: any) {
      console.error("Error al obtener facturación:", error);
      res.status(500).json({ message: error.message || "Error al obtener facturación" });
    }
  });
  
  // Generar reporte PDF de facturación diaria
  app.post('/api/mi-negocio/facturacion/reporte', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { fecha } = req.body;
      
      // Obtener datos del negocio
      const usuario = await storage.getUser(usuarioId);
      const negocio = await storage.getLocalComercial(usuarioId);
      const nombreNegocio = negocio?.nombre || usuario?.localNombre || "Mi Negocio";
      
      // Definir fecha de inicio y fin del día
      const fechaConsulta = fecha ? new Date(fecha) : new Date();
      const inicioDelDia = new Date(fechaConsulta);
      inicioDelDia.setHours(0, 0, 0, 0);
      const finDelDia = new Date(fechaConsulta);
      finDelDia.setHours(23, 59, 59, 999);
      
      // Obtener todos los pedidos del negocio
      const todosPedidos = await storage.getPedidosLocal(usuarioId);
      
      // Filtrar pedidos completados del día
      const estadosCompletados = ['entregado', 'confirmado', 'completado', 'recibido_conforme', 'entregado_conforme'];
      const pedidosDelDia = todosPedidos.filter(p => {
        const fechaPedido = new Date(p.createdAt);
        return fechaPedido >= inicioDelDia && 
               fechaPedido <= finDelDia && 
               estadosCompletados.includes(p.estado);
      });
      
      // Agregar items a cada pedido
      const pedidosConItems = await Promise.all(pedidosDelDia.map(async (pedido) => {
        const items = await storage.getItemsPedido(pedido.id);
        return { ...pedido, items };
      }));
      
      // Calcular productos vendidos
      const productosVendidos: Record<string, {
        codigo: string;
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }> = {};
      
      let totalGeneral = 0;
      
      for (const pedido of pedidosConItems) {
        for (const item of pedido.items) {
          const key = item.nombreProducto;
          const precio = parseFloat(item.precioUnitario) || 0;
          const cantidad = item.cantidad || 1;
          const subtotal = precio * cantidad;
          
          if (productosVendidos[key]) {
            productosVendidos[key].cantidad += cantidad;
            productosVendidos[key].subtotal += subtotal;
          } else {
            productosVendidos[key] = {
              codigo: item.itemCatalogoId?.substring(0, 8) || item.productoUsuarioId?.substring(0, 8) || '-',
              nombre: item.nombreProducto,
              cantidad: cantidad,
              precioUnitario: precio,
              subtotal: subtotal,
            };
          }
          
          totalGeneral += subtotal;
        }
        
        // Agregar montos adicionales
        const montoAdicional = parseFloat(pedido.montoAdicional || "0");
        if (montoAdicional > 0) {
          totalGeneral += montoAdicional;
          if (productosVendidos["Adicionales"]) {
            productosVendidos["Adicionales"].cantidad += 1;
            productosVendidos["Adicionales"].subtotal += montoAdicional;
          } else {
            productosVendidos["Adicionales"] = {
              codigo: "ADIC",
              nombre: "Adicionales",
              cantidad: 1,
              precioUnitario: montoAdicional,
              subtotal: montoAdicional,
            };
          }
        }
      }
      
      const productos = Object.values(productosVendidos).sort((a, b) => b.subtotal - a.subtotal);
      
      // Generar HTML para impresión
      const fechaFormateada = fechaConsulta.toLocaleDateString('es-PE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Facturación - ${nombreNegocio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 210mm; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8B5CF6; padding-bottom: 15px; }
    .header h1 { color: #8B5CF6; font-size: 24px; margin-bottom: 5px; }
    .header h2 { color: #333; font-size: 18px; margin-bottom: 10px; }
    .header p { color: #666; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
    td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 12px; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .total-row { background: #f0e6ff !important; font-weight: bold; }
    .total-row td { border-top: 2px solid #8B5CF6; padding: 15px 8px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 11px; }
    .resumen { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .resumen-item { background: #f0e6ff; padding: 15px; border-radius: 8px; text-align: center; flex: 1; margin: 0 5px; }
    .resumen-item h3 { color: #8B5CF6; font-size: 24px; }
    .resumen-item p { color: #666; font-size: 12px; }
    @media print { body { padding: 10mm; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${nombreNegocio}</h1>
    <h2>Reporte de Facturación Diaria</h2>
    <p>${fechaFormateada}</p>
  </div>
  
  <div class="resumen">
    <div class="resumen-item">
      <h3>${pedidosDelDia.length}</h3>
      <p>Pedidos</p>
    </div>
    <div class="resumen-item">
      <h3>${productos.length}</h3>
      <p>Productos</p>
    </div>
    <div class="resumen-item">
      <h3>S/ ${totalGeneral.toFixed(2)}</h3>
      <p>Total del día</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 15%">Código</th>
        <th style="width: 40%">Producto</th>
        <th style="width: 15%" class="text-center">Cantidad</th>
        <th style="width: 15%" class="text-right">P. Unit.</th>
        <th style="width: 15%" class="text-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>`;
      
      let numeroFila = 1;
      for (const producto of productos) {
        html += `
      <tr>
        <td>${numeroFila}.${producto.codigo}</td>
        <td>${producto.nombre}</td>
        <td class="text-center">${producto.cantidad}</td>
        <td class="text-right">S/ ${producto.precioUnitario.toFixed(2)}</td>
        <td class="text-right">S/ ${producto.subtotal.toFixed(2)}</td>
      </tr>`;
        numeroFila++;
      }
      
      html += `
      <tr class="total-row">
        <td colspan="2">TOTAL GENERAL</td>
        <td class="text-center">${productos.reduce((sum, p) => sum + p.cantidad, 0)}</td>
        <td></td>
        <td class="text-right">S/ ${totalGeneral.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Reporte generado por APO-360 • ${new Date().toLocaleString('es-PE')}</p>
  </div>
</body>
</html>`;
      
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      console.error("Error al generar reporte:", error);
      res.status(500).json({ message: error.message || "Error al generar reporte" });
    }
  });

  // Estadísticas de delivery del negocio (usa tabla pedidos de carta digital)
  app.get('/api/mi-negocio/delivery/estadisticas', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Obtener pedidos del negocio desde tabla pedidos
      const todosPedidos = await storage.getPedidosLocal(usuarioId);
      
      // Estados de atención (incluye legacy)
      const estadosAtendido = ['preparando', 'en_preparacion', 'listo', 'listo_para_envio', 'llamando_delivery', 'entregado_a_delivery'];
      const atendido = todosPedidos.filter(p => estadosAtendido.includes(p.estado)).length;
      const enCamino = todosPedidos.filter(p => p.estado === 'en_camino').length;
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      // Estados de entrega (incluye legacy)
      const estadosEntregado = ['entregado', 'confirmado', 'completado', 'recibido_conforme', 'entregado_conforme'];
      const entregadoHoy = todosPedidos.filter(p => {
        if (!estadosEntregado.includes(p.estado)) return false;
        const fechaRef = p.fechaEntregado || p.fechaConfirmado || p.updatedAt;
        return fechaRef && new Date(fechaRef) >= hoy;
      }).length;
      
      res.json({ atendido, enCamino, entregado: entregadoHoy });
    } catch (error: any) {
      console.error("Error al obtener estadísticas de delivery:", error);
      res.status(500).json({ message: error.message || "Error al obtener estadísticas" });
    }
  });

  // Obtener entregas activas del negocio (usa tabla pedidos de carta digital)
  app.get('/api/mi-negocio/delivery/activas', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Obtener pedidos del negocio desde tabla pedidos
      const todosPedidos = await storage.getPedidosLocal(usuarioId);
      
      // Estados activos (incluye legacy)
      const estadosActivos = [
        'pendiente', 'aceptado', 'preparando', 'en_preparacion', 
        'listo', 'listo_para_envio', 'llamando_delivery', 
        'entregado_a_delivery', 'en_camino'
      ];
      const activas = todosPedidos.filter(p => estadosActivos.includes(p.estado));
      
      // Enriquecer con coordenadas de la solicitud de delivery si existe
      const entregasConUbicacion = await Promise.all(activas.map(async (pedido) => {
        // Buscar la solicitud de delivery asociada al pedido
        const solicitud = await storage.getSolicitudDeliveryPorPedido(pedido.id);
        
        // Compatibilidad con campos de ubicación (nuevos y legacy)
        const latitudFinal = solicitud?.latitudActual || (pedido as any).latitudEntrega || (pedido as any).latitud || null;
        const longitudFinal = solicitud?.longitudActual || (pedido as any).longitudEntrega || (pedido as any).longitud || null;
        
        return {
          ...pedido,
          latitud: latitudFinal,
          longitud: longitudFinal,
          deliveryInfo: solicitud ? {
            id: solicitud.id,
            nombreDelivery: solicitud.nombreDelivery,
            telefonoDelivery: solicitud.telefonoDelivery,
            estado: solicitud.estado,
            latitudActual: solicitud.latitudActual,
            longitudActual: solicitud.longitudActual,
          } : null,
        };
      }));
      
      res.json(entregasConUbicacion);
    } catch (error: any) {
      console.error("Error al obtener entregas activas:", error);
      res.status(500).json({ message: error.message || "Error al obtener entregas activas" });
    }
  });

  // Solicitar delivery para un pedido (usa tabla pedidos de carta digital)
  app.post('/api/mi-negocio/delivery/solicitar/:pedidoId', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { pedidoId } = req.params;
      
      // Verificar que el pedido pertenece al negocio del usuario
      const pedido = await storage.getPedido(pedidoId);
      
      if (!pedido || pedido.localComercialId !== usuarioId) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Actualizar estado a listo (esperando repartidor)
      const actualizado = await storage.cambiarEstadoPedido(pedidoId, 'listo', usuarioId, 'local');
      
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al solicitar delivery:", error);
      res.status(500).json({ message: error.message || "Error al solicitar delivery" });
    }
  });

  // ============================================================
  // HISTORIAL DEL NEGOCIO (LocalComercialPanel)
  // ============================================================

  // Historial de pedidos completados (usa tabla pedidos de carta digital)
  app.get('/api/mi-negocio/historial/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Obtener pedidos del negocio desde tabla pedidos
      const todosPedidos = await storage.getPedidosLocal(usuarioId);
      
      // Estados finales (incluye legacy)
      const estadosFinales = ['entregado', 'confirmado', 'completado', 'recibido_conforme', 'entregado_conforme', 'cancelado'];
      
      // Filtrar solo pedidos completados/entregados/cancelados
      const completados = todosPedidos.filter(p => 
        estadosFinales.includes(p.estado)
      ).sort((a, b) => {
        const fechaA = a.fechaEntregado || a.fechaConfirmado || a.updatedAt;
        const fechaB = b.fechaEntregado || b.fechaConfirmado || b.updatedAt;
        const timeA = fechaA ? new Date(fechaA).getTime() : 0;
        const timeB = fechaB ? new Date(fechaB).getTime() : 0;
        return timeB - timeA; // Más recientes primero
      });
      
      // Enriquecer con datos del cliente
      const pedidosEnriquecidos = await Promise.all(completados.map(async (pedido) => {
        const cliente = await storage.getUser(pedido.usuarioId);
        return {
          ...pedido,
          cliente: cliente ? {
            id: cliente.id,
            nombre: cliente.firstName && cliente.lastName 
              ? `${cliente.firstName} ${cliente.lastName}`.trim() 
              : cliente.firstName || cliente.lastName || cliente.alias || 'Cliente',
            telefono: cliente.telefono,
          } : null,
        };
      }));
      
      res.json(pedidosEnriquecidos);
    } catch (error: any) {
      console.error("Error al obtener historial de pedidos:", error);
      res.status(500).json({ message: error.message || "Error al obtener historial" });
    }
  });

  // Historial de movimientos de billetera
  app.get('/api/mi-negocio/historial/billetera', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Obtener transacciones del usuario
      const transacciones = await storage.getTransaccionesSaldo(usuarioId);
      
      // Ordenar por fecha (más recientes primero)
      const ordenadas = transacciones.sort((a, b) => {
        const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return fechaB - fechaA;
      });
      
      res.json(ordenadas);
    } catch (error: any) {
      console.error("Error al obtener historial de billetera:", error);
      res.status(500).json({ message: error.message || "Error al obtener historial" });
    }
  });

  // Historial de recargas (solicitudes de recarga/retiro aprobadas/rechazadas)
  app.get('/api/mi-negocio/historial/recargas', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Obtener solicitudes de saldo del usuario
      const solicitudes = await storage.getSolicitudesSaldoPorUsuario(usuarioId);
      
      // Filtrar solo solicitudes procesadas
      const procesadas = solicitudes.filter(s => 
        ['aprobado', 'rechazado', 'completado'].includes(s.estado || '')
      ).sort((a, b) => {
        const fechaA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const fechaB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return fechaB - fechaA;
      });
      
      res.json(procesadas);
    } catch (error: any) {
      console.error("Error al obtener historial de recargas:", error);
      res.status(500).json({ message: error.message || "Error al obtener historial" });
    }
  });

  // ============================================================
  // MÓDULOS DE USUARIO POR ROL
  // ============================================================
  
  // Obtener roles y módulos del usuario actual
  app.get('/api/mis-roles', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const roles = await storage.getRolesUsuario(usuarioId);
      
      // Enriquecer con información de categorías y subcategorías
      const rolesEnriquecidos = await Promise.all(roles.map(async (rol) => {
        let categoria = null;
        let subcategoria = null;
        let subcategoriasDisponibles: any[] = [];
        
        if (rol.categoriaRolId) {
          categoria = await storage.getCategoriaRol(rol.categoriaRolId);
          // Obtener subcategorías disponibles para esta categoría
          subcategoriasDisponibles = await storage.getSubcategoriasRol(rol.categoriaRolId);
        }
        if (rol.subcategoriaRolId) {
          subcategoria = await storage.getSubcategoriaRol(rol.subcategoriaRolId);
        }
        
        return {
          ...rol,
          categoria,
          subcategoria,
          subcategoriasDisponibles,
        };
      }));
      
      res.json(rolesEnriquecidos);
    } catch (error: any) {
      console.error("Error al obtener roles:", error);
      res.status(500).json({ message: error.message || "Error al obtener roles" });
    }
  });

  // Actualizar subcategoría del rol del usuario (el usuario elige su subcategoría)
  app.patch('/api/mis-roles/:id/subcategoria', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { subcategoriaRolId } = req.body;
      
      // Verificar que el rol pertenece al usuario
      const roles = await storage.getRolesUsuario(usuarioId);
      const rolUsuario = roles.find(r => r.id === id);
      
      if (!rolUsuario) {
        return res.status(404).json({ message: "Rol no encontrado o no te pertenece" });
      }
      
      // Verificar que la subcategoría pertenece a la categoría del rol
      if (subcategoriaRolId && rolUsuario.categoriaRolId) {
        const subcategoria = await storage.getSubcategoriaRol(subcategoriaRolId);
        if (!subcategoria || subcategoria.categoriaRolId !== rolUsuario.categoriaRolId) {
          return res.status(400).json({ message: "La subcategoría no es válida para esta categoría" });
        }
      }
      
      // Actualizar subcategoría del rol
      const rolActualizado = await storage.actualizarRolUsuario(id, { subcategoriaRolId });
      
      if (!rolActualizado) {
        return res.status(500).json({ message: "Error al actualizar subcategoría" });
      }
      
      // Obtener información enriquecida
      let categoria = null;
      let subcategoria = null;
      if (rolActualizado.categoriaRolId) {
        categoria = await storage.getCategoriaRol(rolActualizado.categoriaRolId);
      }
      if (rolActualizado.subcategoriaRolId) {
        subcategoria = await storage.getSubcategoriaRol(rolActualizado.subcategoriaRolId);
      }
      
      res.json({ ...rolActualizado, categoria, subcategoria });
    } catch (error: any) {
      console.error("Error al actualizar subcategoría del rol:", error);
      res.status(500).json({ message: error.message || "Error al actualizar subcategoría" });
    }
  });

  // Asignar rol con categoría a usuario (admin)
  app.post('/api/usuarios/:id/roles', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { rol, categoriaRolId, subcategoriaRolId, notas } = req.body;
      
      const adminId = req.user.claims.sub;
      const nuevoRol = await storage.asignarRolUsuario({
        usuarioId: id,
        rol,
        categoriaRolId: categoriaRolId || null,
        subcategoriaRolId: subcategoriaRolId || null,
        asignadoPor: adminId,
        notas: notas || null,
      });
      res.status(201).json(nuevoRol);
    } catch (error: any) {
      console.error("Error al asignar rol:", error);
      res.status(500).json({ message: error.message || "Error al asignar rol" });
    }
  });

  // Obtener roles de un usuario específico (admin)
  app.get('/api/usuarios/:id/roles', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const roles = await storage.getRolesUsuarioConDetalles(id);
      res.json(roles);
    } catch (error: any) {
      console.error("Error al obtener roles del usuario:", error);
      res.status(500).json({ message: error.message || "Error al obtener roles" });
    }
  });

  // Eliminar rol de usuario (admin)
  app.delete('/api/usuarios/:usuarioId/roles/:rolId', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { rolId } = req.params;
      await storage.removerRolUsuario(rolId);
      res.json({ message: "Rol eliminado correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar rol:", error);
      res.status(500).json({ message: error.message || "Error al eliminar rol" });
    }
  });

  // ============================================================
  // SOLICITUDES DE ROLES
  // ============================================================

  // Obtener todas las solicitudes (admin)
  app.get('/api/solicitudes-roles', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { estado } = req.query;
      const solicitudes = await storage.getSolicitudesRoles(estado as string | undefined);
      
      // Enriquecer con datos del usuario
      const solicitudesEnriquecidas = await Promise.all(solicitudes.map(async (sol) => {
        const usuario = await storage.getUser(sol.usuarioId);
        let categoria = null;
        let subcategoria = null;
        
        if (sol.categoriaRolId) {
          categoria = await storage.getCategoriaRol(sol.categoriaRolId);
        }
        if (sol.subcategoriaRolId) {
          subcategoria = await storage.getSubcategoriaRol(sol.subcategoriaRolId);
        }
        
        return {
          ...sol,
          usuario: usuario ? {
            id: usuario.id,
            nombre: `${usuario.firstName || ''} ${usuario.lastName || ''}`.trim() || usuario.email || 'Sin nombre',
            email: usuario.email,
            profileImageUrl: usuario.profileImageUrl,
          } : null,
          categoria,
          subcategoria,
        };
      }));
      
      res.json(solicitudesEnriquecidas);
    } catch (error: any) {
      console.error("Error al obtener solicitudes:", error);
      res.status(500).json({ message: error.message || "Error al obtener solicitudes" });
    }
  });

  // Mis solicitudes de rol
  app.get('/api/mis-solicitudes-roles', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const solicitudes = await storage.getSolicitudesRolesUsuario(usuarioId);
      res.json(solicitudes);
    } catch (error: any) {
      console.error("Error al obtener solicitudes:", error);
      res.status(500).json({ message: error.message || "Error al obtener solicitudes" });
    }
  });

  // Crear solicitud de rol (usuario)
  app.post('/api/solicitudes-roles', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { rol, categoriaRolId, subcategoriaRolId, comentarios } = req.body;
      
      if (!rol) {
        return res.status(400).json({ message: "Debe especificar un rol" });
      }
      
      const solicitud = await storage.createSolicitudRol({
        usuarioId,
        rol,
        categoriaRolId: categoriaRolId || null,
        subcategoriaRolId: subcategoriaRolId || null,
        comentarios: comentarios || null,
      });
      
      res.status(201).json(solicitud);
    } catch (error: any) {
      console.error("Error al crear solicitud:", error);
      res.status(500).json({ message: error.message || "Error al crear solicitud" });
    }
  });

  // Aprobar solicitud de rol (admin)
  app.post('/api/solicitudes-roles/:id/aprobar', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      
      // Obtener la solicitud
      const solicitud = await storage.getSolicitudRol(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({ message: "Esta solicitud ya fue procesada" });
      }
      
      // Aprobar la solicitud
      await storage.aprobarSolicitudRol(id, adminId);
      
      // Asignar el rol al usuario
      await storage.asignarRolUsuario({
        usuarioId: solicitud.usuarioId,
        rol: solicitud.rol,
        categoriaRolId: solicitud.categoriaRolId || null,
        subcategoriaRolId: solicitud.subcategoriaRolId || null,
        asignadoPor: adminId,
        notas: `Aprobado desde solicitud: ${solicitud.comentarios || 'Sin comentarios'}`,
      });
      
      res.json({ message: "Solicitud aprobada y rol asignado" });
    } catch (error: any) {
      console.error("Error al aprobar solicitud:", error);
      res.status(500).json({ message: error.message || "Error al aprobar solicitud" });
    }
  });

  // Rechazar solicitud de rol (admin)
  app.post('/api/solicitudes-roles/:id/rechazar', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      const { motivoRechazo } = req.body;
      
      const solicitud = await storage.getSolicitudRol(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({ message: "Esta solicitud ya fue procesada" });
      }
      
      await storage.rechazarSolicitudRol(id, adminId, motivoRechazo || 'Sin motivo especificado');
      
      res.json({ message: "Solicitud rechazada" });
    } catch (error: any) {
      console.error("Error al rechazar solicitud:", error);
      res.status(500).json({ message: error.message || "Error al rechazar solicitud" });
    }
  });

  // Lista de roles disponibles para solicitar
  app.get('/api/roles-disponibles', async (req, res) => {
    try {
      const { rolesDisponibles } = await import('@shared/schema');
      res.json(rolesDisponibles);
    } catch (error: any) {
      console.error("Error al obtener roles disponibles:", error);
      res.status(500).json({ message: error.message || "Error al obtener roles" });
    }
  });

  // Registrar rutas de administración
  registerAdminRoutes(app);

  // ============================================================
  // RUTAS DE UPLOAD DE ARCHIVOS
  // ============================================================

  app.post('/api/upload/publicidad', isAuthenticated, requireSuperAdmin, createUploadMiddleware('carrusel', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de publicidad:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/galeria', isAuthenticated, requireSuperAdmin, createUploadMiddleware('galeria', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de galería:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/servicios', isAuthenticated, requireSuperAdmin, createUploadMiddleware('servicios', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de servicios:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/documentos', isAuthenticated, createUploadMiddleware('documentos', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        tipo: req.body.tipoDocumento || 'general',
      });
    } catch (error: any) {
      console.error('Error al subir documento:', error);
      res.status(500).json({ message: error.message || 'Error al subir documento' });
    }
  });

  app.post('/api/upload/perfil-imagenes', isAuthenticated, createUploadMiddleware('locales', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de local:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen' });
    }
  });

  app.post('/api/upload/perfil-videos', isAuthenticated, createUploadMiddleware('videos', 'video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir video:', error);
      res.status(500).json({ message: error.message || 'Error al subir video' });
    }
  });

  // Upload de comprobantes de pago (boucher)
  app.post('/api/upload/comprobantes', isAuthenticated, createUploadMiddleware('comprobantes', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir comprobante:', error);
      res.status(500).json({ message: error.message || 'Error al subir comprobante' });
    }
  });

  // Upload de imágenes de productos de usuario (Mi Tienda Online)
  app.post('/api/upload/productos', isAuthenticated, createUploadMiddleware('productos', 'imagen'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
      });
    } catch (error: any) {
      console.error('Error al subir imagen de producto:', error);
      res.status(500).json({ message: error.message || 'Error al subir imagen de producto' });
    }
  });

  // ============================================================
  // RUTAS DE AUTENTICACIÓN
  // ============================================================

  // Helper para generar configuración fail-closed (solo usuario habilitado)
  const getFailClosedConfig = (): Record<string, { habilitado: boolean }> => {
    const config: Record<string, { habilitado: boolean }> = {};
    rolesRegistroValidos.forEach(rol => {
      config[rol] = { habilitado: rol === "usuario" };
    });
    return config;
  };

  // Helper para validar estructura de configuración de roles
  // Devuelve null si inválida, o el objeto validado si es correcto
  const validateAndGetRolesConfig = (valorConfig: string | null | undefined): Record<string, { habilitado: boolean }> | null => {
    // Valor nulo, undefined o vacío = inválido
    if (!valorConfig || valorConfig.trim() === '') {
      return null;
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(valorConfig);
    } catch {
      return null; // Error parsing = inválido
    }
    
    // Debe ser objeto no nulo y NO un array
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    
    // Objeto vacío {} = inválido (no es primera vez, es config corrupta/limpiada)
    if (Object.keys(parsed).length === 0) {
      return null;
    }
    
    // Validar que cada entrada de rol conocido tenga estructura correcta
    for (const [key, value] of Object.entries(parsed)) {
      if (!(rolesRegistroValidos as readonly string[]).includes(key)) continue;
      if (typeof value !== 'object' || value === null) return null;
      if (typeof (value as any).habilitado !== 'boolean') return null;
    }
    
    return parsed as Record<string, { habilitado: boolean }>;
  };

  // Helper unificado para verificar si un rol específico está habilitado
  // Devuelve: true si habilitado, false si no, null si es primera vez (sin config)
  const isRolHabilitadoEnConfig = async (rolId: string): Promise<{ habilitado: boolean; primeraVez: boolean }> => {
    // Rol "usuario" siempre está habilitado
    if (rolId === "usuario") {
      return { habilitado: true, primeraVez: false };
    }
    
    try {
      const configRoles = await storage.getConfiguracion('roles_habilitados');
      
      // CASO: No existe registro en BD = primera vez, permitir todos
      if (configRoles === null || configRoles === undefined) {
        return { habilitado: true, primeraVez: true };
      }
      
      // CASO: Existe registro, validar contenido
      const configValidada = validateAndGetRolesConfig(configRoles.valor);
      
      if (configValidada === null) {
        // Config inválida/corrupta/vacía = fail-closed
        return { habilitado: false, primeraVez: false };
      }
      
      // Config válida: verificar que el rol esté explícitamente habilitado
      if (rolId in configValidada && configValidada[rolId]?.habilitado === true) {
        return { habilitado: true, primeraVez: false };
      }
      
      // Rol no existe en config o no está habilitado = fail-closed
      return { habilitado: false, primeraVez: false };
    } catch (error) {
      console.error("Error de BD al verificar rol habilitado:", error);
      // Error de BD = fail-closed
      return { habilitado: false, primeraVez: false };
    }
  };

  // Endpoint para obtener configuración de roles habilitados
  app.get('/api/configuracion/roles', async (req, res) => {
    try {
      const configRoles = await storage.getConfiguracion('roles_habilitados');
      
      // CASO: No existe registro en BD = primera vez, todos habilitados
      if (configRoles === null || configRoles === undefined) {
        const defaultConfig: Record<string, { habilitado: boolean }> = {};
        rolesRegistroValidos.forEach(rol => {
          defaultConfig[rol] = { habilitado: true };
        });
        return res.json(defaultConfig);
      }
      
      // CASO: Existe registro, validar usando helper unificado
      const configValidada = validateAndGetRolesConfig(configRoles.valor);
      
      if (configValidada === null) {
        // Config inválida/corrupta/vacía = fail-closed
        console.warn("Configuración de roles inválida en GET, aplicando fail-closed");
        return res.json(getFailClosedConfig());
      }
      
      // Config válida con contenido
      return res.json(configValidada);
    } catch (error) {
      console.error("Error de BD al obtener configuración de roles:", error);
      // Error de BD = fail-closed
      res.json(getFailClosedConfig());
    }
  });

  // Endpoint para actualizar configuración de roles (solo super admin)
  app.put('/api/configuracion/roles', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const rolesConfig = req.body;
      
      // Validar estructura del JSON antes de guardar usando helper unificado
      // Serializamos y re-validamos para asegurar consistencia
      const jsonString = JSON.stringify(rolesConfig);
      const configValidada = validateAndGetRolesConfig(jsonString);
      
      if (configValidada === null) {
        return res.status(400).json({ 
          message: "Estructura de configuración inválida. Debe ser {rol: {habilitado: boolean}} con al menos un rol" 
        });
      }
      
      await storage.setConfiguracion({
        clave: 'roles_habilitados',
        valor: jsonString,
        tipo: 'json',
      });
      res.json({ message: "Configuración de roles actualizada", config: configValidada });
    } catch (error: any) {
      console.error("Error al actualizar configuración de roles:", error);
      res.status(500).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  // ============================================================
  // RUTA DE LOGIN (autenticación local con email/password)
  // ============================================================
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Verificar contraseña
      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      if (user.passwordHash !== passwordHash) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }

      // Verificar estado del usuario
      if (user.estado === 'inactivo' || user.estado === 'suspendido') {
        return res.status(403).json({ message: "Tu cuenta está suspendida o inactiva. Contacta al administrador." });
      }

      if (user.estado === 'pendiente_aprobacion') {
        return res.status(403).json({ message: "Tu cuenta está pendiente de aprobación por un administrador." });
      }

      // Crear sesión del usuario
      if (!req.session) {
        return res.status(500).json({ message: "Error al crear sesión" });
      }

      // Guardar datos en sesión (compatible con el sistema existente)
      const session = req.session as any;
      session.userId = user.id;
      session.user = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          rol: user.rol,
        }
      };

      // Persistir la sesión antes de responder
      session.save((err: any) => {
        if (err) {
          console.error("Error al guardar sesión:", err);
          return res.status(500).json({ message: "Error al crear sesión" });
        }

        res.json({
          message: "Login exitoso",
          user: {
            id: user.id,
            nombre: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}`.trim()
              : user.firstName || user.lastName || user.alias || 'Usuario',
            email: user.email,
            rol: user.rol,
            nivelUsuario: user.nivelUsuario,
            estado: user.estado,
            profileImageUrl: user.profileImageUrl,
          }
        });
      });
    } catch (error: any) {
      console.error("Error en login:", error);
      res.status(500).json({ message: error.message || "Error al iniciar sesión" });
    }
  });

  app.post('/api/auth/registro', async (req, res) => {
    try {
      const { 
        alias, email, password, nivelUsuario, rol, telefono,
        firstName, lastName, dni,
        dniImagenFrente, dniImagenPosterior, dniEmision, dniCaducidad,
        profileImageUrl, pais, departamento, distrito, sector,
        direccion, manzanaLote, avenidaCalle, gpsLatitud, gpsLongitud,
        nombreLocal, direccionLocal, gpsLocalLatitud, gpsLocalLongitud, ruc
      } = req.body;

      if (!alias || !email || !password) {
        return res.status(400).json({ message: "Alias, email y contraseña son requeridos" });
      }

      if (alias.length < 3 || alias.length > 50) {
        return res.status(400).json({ message: "El alias debe tener entre 3 y 50 caracteres" });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(alias)) {
        return res.status(400).json({ message: "El alias solo puede contener letras, números y guión bajo" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      // Usar helpers compartidos para validar rol
      const rolSeleccionado = rol && (rolesRegistroValidos as readonly string[]).includes(rol) 
        ? rol 
        : "usuario";
      
      // Validar que el rol esté habilitado usando helper unificado (fail-closed approach)
      const { habilitado: rolHabilitado } = await isRolHabilitadoEnConfig(rolSeleccionado);
      
      if (!rolHabilitado) {
        return res.status(400).json({ 
          message: "Este tipo de cuenta no está disponible actualmente. Por favor, selecciona otro rol o contacta al administrador." 
        });
      }
      
      // Usar helper compartido para determinar si requiere aprobación
      const requiereAprobacion = (rolesConAprobacion as readonly string[]).includes(rolSeleccionado);
      const estadoUsuario = requiereAprobacion ? "pendiente_aprobacion" : "activo";

      const crypto = await import('crypto');
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      const id = crypto.randomUUID();

      const userData: Partial<any> & { id: string } = {
        id,
        alias,
        email,
        telefono: telefono || null,
        passwordHash,
        nivelUsuario: nivelUsuario || 1,
        rol: rolSeleccionado,
        estado: estadoUsuario,
      };

      if (nivelUsuario >= 2) {
        userData.firstName = firstName;
        userData.lastName = lastName;
        userData.dni = dni;
        userData.dniImagenFrente = dniImagenFrente;
        userData.dniImagenPosterior = dniImagenPosterior;
        if (dniEmision) userData.dniEmision = dniEmision;
        if (dniCaducidad) userData.dniCaducidad = dniCaducidad;
        userData.profileImageUrl = profileImageUrl;
      }

      if (nivelUsuario >= 3) {
        userData.pais = pais;
        userData.departamento = departamento;
        userData.distrito = distrito;
        userData.sector = sector;
      }

      if (nivelUsuario >= 4) {
        userData.direccion = direccion;
        userData.manzanaLote = manzanaLote;
        userData.avenidaCalle = avenidaCalle;
        if (gpsLatitud) userData.gpsLatitud = parseFloat(gpsLatitud);
        if (gpsLongitud) userData.gpsLongitud = parseFloat(gpsLongitud);
      }

      if (nivelUsuario >= 5) {
        userData.nombreLocal = nombreLocal;
        userData.direccionLocal = direccionLocal;
        if (gpsLocalLatitud) userData.gpsLocalLatitud = parseFloat(gpsLocalLatitud);
        if (gpsLocalLongitud) userData.gpsLocalLongitud = parseFloat(gpsLocalLongitud);
        userData.ruc = ruc;
      }

      const newUser = await storage.createUser(userData);
      
      res.status(201).json({ 
        message: requiereAprobacion 
          ? "Registro enviado. Tu solicitud será revisada por un administrador."
          : "Usuario registrado exitosamente",
        user: {
          id: newUser.id,
          alias: newUser.alias,
          email: newUser.email,
          nivelUsuario: newUser.nivelUsuario,
          rol: newUser.rol,
          estado: newUser.estado,
        },
        requiereAprobacion,
      });
    } catch (error: any) {
      console.error("Error en registro:", error);
      res.status(500).json({ message: error.message || "Error al registrar usuario" });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      
      const authUser = {
        id: user.id,
        nombre: user.firstName || user.lastName || 'Usuario',
        alias: user.alias || undefined,
        email: user.email || '',
        rol: user.rol,
        rolesSuperAdmin: user.rol === 'super_admin',
        telefono: user.telefono || undefined,
        ubicacionLatitud: user.latitud || undefined,
        ubicacionLongitud: user.longitud || undefined,
        modoTaxi: user.modoTaxi === 'conductor',
        activo: user.estado === 'activo',
        imagenPerfil: user.profileImageUrl || undefined,
        primerNombre: user.firstName || undefined,
        apellido: user.lastName || undefined,
      };
      
      res.json(authUser);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ message: "Error al obtener usuario" });
    }
  });

  // Ruta para subir foto de perfil (separada porque tiene middleware de upload)
  app.post('/api/usuarios/:id/foto', isAuthenticated, createUploadMiddleware('perfiles', 'imagen'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      if (id !== userId && req.user.claims.rol !== 'super_admin') {
        return res.status(403).json({ message: "No autorizado" });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      }

      const url = getPublicUrl(req.file.path);
      const user = await storage.updateUser(id, { profileImageUrl: url });
      
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({ 
        profileImageUrl: url,
        message: "Foto de perfil actualizada"
      });
    } catch (error: any) {
      console.error("Error al subir foto de perfil:", error);
      res.status(500).json({ message: error.message || "Error al subir foto de perfil" });
    }
  });

  // ============================================================
  // RUTAS DE ESTADÍSTICAS PÚBLICAS
  // ============================================================

  app.get('/api/estadisticas/publicas', async (req, res) => {
    try {
      const stats = await storage.getEstadisticasPublicas();
      res.json(stats);
    } catch (error) {
      console.error("Error al obtener estadísticas públicas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // ============================================================
  // RUTAS DE UBICACIONES (países, departamentos, distritos)
  // ============================================================

  app.get('/api/ubicaciones/paises', async (req, res) => {
    try {
      res.json(paises);
    } catch (error) {
      console.error("Error al obtener países:", error);
      res.status(500).json({ message: "Error al obtener países" });
    }
  });

  app.get('/api/ubicaciones/departamentos', async (req, res) => {
    try {
      const pais = req.query.pais as string || 'Perú';
      const buscar = req.query.buscar as string;
      
      let resultado = obtenerDepartamentos(pais);
      if (buscar) {
        resultado = buscarDepartamentos(buscar);
      }
      
      res.json(resultado);
    } catch (error) {
      console.error("Error al obtener departamentos:", error);
      res.status(500).json({ message: "Error al obtener departamentos" });
    }
  });

  app.get('/api/ubicaciones/distritos', async (req, res) => {
    try {
      const departamento = req.query.departamento as string;
      const buscar = req.query.buscar as string;
      
      if (!departamento) {
        return res.status(400).json({ message: "Se requiere el departamento" });
      }
      
      let resultado = obtenerDistritos(departamento);
      if (buscar) {
        resultado = buscarDistritos(departamento, buscar);
      }
      
      res.json(resultado);
    } catch (error) {
      console.error("Error al obtener distritos:", error);
      res.status(500).json({ message: "Error al obtener distritos" });
    }
  });

  // ============================================================
  // RUTAS DE SECTORES (autocompletado con historial)
  // ============================================================

  app.get('/api/sectores', async (req, res) => {
    try {
      const departamento = req.query.departamento as string;
      const distrito = req.query.distrito as string;
      const buscar = req.query.buscar as string;
      
      if (buscar) {
        const sectores = await storage.buscarSectores(buscar, departamento, distrito);
        return res.json(sectores);
      }
      
      const sectores = await storage.getSectores(departamento, distrito);
      res.json(sectores);
    } catch (error) {
      console.error("Error al obtener sectores:", error);
      res.status(500).json({ message: "Error al obtener sectores" });
    }
  });

  app.post('/api/sectores', isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSectorSchema.parse(req.body);
      const sector = await storage.createSector(data);
      res.json(sector);
    } catch (error: any) {
      console.error("Error al crear sector:", error);
      res.status(400).json({ message: error.message || "Error al crear sector" });
    }
  });

  // ============================================================
  // RUTAS DE PUBLICIDAD
  // ============================================================

  app.get('/api/publicidad', async (req, res) => {
    try {
      const tipo = req.query.tipo as string | undefined;
      const publicidades = await storage.getPublicidades(tipo);
      res.json(publicidades);
    } catch (error) {
      console.error("Error al obtener publicidad:", error);
      res.status(500).json({ message: "Error al obtener publicidad" });
    }
  });

  app.post('/api/publicidad', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convertir fechas de string a Date si es necesario
      const body = { ...req.body };
      if (body.fechaInicio && typeof body.fechaInicio === 'string') {
        body.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
      }
      if (body.fechaFin && typeof body.fechaFin === 'string') {
        body.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
      }
      if (body.fechaCaducidad && typeof body.fechaCaducidad === 'string') {
        body.fechaCaducidad = body.fechaCaducidad ? new Date(body.fechaCaducidad) : null;
      }
      
      const data = insertPublicidadSchema.parse(body);
      const publicidad = await storage.createPublicidad({
        ...data,
        usuarioId: userId,
      });
      res.json(publicidad);
    } catch (error: any) {
      console.error("Error al crear publicidad:", error);
      res.status(400).json({ message: error.message || "Error al crear publicidad" });
    }
  });

  app.patch('/api/publicidad/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Convertir fechas de string a Date si es necesario
      const body = { ...req.body };
      if (body.fechaInicio && typeof body.fechaInicio === 'string') {
        body.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null;
      }
      if (body.fechaFin && typeof body.fechaFin === 'string') {
        body.fechaFin = body.fechaFin ? new Date(body.fechaFin) : null;
      }
      if (body.fechaCaducidad && typeof body.fechaCaducidad === 'string') {
        body.fechaCaducidad = body.fechaCaducidad ? new Date(body.fechaCaducidad) : null;
      }
      
      const publicidad = await storage.updatePublicidad(id, body);
      if (!publicidad) {
        return res.status(404).json({ message: "Publicidad no encontrada" });
      }
      res.json(publicidad);
    } catch (error) {
      console.error("Error al actualizar publicidad:", error);
      res.status(500).json({ message: "Error al actualizar publicidad" });
    }
  });

  app.delete('/api/publicidad/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePublicidad(id);
      res.json({ message: "Publicidad eliminada" });
    } catch (error) {
      console.error("Error al eliminar publicidad:", error);
      res.status(500).json({ message: "Error al eliminar publicidad" });
    }
  });

  // ============================================================
  // RUTAS DE INTERACCIONES DE PUBLICIDAD
  // ============================================================

  // Obtener contadores de una publicidad
  app.get('/api/publicidad/:id/contadores', async (req, res) => {
    try {
      const { id } = req.params;
      const contadores = await storage.getContadoresPublicidad(id);
      res.json(contadores || { likes: 0, favoritos: 0, compartidos: 0, impresiones: 0, comentarios: 0, agendados: 0 });
    } catch (error) {
      console.error("Error al obtener contadores:", error);
      res.status(500).json({ message: "Error al obtener contadores" });
    }
  });

  // Verificar si el usuario ha interactuado (like, favorito)
  app.get('/api/publicidad/:id/mis-interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const interacciones = await storage.getInteraccionesUsuario(id, userId);
      res.json(interacciones);
    } catch (error) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  // Toggle like
  app.post('/api/publicidad/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.toggleLikePublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al dar like:", error);
      res.status(500).json({ message: "Error al dar like" });
    }
  });

  // Toggle favorito
  app.post('/api/publicidad/:id/favorito', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.toggleFavoritoPublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al marcar favorito:", error);
      res.status(500).json({ message: "Error al marcar favorito" });
    }
  });

  // Registrar compartido
  app.post('/api/publicidad/:id/compartir', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { redSocial } = req.body;
      const resultado = await storage.registrarCompartidoPublicidad(id, userId, redSocial);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar compartido:", error);
      res.status(500).json({ message: "Error al registrar compartido" });
    }
  });

  // Registrar impresión (imprimir)
  app.post('/api/publicidad/:id/impresion', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.registrarImpresionPublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar impresión:", error);
      res.status(500).json({ message: "Error al registrar impresión" });
    }
  });

  // Registrar agenda (Google Calendar)
  app.post('/api/publicidad/:id/agenda', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.registrarAgendaPublicidad(id, userId);
      res.json(resultado);
    } catch (error) {
      console.error("Error al registrar agenda:", error);
      res.status(500).json({ message: "Error al registrar agenda" });
    }
  });

  // Obtener comentarios de una publicidad
  app.get('/api/publicidad/:id/comentarios', async (req, res) => {
    try {
      const { id } = req.params;
      const comentarios = await storage.getComentariosPublicidad(id);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  // Crear comentario
  app.post('/api/publicidad/:id/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { contenido } = req.body;
      
      if (!contenido || contenido.trim().length === 0) {
        return res.status(400).json({ message: "El comentario no puede estar vacío" });
      }
      
      const comentario = await storage.crearComentarioPublicidad(id, userId, contenido);
      res.json(comentario);
    } catch (error) {
      console.error("Error al crear comentario:", error);
      res.status(500).json({ message: "Error al crear comentario" });
    }
  });

  // Eliminar comentario (solo el autor)
  app.delete('/api/publicidad/:publicidadId/comentarios/:comentarioId', isAuthenticated, async (req: any, res) => {
    try {
      const { comentarioId } = req.params;
      const userId = req.user.claims.sub;
      await storage.eliminarComentarioPublicidad(comentarioId, userId);
      res.json({ message: "Comentario eliminado" });
    } catch (error: any) {
      console.error("Error al eliminar comentario:", error);
      res.status(400).json({ message: error.message || "Error al eliminar comentario" });
    }
  });

  // Obtener favoritos del usuario
  app.get('/api/usuarios/me/favoritos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoritos = await storage.getFavoritosUsuario(userId);
      res.json(favoritos);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ message: "Error al obtener favoritos" });
    }
  });

  // ============================================================
  // RUTAS DE WIDGETS EMBEBIBLES
  // ============================================================

  // Obtener todos los widgets (admin)
  app.get('/api/widgets', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const widgets = await db.select().from(widgetsEmbebibles).orderBy(desc(widgetsEmbebibles.createdAt));
      res.json(widgets);
    } catch (error) {
      console.error("Error al obtener widgets:", error);
      res.status(500).json({ message: "Error al obtener widgets" });
    }
  });

  // Crear nuevo widget
  app.post('/api/widgets', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      const apiKey = crypto.randomBytes(32).toString('hex');
      const [widget] = await db.insert(widgetsEmbebibles).values({
        ...data,
        apiKey: data.requiereApiKey ? apiKey : null,
      }).returning();
      res.json(widget);
    } catch (error) {
      console.error("Error al crear widget:", error);
      res.status(500).json({ message: "Error al crear widget" });
    }
  });

  // Actualizar widget
  app.patch('/api/widgets/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const [widget] = await db.update(widgetsEmbebibles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(widgetsEmbebibles.id, id))
        .returning();
      res.json(widget);
    } catch (error) {
      console.error("Error al actualizar widget:", error);
      res.status(500).json({ message: "Error al actualizar widget" });
    }
  });

  // Eliminar widget
  app.delete('/api/widgets/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(widgetsEmbebibles).where(eq(widgetsEmbebibles.id, id));
      res.json({ message: "Widget eliminado" });
    } catch (error) {
      console.error("Error al eliminar widget:", error);
      res.status(500).json({ message: "Error al eliminar widget" });
    }
  });

  // ========== ENDPOINTS PÚBLICOS PARA WIDGETS ==========

  // Obtener datos de widget (público - para sitios externos)
  app.get('/api/embed/:widgetId', async (req, res) => {
    try {
      const { widgetId } = req.params;
      const apiKey = req.query.key as string;
      const origen = req.headers.origin || req.headers.referer || '';

      const [widget] = await db.select().from(widgetsEmbebibles).where(eq(widgetsEmbebibles.id, widgetId));
      
      if (!widget || !widget.activo) {
        return res.status(404).json({ message: "Widget no encontrado o inactivo" });
      }

      // Verificar API key si es requerida
      if (widget.requiereApiKey && widget.apiKey !== apiKey) {
        return res.status(401).json({ message: "API key inválida" });
      }

      // Verificar dominio permitido
      if (widget.dominiosPermitidos && widget.dominiosPermitidos.length > 0) {
        const dominioPermitido = widget.dominiosPermitidos.some(d => origen.includes(d));
        if (!dominioPermitido) {
          return res.status(403).json({ message: "Dominio no autorizado" });
        }
      }

      // Incrementar visualizaciones
      await db.update(widgetsEmbebibles)
        .set({ totalVisualizaciones: (widget.totalVisualizaciones || 0) + 1 })
        .where(eq(widgetsEmbebibles.id, widgetId));

      // Obtener datos según el tipo de widget
      let datos: any = [];
      switch (widget.tipo) {
        case 'carrusel_logos':
        case 'logos_servicios':
          datos = await db.select().from(logosServicios).where(eq(logosServicios.activo, true)).limit(widget.limite || 10);
          break;
        case 'slider_principal':
          datos = await db.select().from(publicidad).where(eq(publicidad.tipo, 'slider')).limit(widget.limite || 10);
          break;
        case 'productos_destacados':
          datos = await db.select().from(itemsCatalogo).where(eq(itemsCatalogo.destacado, true)).limit(widget.limite || 10);
          break;
        case 'productos_recientes':
          datos = await db.select().from(itemsCatalogo).orderBy(desc(itemsCatalogo.createdAt)).limit(widget.limite || 10);
          break;
        case 'categorias_servicios':
          datos = await db.select().from(categoriasServicio).where(eq(categoriasServicio.activo, true));
          break;
        case 'radio_listas':
          const radios = await db.select().from(radiosOnline).where(eq(radiosOnline.activo, true)).limit(5);
          const listas = await db.select().from(listasMp3).where(eq(listasMp3.activo, true)).limit(5);
          datos = { radios, listas };
          break;
        case 'popup_emergencia':
        case 'encuestas':
          datos = await db.select().from(publicidad).where(eq(publicidad.tipo, widget.tipo === 'popup_emergencia' ? 'popup' : 'encuesta')).limit(1);
          break;
        default:
          datos = [];
      }

      res.json({
        widget: {
          id: widget.id,
          tipo: widget.tipo,
          nombre: widget.nombre,
          config: {
            ancho: widget.ancho,
            alto: widget.alto,
            colorFondo: widget.colorFondo,
            colorTexto: widget.colorTexto,
            bordes: widget.bordes,
            autoplay: widget.autoplay,
            intervalo: widget.intervalo,
            itemsPorVista: widget.itemsPorVista,
            mostrarControles: widget.mostrarControles,
            estilosPersonalizados: widget.estilosPersonalizados,
          }
        },
        datos
      });
    } catch (error) {
      console.error("Error al obtener datos del widget:", error);
      res.status(500).json({ message: "Error al obtener datos del widget" });
    }
  });

  // Servir archivo JavaScript embebible
  app.get('/widget.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const js = `
(function() {
  var APO360Widget = {
    baseUrl: '${baseUrl}',
    
    init: function(config) {
      var container = document.getElementById(config.containerId);
      if (!container) {
        console.error('APO360 Widget: Container not found');
        return;
      }
      
      var url = this.baseUrl + '/api/embed/' + config.widgetId;
      if (config.apiKey) url += '?key=' + config.apiKey;
      
      fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.message) {
            container.innerHTML = '<p style="color:red;">' + data.message + '</p>';
            return;
          }
          APO360Widget.render(container, data);
        })
        .catch(function(e) {
          container.innerHTML = '<p style="color:red;">Error al cargar widget</p>';
        });
    },
    
    render: function(container, data) {
      var w = data.widget;
      var c = w.config;
      var items = Array.isArray(data.datos) ? data.datos : [];
      
      container.style.width = c.ancho || '100%';
      container.style.height = c.alto || 'auto';
      container.style.backgroundColor = c.colorFondo || 'transparent';
      if (c.colorTexto) container.style.color = c.colorTexto;
      if (c.bordes) container.style.border = '1px solid #ccc';
      container.style.overflow = 'hidden';
      
      var html = '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;padding:10px;">';
      
      if (w.tipo === 'carrusel_logos' || w.tipo === 'logos_servicios') {
        items.forEach(function(item) {
          html += '<a href="' + (item.enlace || '#') + '" target="_blank" style="display:block;width:80px;height:80px;">';
          html += '<img src="' + (item.imagenUrl || item.imagen) + '" style="width:100%;height:100%;object-fit:contain;" alt="' + (item.nombre || '') + '">';
          html += '</a>';
        });
      } else if (w.tipo === 'productos_destacados' || w.tipo === 'productos_recientes') {
        items.forEach(function(item) {
          html += '<div style="width:150px;text-align:center;padding:10px;border:1px solid #eee;border-radius:8px;">';
          if (item.imagenes && item.imagenes[0]) {
            html += '<img src="' + item.imagenes[0] + '" style="width:100%;height:100px;object-fit:cover;border-radius:4px;">';
          }
          html += '<p style="margin:5px 0;font-weight:bold;font-size:12px;">' + (item.nombre || '') + '</p>';
          if (item.precio) html += '<p style="margin:0;color:#8B5CF6;">S/ ' + item.precio + '</p>';
          html += '</div>';
        });
      } else if (w.tipo === 'categorias_servicios') {
        items.forEach(function(item) {
          html += '<div style="padding:8px 16px;background:#f5f5f5;border-radius:20px;font-size:14px;">' + (item.nombre || '') + '</div>';
        });
      } else if (w.tipo === 'radio_listas') {
        var radios = data.datos.radios || [];
        html += '<div style="width:100%;"><strong>Radios Online:</strong><ul style="margin:5px 0;">';
        radios.forEach(function(r) {
          html += '<li>' + r.nombre + '</li>';
        });
        html += '</ul></div>';
      } else {
        html += '<p>Widget tipo: ' + w.tipo + '</p>';
      }
      
      html += '</div>';
      if (c.estilosPersonalizados) {
        html += '<style>' + c.estilosPersonalizados + '</style>';
      }
      
      container.innerHTML = html;
    }
  };
  
  window.APO360Widget = APO360Widget;
})();
`;
    res.send(js);
  });

  // Registrar click en widget (para estadísticas)
  app.post('/api/embed/:widgetId/click', async (req, res) => {
    try {
      const { widgetId } = req.params;
      const [widget] = await db.select().from(widgetsEmbebibles).where(eq(widgetsEmbebibles.id, widgetId));
      if (widget) {
        await db.update(widgetsEmbebibles)
          .set({ totalClicks: (widget.totalClicks || 0) + 1 })
          .where(eq(widgetsEmbebibles.id, widgetId));
      }
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: "Error" });
    }
  });

  // Generar código de embed para un widget
  app.get('/api/widgets/:id/embed-code', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const [widget] = await db.select().from(widgetsEmbebibles).where(eq(widgetsEmbebibles.id, id));
      
      if (!widget) {
        return res.status(404).json({ message: "Widget no encontrado" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const apiKeyParam = widget.requiereApiKey ? `, apiKey: '${widget.apiKey}'` : '';
      
      const embedCode = `<!-- APO-360 Widget: ${widget.nombre} -->
<div id="apo360-widget-${widget.id}"></div>
<script src="${baseUrl}/widget.js"></script>
<script>
  APO360Widget.init({
    containerId: 'apo360-widget-${widget.id}',
    widgetId: '${widget.id}'${apiKeyParam}
  });
</script>`;

      res.json({ 
        embedCode,
        widget,
        previewUrl: `${baseUrl}/api/embed/${widget.id}`
      });
    } catch (error) {
      console.error("Error al generar código embed:", error);
      res.status(500).json({ message: "Error al generar código" });
    }
  });

  // ============================================================
  // RUTAS DE CHAT COMUNITARIO
  // ============================================================

  // Obtener todos los grupos de chat (admin)
  app.get('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const grupos = await storage.getGruposChat();
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      res.status(500).json({ message: "Error al obtener grupos de chat" });
    }
  });

  // Obtener grupos de chat del usuario autenticado
  app.get('/api/chat/mis-grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grupos = await storage.getGruposPorUsuario(userId);
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos del usuario:", error);
      res.status(500).json({ message: "Error al obtener tus grupos" });
    }
  });

  // Obtener grupos de emergencia (policía, bomberos, etc.)
  app.get('/api/chat/grupos-emergencia', async (req, res) => {
    try {
      const grupos = await storage.getGruposEmergencia();
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos de emergencia:", error);
      res.status(500).json({ message: "Error al obtener grupos de emergencia" });
    }
  });

  // Obtener un grupo específico
  app.get('/api/chat/grupos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const grupo = await storage.getGrupo(id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      res.json(grupo);
    } catch (error) {
      console.error("Error al obtener grupo:", error);
      res.status(500).json({ message: "Error al obtener grupo" });
    }
  });

  // Verificar si usuario puede acceder a un grupo
  app.get('/api/chat/grupos/:id/acceso', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const resultado = await storage.puedeAccederChat(userId, id);
      res.json(resultado);
    } catch (error) {
      console.error("Error al verificar acceso:", error);
      res.status(500).json({ message: "Error al verificar acceso" });
    }
  });

  // Crear grupo de chat
  app.post('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGrupoChatSchema.parse(req.body);
      const grupo = await storage.createGrupo({
        ...data,
        creadorId: userId,
        adminGrupoId: userId,
      });
      res.json(grupo);
    } catch (error: any) {
      console.error("Error al crear grupo:", error);
      res.status(400).json({ message: error.message || "Error al crear grupo" });
    }
  });

  // Actualizar grupo de chat
  app.patch('/api/chat/grupos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que sea admin del grupo o super_admin
      const grupo = await storage.getGrupo(id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      
      const miembro = await storage.getMiembroGrupo(id, userId);
      const user = await storage.getUser(userId);
      
      if (!miembro || (miembro.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para editar este grupo" });
      }
      
      const grupoActualizado = await storage.updateGrupoChat(id, req.body);
      res.json(grupoActualizado);
    } catch (error: any) {
      console.error("Error al actualizar grupo:", error);
      res.status(400).json({ message: error.message || "Error al actualizar grupo" });
    }
  });

  // Suspender grupo de chat
  app.post('/api/chat/grupos/:id/suspender', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      const grupo = await storage.suspenderGrupo(id, motivo || "Suspendido por administrador");
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      res.json(grupo);
    } catch (error) {
      console.error("Error al suspender grupo:", error);
      res.status(500).json({ message: "Error al suspender grupo" });
    }
  });

  // Activar grupo de chat
  app.post('/api/chat/grupos/:id/activar', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const grupo = await storage.activarGrupo(id);
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      res.json(grupo);
    } catch (error) {
      console.error("Error al activar grupo:", error);
      res.status(500).json({ message: "Error al activar grupo" });
    }
  });

  // Eliminar grupo de chat
  app.delete('/api/chat/grupos/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteGrupoChat(id);
      res.json({ message: "Grupo eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar grupo:", error);
      res.status(500).json({ message: "Error al eliminar grupo" });
    }
  });

  // ============================================================
  // MIEMBROS DE GRUPO
  // ============================================================

  // Obtener miembros de un grupo
  app.get('/api/chat/grupos/:grupoId/miembros', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const miembros = await storage.getMiembrosGrupo(grupoId);
      res.json(miembros);
    } catch (error) {
      console.error("Error al obtener miembros:", error);
      res.status(500).json({ message: "Error al obtener miembros" });
    }
  });

  // Agregar miembro a grupo
  app.post('/api/chat/grupos/:grupoId/miembros', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const { usuarioId, rol = 'miembro' } = req.body;
      const userId = req.user.claims.sub;
      
      // Verificar que sea admin del grupo
      const miembroActual = await storage.getMiembroGrupo(grupoId, userId);
      const user = await storage.getUser(userId);
      
      if (!miembroActual || (miembroActual.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para agregar miembros" });
      }
      
      const miembro = await storage.agregarMiembroGrupo({
        grupoId,
        usuarioId,
        rol,
      });
      res.json(miembro);
    } catch (error: any) {
      console.error("Error al agregar miembro:", error);
      res.status(400).json({ message: error.message || "Error al agregar miembro" });
    }
  });

  // Unirse a un grupo (usuario se une a sí mismo)
  app.post('/api/chat/grupos/:grupoId/unirse', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que pueda acceder
      const acceso = await storage.puedeAccederChat(userId, grupoId);
      if (acceso.puede) {
        return res.status(400).json({ message: "Ya eres miembro de este grupo" });
      }
      
      // Verificar nivel de estrellas
      const nivelUsuario = await storage.verificarNivelUsuario(userId);
      const grupo = await storage.getGrupo(grupoId);
      
      if (!grupo) {
        return res.status(404).json({ message: "Grupo no encontrado" });
      }
      
      if (nivelUsuario < (grupo.estrellasMinimas || 3)) {
        return res.status(403).json({ 
          message: `Necesitas ${grupo.estrellasMinimas || 3} estrellas para unirte. Tienes ${nivelUsuario} estrellas.` 
        });
      }
      
      const miembro = await storage.agregarMiembroGrupo({
        grupoId,
        usuarioId: userId,
        rol: 'miembro',
      });
      res.json(miembro);
    } catch (error: any) {
      console.error("Error al unirse al grupo:", error);
      res.status(400).json({ message: error.message || "Error al unirse al grupo" });
    }
  });

  // Actualizar rol de miembro
  app.patch('/api/chat/grupos/:grupoId/miembros/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId, usuarioId } = req.params;
      const adminId = req.user.claims.sub;
      
      const miembroAdmin = await storage.getMiembroGrupo(grupoId, adminId);
      const user = await storage.getUser(adminId);
      
      if (!miembroAdmin || (miembroAdmin.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para editar miembros" });
      }
      
      const miembro = await storage.updateMiembroGrupo(grupoId, usuarioId, req.body);
      if (!miembro) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      res.json(miembro);
    } catch (error: any) {
      console.error("Error al actualizar miembro:", error);
      res.status(400).json({ message: error.message || "Error al actualizar miembro" });
    }
  });

  // Suspender miembro
  app.post('/api/chat/grupos/:grupoId/miembros/:usuarioId/suspender', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId, usuarioId } = req.params;
      const { motivo } = req.body;
      const adminId = req.user.claims.sub;
      
      const miembroAdmin = await storage.getMiembroGrupo(grupoId, adminId);
      const user = await storage.getUser(adminId);
      
      if (!miembroAdmin || (miembroAdmin.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para suspender miembros" });
      }
      
      const miembro = await storage.suspenderMiembroGrupo(grupoId, usuarioId, motivo || "Suspendido por administrador del grupo");
      if (!miembro) {
        return res.status(404).json({ message: "Miembro no encontrado" });
      }
      res.json(miembro);
    } catch (error) {
      console.error("Error al suspender miembro:", error);
      res.status(500).json({ message: "Error al suspender miembro" });
    }
  });

  // Remover miembro del grupo
  app.delete('/api/chat/grupos/:grupoId/miembros/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId, usuarioId } = req.params;
      const adminId = req.user.claims.sub;
      
      // Permitir que el usuario se remueva a sí mismo
      if (usuarioId === adminId) {
        await storage.removerMiembroGrupo(grupoId, usuarioId);
        return res.json({ message: "Has salido del grupo" });
      }
      
      const miembroAdmin = await storage.getMiembroGrupo(grupoId, adminId);
      const user = await storage.getUser(adminId);
      
      if (!miembroAdmin || (miembroAdmin.rol !== 'admin' && user?.rol !== 'super_admin')) {
        return res.status(403).json({ message: "No tienes permisos para remover miembros" });
      }
      
      await storage.removerMiembroGrupo(grupoId, usuarioId);
      res.json({ message: "Miembro removido del grupo" });
    } catch (error) {
      console.error("Error al remover miembro:", error);
      res.status(500).json({ message: "Error al remover miembro" });
    }
  });

  // ============================================================
  // MENSAJES DE CHAT
  // ============================================================

  // Obtener mensajes de un grupo
  app.get('/api/chat/grupos/:grupoId/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      const limite = parseInt(req.query.limite as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Verificar acceso
      const acceso = await storage.puedeAccederChat(userId, grupoId);
      if (!acceso.puede) {
        return res.status(403).json({ message: acceso.razon });
      }
      
      const mensajes = await storage.getMensajesGrupoConPaginacion(grupoId, limite, offset);
      
      // Marcar mensajes como leídos
      await storage.marcarMensajesComoLeidos(grupoId, userId);
      
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  // Enviar mensaje a un grupo
  app.post('/api/chat/grupos/:grupoId/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar acceso
      const acceso = await storage.puedeAccederChat(userId, grupoId);
      if (!acceso.puede) {
        return res.status(403).json({ message: acceso.razon });
      }
      
      const user = await storage.getUser(userId);
      
      const mensaje = await storage.createMensaje({
        grupoId,
        remitenteId: userId,
        contenido: req.body.contenido,
        tipo: req.body.tipoContenido || 'texto',
        archivoUrl: req.body.archivoUrl,
        gpsLatitud: req.body.gpsLatitud,
        gpsLongitud: req.body.gpsLongitud,
        metadataFoto: req.body.metadataFoto ? {
          nombreUsuario: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Usuario',
          logoUrl: user?.profileImageUrl,
          fechaHora: new Date().toISOString(),
        } : undefined,
      });
      
      res.json(mensaje);
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      res.status(400).json({ message: error.message || "Error al enviar mensaje" });
    }
  });

  // Subir archivo para mensaje (imagen, audio, documento)
  app.post('/api/chat/upload', isAuthenticated, createUploadMiddleware('chat', 'archivo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
      }

      const url = getPublicUrl(req.file.path);
      res.json({ 
        url, 
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error: any) {
      console.error('Error al subir archivo de chat:', error);
      res.status(500).json({ message: error.message || 'Error al subir archivo' });
    }
  });

  // Eliminar mensaje (soft delete)
  app.delete('/api/chat/mensajes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const mensaje = await storage.eliminarMensaje(id, userId);
      if (!mensaje) {
        return res.status(404).json({ message: "Mensaje no encontrado" });
      }
      res.json({ message: "Mensaje eliminado" });
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
      res.status(500).json({ message: "Error al eliminar mensaje" });
    }
  });

  // Actualizar estado de mensaje (enviado -> entregado -> leído)
  app.patch('/api/chat/mensajes/:id/estado', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { estado } = req.body;
      
      if (!['enviado', 'entregado', 'leido'].includes(estado)) {
        return res.status(400).json({ message: "Estado inválido" });
      }
      
      // Primero obtener el mensaje para verificar pertenencia al grupo
      const mensajeActual = await db.select().from(mensajes).where(eq(mensajes.id, id)).limit(1);
      if (!mensajeActual || mensajeActual.length === 0) {
        return res.status(404).json({ message: "Mensaje no encontrado" });
      }
      
      const grupoId = mensajeActual[0].grupoId;
      
      // Verificar que el usuario pertenece al grupo
      const miembro = await db.select().from(miembrosGrupo)
        .where(and(
          eq(miembrosGrupo.grupoId, grupoId),
          eq(miembrosGrupo.usuarioId, userId)
        ))
        .limit(1);
      
      if (!miembro || miembro.length === 0) {
        return res.status(403).json({ message: "No tienes acceso a este mensaje" });
      }
      
      const timestamp = new Date();
      const updateData: any = { estadoMensaje: estado };
      
      if (estado === 'entregado') {
        updateData.entregadoEn = timestamp;
      } else if (estado === 'leido') {
        updateData.leidoEn = timestamp;
        updateData.leido = true;
      }
      
      await db.update(mensajes)
        .set(updateData)
        .where(eq(mensajes.id, id));
      
      res.json({ 
        message: "Estado actualizado",
        estado,
        timestamp: timestamp.toISOString(),
        grupoId,
      });
    } catch (error) {
      console.error("Error al actualizar estado de mensaje:", error);
      res.status(500).json({ message: "Error al actualizar estado" });
    }
  });

  // Marcar mensajes como leídos en un grupo
  app.post('/api/chat/grupos/:grupoId/marcar-leidos', isAuthenticated, async (req: any, res) => {
    try {
      const { grupoId } = req.params;
      const userId = req.user.claims.sub;
      const timestamp = new Date();
      
      // Verificar que el usuario pertenece al grupo
      const miembro = await db.select().from(miembrosGrupo)
        .where(and(
          eq(miembrosGrupo.grupoId, grupoId),
          eq(miembrosGrupo.usuarioId, userId)
        ))
        .limit(1);
      
      if (!miembro || miembro.length === 0) {
        return res.status(403).json({ message: "No tienes acceso a este grupo" });
      }
      
      // Marcar mensajes de otros usuarios como leídos (solo los no leídos)
      const result = await db.update(mensajes)
        .set({ 
          leido: true,
          leidoEn: timestamp,
          estadoMensaje: 'leido',
        })
        .where(
          and(
            eq(mensajes.grupoId, grupoId),
            ne(mensajes.remitenteId, userId),
            eq(mensajes.leido, false)
          )
        )
        .returning();
      
      // Actualizar contador de mensajes no leídos en miembros_grupo
      await db.update(miembrosGrupo)
        .set({ 
          mensajesNoLeidos: 0,
          ultimoMensajeVisto: timestamp,
        })
        .where(
          and(
            eq(miembrosGrupo.grupoId, grupoId),
            eq(miembrosGrupo.usuarioId, userId)
          )
        );
      
      res.json({ 
        message: "Mensajes marcados como leídos",
        mensajesActualizados: result.length,
      });
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
      res.status(500).json({ message: "Error al marcar mensajes" });
    }
  });

  // Historial de mensajes (últimos 30 días)
  app.get('/api/chat/grupos/:grupoId/historial', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { grupoId } = req.params;
      const dias = parseInt(req.query.dias as string) || 30;
      
      const fechaDesde = new Date();
      fechaDesde.setDate(fechaDesde.getDate() - dias);
      
      const mensajes = await storage.getMensajesHistorico(grupoId, fechaDesde);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({ message: "Error al obtener historial" });
    }
  });

  // ============================================================
  // RUTAS DE CONTACTOS E INVITACIONES
  // ============================================================

  // Obtener contactos del usuario (simulado - en producción conectaría con Google Contacts)
  app.get('/api/contactos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Obtener todos los usuarios registrados como "contactos potenciales"
      const usuarios = await storage.getAllUsers();
      
      const contactos = usuarios
        .filter(u => u.id !== userId)
        .map(u => ({
          id: u.id,
          nombre: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email?.split('@')[0] || 'Usuario',
          email: u.email || '',
          telefono: u.telefono,
          avatarUrl: u.profileImageUrl,
          registrado: true,
        }));
      
      res.json(contactos);
    } catch (error) {
      console.error("Error al obtener contactos:", error);
      res.status(500).json({ message: "Error al obtener contactos" });
    }
  });

  // Enviar invitación por correo o WhatsApp
  app.post('/api/invitaciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { email, telefono, metodo } = req.body;
      
      if (metodo === 'whatsapp') {
        if (!telefono) {
          return res.status(400).json({ message: "Número de teléfono requerido" });
        }
        
        // Limpiar número de teléfono y agregar prefijo de Perú si no tiene
        let numeroLimpio = telefono.replace(/[^0-9+]/g, '');
        
        // Si empieza con 0, quitarlo (ej: 052 -> 52)
        if (numeroLimpio.startsWith('0')) {
          numeroLimpio = numeroLimpio.substring(1);
        }
        
        // Si no tiene prefijo de país, agregar +51 (Perú)
        if (!numeroLimpio.startsWith('+') && !numeroLimpio.startsWith('51')) {
          numeroLimpio = '51' + numeroLimpio;
        } else if (numeroLimpio.startsWith('+')) {
          numeroLimpio = numeroLimpio.substring(1);
        }
        
        // Para WhatsApp, generamos el enlace de invitación
        const enlace = `${req.protocol}://${req.get('host')}/registro`;
        const mensaje = encodeURIComponent(`¡Hola! Te invito a unirte a APO-360, la app de seguridad comunitaria de Tacna. Regístrate aquí: ${enlace}`);
        const whatsappUrl = `https://wa.me/${numeroLimpio}?text=${mensaje}`;
        
        console.log(`📱 Invitación WhatsApp generada para ${numeroLimpio}`);
        
        return res.json({ 
          message: "Enlace de WhatsApp generado",
          whatsappUrl,
          numeroFormateado: numeroLimpio,
          enviada: true
        });
      }
      
      // Invitación por email
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Email inválido" });
      }
      
      // Verificar si ya está registrado
      const usuarioExistente = await storage.getUserByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ message: "Este usuario ya está registrado en APO-360" });
      }
      
      const remitente = await storage.getUser(userId);
      const nombreRemitente = `${remitente?.firstName || ''} ${remitente?.lastName || ''}`.trim() || 'Un usuario';
      
      // En producción, aquí enviaríamos el correo con nodemailer
      console.log(`📧 Invitación enviada a ${email} por ${nombreRemitente}`);
      
      res.json({ 
        message: "Invitación enviada exitosamente",
        email,
        enviada: true
      });
    } catch (error) {
      console.error("Error al enviar invitación:", error);
      res.status(500).json({ message: "Error al enviar invitación" });
    }
  });

  // Crear o obtener conversación privada 1-a-1
  app.post('/api/chat/conversaciones-privadas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contactoId } = req.body;
      
      if (!contactoId) {
        return res.status(400).json({ message: "Se requiere el ID del contacto" });
      }

      // Verificar que el contacto existe
      const contacto = await storage.getUser(contactoId);
      if (!contacto) {
        return res.status(404).json({ message: "Contacto no encontrado" });
      }

      // Buscar si ya existe una conversación privada entre estos dos usuarios
      const gruposUsuario = await storage.getGruposPorUsuario(userId);
      let grupoPrivado = gruposUsuario.find(g => {
        if (g.tipo !== 'privado') return false;
        // El nombre del grupo privado tiene formato: "privado_userId1_userId2"
        const ids = [userId, contactoId].sort();
        return g.nombre === `privado_${ids[0]}_${ids[1]}`;
      });

      if (!grupoPrivado) {
        // Crear nuevo grupo privado
        const ids = [userId, contactoId].sort();
        const nuevoGrupo = await storage.createGrupo({
          nombre: `privado_${ids[0]}_${ids[1]}`,
          tipo: 'privado',
          descripcion: 'Conversación privada',
          creadorId: userId,
        });

        // Agregar al contacto como miembro (el creador ya se agrega automáticamente en createGrupo)
        await storage.agregarMiembroGrupo({
          grupoId: nuevoGrupo.id,
          usuarioId: contactoId,
          rol: 'miembro',
        });

        grupoPrivado = nuevoGrupo;
      }

      // Enriquecer con datos del contacto para mostrar en UI
      const nombreContacto = `${contacto.firstName || ''} ${contacto.lastName || ''}`.trim() || contacto.email?.split('@')[0] || 'Usuario';

      res.json({
        ...grupoPrivado,
        nombreMostrar: nombreContacto,
        avatarContacto: contacto.profileImageUrl,
        contactoId: contacto.id,
      });
    } catch (error) {
      console.error("Error al crear conversación privada:", error);
      res.status(500).json({ message: "Error al crear conversación privada" });
    }
  });

  // ============================================================
  // RUTAS DE SERVICIOS
  // ============================================================

  app.get('/api/servicios', async (req, res) => {
    try {
      const servicios = await storage.getServicios();
      res.json(servicios);
    } catch (error) {
      console.error("Error al obtener servicios:", error);
      res.status(500).json({ message: "Error al obtener servicios" });
    }
  });

  app.get('/api/servicios/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const servicio = await storage.getServicio(id);
      if (!servicio) {
        return res.status(404).json({ message: "Servicio no encontrado" });
      }
      res.json(servicio);
    } catch (error) {
      console.error("Error al obtener servicio:", error);
      res.status(500).json({ message: "Error al obtener servicio" });
    }
  });

  app.get('/api/servicios/:id/productos', async (req, res) => {
    try {
      const { id } = req.params;
      const productos = await storage.getProductosPorServicio(id);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.post('/api/servicios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertServicioSchema.parse(req.body);
      const servicio = await storage.createServicio({
        ...data,
        usuarioId: userId,
      });
      res.json(servicio);
    } catch (error: any) {
      console.error("Error al crear servicio:", error);
      res.status(400).json({ message: error.message || "Error al crear servicio" });
    }
  });

  // ============================================================
  // RUTAS DE CHAT
  // ============================================================

  app.get('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const grupos = await storage.getGruposPorUsuario(userId);
      res.json(grupos);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      res.status(500).json({ message: "Error al obtener grupos" });
    }
  });

  app.post('/api/chat/grupos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertGrupoChatSchema.parse(req.body);
      const grupo = await storage.createGrupo({
        ...data,
        creadorId: userId,
      });
      
      // Agregar al creador como miembro
      await storage.agregarMiembroGrupo({
        grupoId: grupo.id,
        usuarioId: userId,
        rol: 'admin',
      });
      
      res.json(grupo);
    } catch (error: any) {
      console.error("Error al crear grupo:", error);
      res.status(400).json({ message: error.message || "Error al crear grupo" });
    }
  });

  app.get('/api/chat/mensajes/:grupoId', isAuthenticated, async (req, res) => {
    try {
      const { grupoId } = req.params;
      const mensajes = await storage.getMensajesPorGrupo(grupoId);
      res.json(mensajes);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      res.status(500).json({ message: "Error al obtener mensajes" });
    }
  });

  app.post('/api/chat/mensajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertMensajeSchema.parse(req.body);
      const mensaje = await storage.createMensaje({
        ...data,
        remitenteId: userId,
      });
      
      // Emitir mensaje a través de WebSocket (se manejará después)
      res.json(mensaje);
    } catch (error: any) {
      console.error("Error al crear mensaje:", error);
      res.status(400).json({ message: error.message || "Error al crear mensaje" });
    }
  });

  // ============================================================
  // RUTAS DE EMERGENCIAS
  // ============================================================

  app.get('/api/emergencias', isAuthenticated, async (req, res) => {
    try {
      const emergencias = await storage.getEmergencias();
      res.json(emergencias);
    } catch (error) {
      console.error("Error al obtener emergencias:", error);
      res.status(500).json({ message: "Error al obtener emergencias" });
    }
  });

  app.get('/api/emergencias/recientes', async (req, res) => {
    try {
      const limite = parseInt(req.query.limite as string) || 10;
      const emergencias = await storage.getEmergenciasRecientes(limite);
      res.json(emergencias);
    } catch (error) {
      console.error("Error al obtener emergencias recientes:", error);
      res.status(500).json({ message: "Error al obtener emergencias recientes" });
    }
  });

  app.post('/api/emergencias', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        serviciosDestino = [], 
        notificarFamilia = false, 
        notificarGrupoChat = false, 
        contactosFamiliaresIds = [],
        gruposDestino = [],
        ...dataEmergencia 
      } = req.body;
      
      const data = insertEmergenciaSchema.parse(dataEmergencia);
      const emergencia = await storage.createEmergencia({
        ...data,
        usuarioId: userId,
      });
      
      const usuario = await storage.getUser(userId);
      const nombreUsuario = usuario?.firstName && usuario?.lastName 
        ? `${usuario.firstName} ${usuario.lastName}`.trim() 
        : usuario?.email || 'Usuario';
      
      const destinatarios: string[] = [];
      
      if (serviciosDestino.length > 0) {
        destinatarios.push(...serviciosDestino);
      }
      
      if (notificarFamilia) {
        const contactos = await storage.getContactosFamiliares(userId);
        const activos = contactos.filter(c => c.notificarEmergencias);
        if (activos.length > 0) {
          destinatarios.push('familia');
          console.log(`[Emergencia] Notificando a ${activos.length} contactos familiares`);
        }
      }
      
      if (notificarGrupoChat && gruposDestino.length > 0) {
        destinatarios.push('grupos_chat');
        console.log(`[Emergencia] Notificando a ${gruposDestino.length} grupos de chat`);
      }
      
      console.log(`[Emergencia] ${nombreUsuario} solicitó ayuda. Destinos: ${destinatarios.join(', ')}`);
      
      res.json({
        ...emergencia,
        destinatariosNotificados: destinatarios,
      });
    } catch (error: any) {
      console.error("Error al crear emergencia:", error);
      res.status(400).json({ message: error.message || "Error al crear emergencia" });
    }
  });

  app.patch('/api/emergencias/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const emergencia = await storage.updateEmergencia(id, req.body);
      if (!emergencia) {
        return res.status(404).json({ message: "Emergencia no encontrada" });
      }
      res.json(emergencia);
    } catch (error) {
      console.error("Error al actualizar emergencia:", error);
      res.status(500).json({ message: "Error al actualizar emergencia" });
    }
  });

  // ============================================================
  // RUTAS DE CONTACTOS FAMILIARES
  // ============================================================

  app.get('/api/contactos-familiares', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contactos = await storage.getContactosFamiliares(userId);
      res.json(contactos);
    } catch (error) {
      console.error("Error al obtener contactos familiares:", error);
      res.status(500).json({ message: "Error al obtener contactos familiares" });
    }
  });

  app.post('/api/contactos-familiares', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertContactoFamiliarSchema.parse(req.body);
      const contacto = await storage.createContactoFamiliar({
        ...data,
        usuarioId: userId,
      });
      res.json(contacto);
    } catch (error: any) {
      console.error("Error al crear contacto familiar:", error);
      res.status(400).json({ message: error.message || "Error al crear contacto familiar" });
    }
  });

  app.patch('/api/contactos-familiares/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que el contacto pertenece al usuario
      const contactos = await storage.getContactosFamiliares(userId);
      const contacto = contactos.find(c => c.id === id);
      if (!contacto) {
        return res.status(404).json({ message: "Contacto no encontrado" });
      }
      
      const actualizado = await storage.updateContactoFamiliar(id, req.body);
      res.json(actualizado);
    } catch (error) {
      console.error("Error al actualizar contacto familiar:", error);
      res.status(500).json({ message: "Error al actualizar contacto familiar" });
    }
  });

  app.delete('/api/contactos-familiares/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que el contacto pertenece al usuario
      const contactos = await storage.getContactosFamiliares(userId);
      const contacto = contactos.find(c => c.id === id);
      if (!contacto) {
        return res.status(404).json({ message: "Contacto no encontrado" });
      }
      
      await storage.deleteContactoFamiliar(id);
      res.json({ message: "Contacto eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar contacto familiar:", error);
      res.status(500).json({ message: "Error al eliminar contacto familiar" });
    }
  });

  // ============================================================
  // IMPORTAR CONTACTOS DE GOOGLE
  // ============================================================
  
  app.post('/api/contactos-familiares/importar-google', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accessToken = req.user.access_token;
      
      if (!accessToken) {
        return res.status(400).json({ 
          message: "No tiene acceso a Google. Por favor, inicie sesión nuevamente.",
          requiresReauth: true
        });
      }

      console.log("🔄 Importando contactos de Google para usuario:", userId);

      // Obtener contactos de la API de Google People
      const response = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=200',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error de Google API:", response.status, errorText);
        
        if (response.status === 401) {
          return res.status(401).json({ 
            message: "Sesión de Google expirada. Por favor, inicie sesión nuevamente.",
            requiresReauth: true
          });
        }
        
        return res.status(500).json({ message: "Error al obtener contactos de Google" });
      }

      const data = await response.json();
      const connections = data.connections || [];

      if (connections.length === 0) {
        return res.json({ 
          success: true, 
          message: "No se encontraron contactos en su cuenta de Google",
          importados: 0,
          omitidos: 0
        });
      }

      // Obtener contactos existentes para evitar duplicados
      const contactosExistentes = await storage.getContactosFamiliares(userId);
      const emailsExistentes = new Set(contactosExistentes.map(c => c.email?.toLowerCase()).filter(Boolean));
      const telefonosExistentes = new Set(contactosExistentes.map(c => c.telefono).filter(Boolean));

      let importados = 0;
      let omitidos = 0;

      for (const person of connections) {
        const nombre = person.names?.[0]?.displayName;
        const email = person.emailAddresses?.[0]?.value;
        const telefono = person.phoneNumbers?.[0]?.value;
        const fotoUrl = person.photos?.[0]?.url;

        // Solo importar contactos que tengan nombre y (email o teléfono)
        if (!nombre || (!email && !telefono)) {
          omitidos++;
          continue;
        }

        // Verificar si ya existe (por email o teléfono)
        const emailLower = email?.toLowerCase();
        if ((emailLower && emailsExistentes.has(emailLower)) || 
            (telefono && telefonosExistentes.has(telefono))) {
          omitidos++;
          continue;
        }

        // Crear el contacto
        await storage.createContactoFamiliar({
          usuarioId: userId,
          nombre: nombre,
          email: email || null,
          telefono: telefono || null,
          relacion: "importado_google",
          esContactoPrincipal: false,
          notificarEmergencias: false,
          orden: 999
        });

        importados++;
        
        // Agregar a sets para evitar duplicados dentro de la misma importación
        if (emailLower) emailsExistentes.add(emailLower);
        if (telefono) telefonosExistentes.add(telefono);
      }

      console.log(`✅ Importación completada: ${importados} contactos importados, ${omitidos} omitidos`);

      res.json({ 
        success: true,
        message: `Se importaron ${importados} contactos de Google`,
        importados,
        omitidos,
        total: connections.length
      });

    } catch (error: any) {
      console.error("❌ Error al importar contactos de Google:", error);
      res.status(500).json({ message: error.message || "Error al importar contactos" });
    }
  });

  // ============================================================
  // RUTAS DE LUGARES FRECUENTES DEL USUARIO
  // ============================================================

  app.get('/api/lugares-usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lugares = await storage.getLugaresUsuario(userId);
      res.json(lugares);
    } catch (error) {
      console.error("Error al obtener lugares del usuario:", error);
      res.status(500).json({ message: "Error al obtener lugares del usuario" });
    }
  });

  app.post('/api/lugares-usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Validar sin usuarioId, ya que lo agregamos desde la sesión
      const { usuarioId: _, ...bodyData } = req.body;
      const data = insertLugarUsuarioSchema.omit({ usuarioId: true }).parse(bodyData);
      const lugar = await storage.createLugarUsuario({
        ...data,
        usuarioId: userId,
      });
      res.json(lugar);
    } catch (error: any) {
      console.error("Error al crear lugar:", error);
      res.status(400).json({ message: error.message || "Error al crear lugar" });
    }
  });

  app.patch('/api/lugares-usuario/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que el lugar pertenece al usuario
      const lugares = await storage.getLugaresUsuario(userId);
      const lugar = lugares.find(l => l.id === id);
      if (!lugar) {
        return res.status(404).json({ message: "Lugar no encontrado" });
      }
      
      const actualizado = await storage.updateLugarUsuario(id, req.body);
      res.json(actualizado);
    } catch (error) {
      console.error("Error al actualizar lugar:", error);
      res.status(500).json({ message: "Error al actualizar lugar" });
    }
  });

  app.delete('/api/lugares-usuario/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar que el lugar pertenece al usuario
      const lugares = await storage.getLugaresUsuario(userId);
      const lugar = lugares.find(l => l.id === id);
      if (!lugar) {
        return res.status(404).json({ message: "Lugar no encontrado" });
      }
      
      await storage.deleteLugarUsuario(id);
      res.json({ message: "Lugar eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar lugar:", error);
      res.status(500).json({ message: "Error al eliminar lugar" });
    }
  });

  // ============================================================
  // RUTAS DE PEDIDOS (CARTA DIGITAL)
  // ============================================================

  // Crear nuevo pedido desde carta digital
  app.post('/api/pedidos', isAuthenticated, async (req: any, res) => {
    console.log("🛒 POST /api/pedidos - Request recibido", { 
      body: req.body,
      userId: req.user?.claims?.sub 
    });
    try {
      const userId = req.user.claims.sub;
      const {
        catalogoId,
        localComercialId,
        items,
        total,
        moneda,
        metodoPago,
        formaPagoId,
        voucherUrl,
        notas,
        pedidoAdicional,
        usuarioPagadorId,
        pagoDelegado,
        tipoEntrega,
        direccionEntrega,
        latitudEntrega,
        longitudEntrega,
        referenciaEntrega,
      } = req.body;

      // Validaciones básicas
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "El pedido debe tener al menos un producto" });
      }

      // Calcular subtotal de items
      let subtotalCalculado = 0;
      for (const item of items) {
        const precio = parseFloat(item.precioUnitario) || 0;
        subtotalCalculado += precio * (item.cantidad || 1);
      }

      // Crear el pedido
      // Nota: Se mantiene estado "pendiente" para compatibilidad con sistema existente
      // Los campos pedidoAdicional y pagoDelegado se usan para lógica adicional
      // Cuando hay pago delegado, el usuario pagador deberá completar el pago normal
      const pedido = await storage.createPedido({
        usuarioId: userId,
        catalogoId,
        localComercialId,
        subtotal: subtotalCalculado.toFixed(2),
        total: total || subtotalCalculado.toFixed(2),
        moneda: moneda || "PEN",
        tipoEntrega: tipoEntrega || "recoger",
        direccionEntrega,
        latitudEntrega,
        longitudEntrega,
        referenciaEntrega,
        estado: "pendiente",
        estadoPago: "pendiente",
        metodoPago: metodoPago || "efectivo",
        notasCliente: notas,
        pedidoAdicional: pedidoAdicional || null,
        usuarioPagadorId: usuarioPagadorId || null,
        pagoDelegado: !!pagoDelegado,
        fechaDelegacion: pagoDelegado ? new Date() : null,
      });

      // Crear items del pedido
      for (const item of items) {
        const precio = parseFloat(item.precioUnitario) || 0;
        await storage.addItemPedido({
          pedidoId: pedido.id,
          itemCatalogoId: item.itemCatalogoId,
          productoUsuarioId: item.productoId,
          tipoProducto: item.itemCatalogoId ? "catalogo" : "usuario",
          nombreProducto: item.nombreProducto || "Producto",
          precioUnitario: precio.toFixed(2),
          cantidad: item.cantidad || 1,
          subtotal: (precio * (item.cantidad || 1)).toFixed(2),
        });
      }

      // Registrar historial de estado inicial
      await storage.addHistorialEstadoPedido({
        pedidoId: pedido.id,
        estadoAnterior: null,
        estadoNuevo: "pendiente",
        descripcion: "Pedido creado",
        usuarioId: userId,
        tipoUsuario: "cliente",
      });

      // Si hay voucher, guardarlo en el pedido
      if (voucherUrl) {
        await storage.updatePedido(pedido.id, {
          notasCliente: `${notas || ""}\n\n[Voucher: ${voucherUrl}]`.trim(),
        });
      }

      // Vaciar el carrito del usuario para este catálogo
      const carritos = await storage.getCarritoUsuario(userId);
      for (const carrito of carritos) {
        if (carrito.catalogoId === catalogoId) {
          await storage.deleteItemCarrito(carrito.id);
        }
      }

      // Notificar al negocio vía WebSocket (si está disponible)
      try {
        if (localComercialId) {
          notificarSuperAdmins({
            tipo: "nuevo_pedido",
            pedidoId: pedido.id,
            localComercialId,
            mensaje: "Nuevo pedido recibido",
          });
        }
      } catch (e) {
        // Notificación no crítica
      }

      // Si es pago delegado, notificar al usuario pagador
      if (pagoDelegado && usuarioPagadorId) {
        try {
          const solicitante = await storage.getUser(userId);
          const solicitanteNombre = `${solicitante?.firstName || ''} ${solicitante?.lastName || ''}`.trim() || solicitante?.email || 'Un usuario';
          
          // Obtener nombre del local comercial
          let nombreLocal = "Negocio";
          if (localComercialId) {
            const local = await storage.getLogoServicio(localComercialId);
            if (local) nombreLocal = local.nombre || "Negocio";
          }
          
          notificarUsuario(usuarioPagadorId, {
            tipo: 'pago_delegado',
            titulo: 'Solicitud de Pago',
            mensaje: `${solicitanteNombre} te pide pagar su pedido`,
            pedidoId: pedido.id,
            monto: total || subtotalCalculado.toFixed(2),
            solicitanteNombre,
            nombreLocal,
          });
          
          console.log(`📲 Notificación de pago delegado enviada a usuario ${usuarioPagadorId}`);
        } catch (e) {
          console.error("Error notificando pago delegado:", e);
          // Notificación no crítica, el usuario verá el pedido en su panel de todos modos
        }
      }

      res.json({ 
        success: true, 
        pedido,
        message: "Pedido creado exitosamente" 
      });
    } catch (error: any) {
      console.error("Error al crear pedido:", error);
      res.status(500).json({ message: error.message || "Error al crear el pedido" });
    }
  });

  // Obtener mis pedidos (como cliente)
  app.get('/api/mis-pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { estado } = req.query;
      const pedidos = await storage.getPedidosUsuario(userId, estado as string);
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener mis pedidos:", error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  });

  // Obtener pedidos de mi negocio (para FACTURACION)
  app.get('/api/pedidos-negocio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { estado } = req.query;
      const pedidos = await storage.getPedidosLocal(userId, estado as string);
      
      // Para cada pedido, obtener sus items
      const pedidosConItems = await Promise.all(pedidos.map(async (pedido) => {
        const items = await storage.getItemsPedido(pedido.id);
        return { ...pedido, items };
      }));
      
      res.json(pedidosConItems);
    } catch (error) {
      console.error("Error al obtener pedidos del negocio:", error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  });

  // Obtener detalle de un pedido
  app.get('/api/pedidos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const pedido = await storage.getPedido(id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      const items = await storage.getItemsPedido(id);
      const historial = await storage.getHistorialPedido(id);
      
      res.json({ ...pedido, items, historial });
    } catch (error) {
      console.error("Error al obtener pedido:", error);
      res.status(500).json({ message: "Error al obtener pedido" });
    }
  });

  // Cambiar estado de un pedido
  app.patch('/api/pedidos/:id/estado', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { estado, descripcion, tipoUsuario } = req.body;

      const pedidoActualizado = await storage.cambiarEstadoPedido(
        id, 
        estado, 
        userId, 
        tipoUsuario || "cliente",
        descripcion
      );

      if (!pedidoActualizado) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json(pedidoActualizado);
    } catch (error: any) {
      console.error("Error al cambiar estado del pedido:", error);
      res.status(500).json({ message: error.message || "Error al cambiar estado" });
    }
  });

  // Asignar delivery a un pedido
  app.patch('/api/pedidos/:id/delivery', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { deliveryId, deliveryTipo } = req.body;

      const pedido = await storage.updatePedido(id, {
        deliveryId,
        deliveryTipo,
      });

      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      res.json(pedido);
    } catch (error) {
      console.error("Error al asignar delivery:", error);
      res.status(500).json({ message: "Error al asignar delivery" });
    }
  });

  // Actualizar ubicación del delivery (para tracking en tiempo real)
  app.patch('/api/pedidos/:id/ubicacion-delivery', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const { latitud, longitud } = req.body;

      const pedido = await storage.getPedido(id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      // Verificar que el usuario es el delivery asignado
      if (pedido.deliveryId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para actualizar este pedido" });
      }

      // Guardar ubicación en solicitud de delivery
      const solicitud = await storage.getSolicitudDeliveryPorPedido(id);
      if (solicitud) {
        await storage.updateSolicitudDelivery(solicitud.id, {
          latitudActual: latitud,
          longitudActual: longitud,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error al actualizar ubicación:", error);
      res.status(500).json({ message: "Error al actualizar ubicación" });
    }
  });

  // ============================================================
  // RUTAS DE TAXI
  // ============================================================

  app.get('/api/taxi/viajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const viajes = await storage.getViajesTaxi(userId);
      res.json(viajes);
    } catch (error) {
      console.error("Error al obtener viajes:", error);
      res.status(500).json({ message: "Error al obtener viajes" });
    }
  });

  app.post('/api/taxi/viajes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertViajeTaxiSchema.parse(req.body);
      const viaje = await storage.createViajeTaxi({
        ...data,
        pasajeroId: userId,
      });
      res.json(viaje);
    } catch (error: any) {
      console.error("Error al crear viaje:", error);
      res.status(400).json({ message: error.message || "Error al crear viaje" });
    }
  });

  app.patch('/api/taxi/viajes/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const viaje = await storage.updateViajeTaxi(id, req.body);
      if (!viaje) {
        return res.status(404).json({ message: "Viaje no encontrado" });
      }
      res.json(viaje);
    } catch (error) {
      console.error("Error al actualizar viaje:", error);
      res.status(500).json({ message: "Error al actualizar viaje" });
    }
  });

  app.get('/api/taxi/conductores', isAuthenticated, async (req, res) => {
    try {
      const usuarios = await storage.getAllUsers();
      const conductores = usuarios.filter(u => u.rol === 'conductor' || u.modoTaxi === 'conductor');
      res.json(conductores.map(c => ({
        id: c.id,
        nombre: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}`.trim() : c.firstName || c.lastName || 'Conductor',
        telefono: c.telefono || '',
        activo: c.estado === 'activo',
        email: c.email,
      })));
    } catch (error) {
      console.error("Error al obtener conductores:", error);
      res.status(500).json({ message: "Error al obtener conductores" });
    }
  });

  // Historial de viajes del conductor
  app.get('/api/taxi/historial-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const viajes = await storage.getViajesConductor(userId);
      res.json(viajes);
    } catch (error) {
      console.error("Error al obtener historial del conductor:", error);
      res.status(500).json({ message: "Error al obtener historial del conductor" });
    }
  });

  // ============================================================
  // RUTAS DE DELIVERY
  // ============================================================

  app.get('/api/delivery/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pedidos = await storage.getPedidosDelivery(userId);
      res.json(pedidos);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  });

  app.post('/api/delivery/pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertPedidoDeliverySchema.parse(req.body);
      const pedido = await storage.createPedidoDelivery({
        ...data,
        usuarioId: userId,
      });
      res.json(pedido);
    } catch (error: any) {
      console.error("Error al crear pedido:", error);
      res.status(400).json({ message: error.message || "Error al crear pedido" });
    }
  });

  app.patch('/api/delivery/pedidos/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const pedido = await storage.updatePedidoDelivery(id, req.body);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      res.json(pedido);
    } catch (error) {
      console.error("Error al actualizar pedido:", error);
      res.status(500).json({ message: "Error al actualizar pedido" });
    }
  });

  // ============================================================
  // RUTAS DE RADIOS ONLINE
  // ============================================================

  app.get('/api/radios-online', async (req, res) => {
    try {
      const radios = await storage.getRadiosOnline();
      res.json(radios);
    } catch (error) {
      console.error("Error al obtener radios:", error);
      res.status(500).json({ message: "Error al obtener radios" });
    }
  });

  app.get('/api/radios-online/predeterminada', async (req, res) => {
    try {
      const radio = await storage.getRadioPredeterminada();
      res.json(radio || null);
    } catch (error) {
      console.error("Error al obtener radio predeterminada:", error);
      res.status(500).json({ message: "Error al obtener radio predeterminada" });
    }
  });

  app.get('/api/radios-online/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const radio = await storage.getRadioOnline(id);
      if (!radio) {
        return res.status(404).json({ message: "Radio no encontrada" });
      }
      res.json(radio);
    } catch (error) {
      console.error("Error al obtener radio:", error);
      res.status(500).json({ message: "Error al obtener radio" });
    }
  });

  app.post('/api/radios-online', isAuthenticated, async (req, res) => {
    try {
      const data = insertRadioOnlineSchema.parse(req.body);
      const radio = await storage.createRadioOnline(data);
      res.status(201).json(radio);
    } catch (error: any) {
      console.error("Error al crear radio:", error);
      res.status(400).json({ message: error.message || "Error al crear radio" });
    }
  });

  app.patch('/api/radios-online/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const radio = await storage.updateRadioOnline(id, req.body);
      if (!radio) {
        return res.status(404).json({ message: "Radio no encontrada" });
      }
      res.json(radio);
    } catch (error: any) {
      console.error("Error al actualizar radio:", error);
      res.status(400).json({ message: error.message || "Error al actualizar radio" });
    }
  });

  app.delete('/api/radios-online/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRadioOnline(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error al eliminar radio:", error);
      res.status(400).json({ message: error.message || "Error al eliminar radio" });
    }
  });

  // ============================================================
  // RUTAS DE LISTAS MP3
  // ============================================================

  app.get('/api/listas-mp3', async (req, res) => {
    try {
      const listas = await storage.getListasMp3();
      res.json(listas);
    } catch (error) {
      console.error("Error al obtener listas MP3:", error);
      res.status(500).json({ message: "Error al obtener listas MP3" });
    }
  });

  app.get('/api/listas-mp3/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lista = await storage.getListaMp3(id);
      if (!lista) {
        return res.status(404).json({ message: "Lista no encontrada" });
      }
      res.json(lista);
    } catch (error) {
      console.error("Error al obtener lista MP3:", error);
      res.status(500).json({ message: "Error al obtener lista MP3" });
    }
  });

  app.post('/api/listas-mp3', isAuthenticated, async (req, res) => {
    try {
      const data = insertListaMp3Schema.parse(req.body);
      const { crearCarpetaLista } = await import('./mp3-upload');
      const rutaCarpeta = crearCarpetaLista(data.nombre);
      const lista = await storage.createListaMp3({ ...data, rutaCarpeta });
      res.status(201).json(lista);
    } catch (error: any) {
      console.error("Error al crear lista MP3:", error);
      res.status(400).json({ message: error.message || "Error al crear lista MP3" });
    }
  });

  app.patch('/api/listas-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const listaActual = await storage.getListaMp3(id);
      if (!listaActual) {
        return res.status(404).json({ message: "Lista no encontrada" });
      }
      
      if (req.body.nombre && req.body.nombre !== listaActual.nombre && listaActual.rutaCarpeta) {
        const { renombrarCarpeta, crearCarpetaLista, sanitizeFolderName } = await import('./mp3-upload');
        const nuevaCarpeta = sanitizeFolderName(req.body.nombre);
        const exito = renombrarCarpeta(listaActual.rutaCarpeta, req.body.nombre);
        if (exito) {
          req.body.rutaCarpeta = nuevaCarpeta;
        }
      }
      
      const lista = await storage.updateListaMp3(id, req.body);
      res.json(lista);
    } catch (error: any) {
      console.error("Error al actualizar lista MP3:", error);
      res.status(400).json({ message: error.message || "Error al actualizar lista MP3" });
    }
  });

  app.delete('/api/listas-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const lista = await storage.getListaMp3(id);
      if (lista?.rutaCarpeta) {
        const { eliminarCarpetaLista } = await import('./mp3-upload');
        eliminarCarpetaLista(lista.rutaCarpeta);
      }
      await storage.deleteListaMp3(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error al eliminar lista MP3:", error);
      res.status(400).json({ message: error.message || "Error al eliminar lista MP3" });
    }
  });

  app.post('/api/listas-mp3/:id/subir', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const lista = await storage.getListaMp3(id);
      if (!lista) {
        return res.status(404).json({ message: "Lista no encontrada" });
      }
      
      if (!lista.rutaCarpeta) {
        const { crearCarpetaLista } = await import('./mp3-upload');
        const rutaCarpeta = crearCarpetaLista(lista.nombre);
        await storage.updateListaMp3(id, { rutaCarpeta });
        lista.rutaCarpeta = rutaCarpeta;
      }
      
      const { crearUploadMp3Middleware, obtenerUrlPublica, obtenerTamanoArchivo } = await import('./mp3-upload');
      const uploadMiddleware = crearUploadMp3Middleware(lista.rutaCarpeta!);
      
      uploadMiddleware(req, res, async (err: any) => {
        if (err) {
          console.error("Error al subir archivos:", err);
          return res.status(400).json({ message: err.message || "Error al subir archivos" });
        }
        
        const archivos = req.files as Express.Multer.File[];
        if (!archivos || archivos.length === 0) {
          return res.status(400).json({ message: "No se recibieron archivos" });
        }
        
        const archivosCreados = [];
        const archivosExistentes = await storage.getArchivosMp3PorLista(id);
        let ordenInicial = archivosExistentes.length;
        
        for (const archivo of archivos) {
          const nombreSinExt = archivo.originalname.replace(/\.[^/.]+$/, "");
          const url = obtenerUrlPublica(lista.rutaCarpeta!, archivo.filename);
          const tamano = obtenerTamanoArchivo(lista.rutaCarpeta!, archivo.filename);
          
          const nuevoArchivo = await storage.createArchivoMp3({
            listaId: id,
            titulo: nombreSinExt,
            nombreArchivo: archivo.filename,
            archivoUrl: url,
            tamano,
            orden: ordenInicial++,
          });
          archivosCreados.push(nuevoArchivo);
        }
        
        res.status(201).json(archivosCreados);
      });
    } catch (error: any) {
      console.error("Error al subir archivos MP3:", error);
      res.status(400).json({ message: error.message || "Error al subir archivos" });
    }
  });

  // ============================================================
  // RUTAS DE ARCHIVOS MP3
  // ============================================================

  app.get('/api/archivos-mp3', async (req, res) => {
    try {
      const { listaId } = req.query;
      let archivos;
      if (listaId) {
        archivos = await storage.getArchivosMp3PorLista(parseInt(listaId as string));
      } else {
        archivos = await storage.getArchivosMp3();
      }
      res.json(archivos);
    } catch (error) {
      console.error("Error al obtener archivos MP3:", error);
      res.status(500).json({ message: "Error al obtener archivos MP3" });
    }
  });

  app.post('/api/archivos-mp3', isAuthenticated, async (req, res) => {
    try {
      const data = insertArchivoMp3Schema.parse(req.body);
      const archivo = await storage.createArchivoMp3(data);
      res.status(201).json(archivo);
    } catch (error: any) {
      console.error("Error al crear archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al crear archivo MP3" });
    }
  });

  app.patch('/api/archivos-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const archivo = await storage.updateArchivoMp3(id, req.body);
      if (!archivo) {
        return res.status(404).json({ message: "Archivo no encontrado" });
      }
      res.json(archivo);
    } catch (error: any) {
      console.error("Error al actualizar archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al actualizar archivo MP3" });
    }
  });

  app.delete('/api/archivos-mp3/:id', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const archivo = await storage.getArchivoMp3(id);
      if (archivo && archivo.nombreArchivo) {
        const lista = await storage.getListaMp3(archivo.listaId!);
        if (lista?.rutaCarpeta) {
          const { eliminarArchivoMp3: eliminarArchivo } = await import('./mp3-upload');
          eliminarArchivo(lista.rutaCarpeta, archivo.nombreArchivo);
        }
      }
      await storage.deleteArchivoMp3(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error al eliminar archivo MP3:", error);
      res.status(400).json({ message: error.message || "Error al eliminar archivo MP3" });
    }
  });

  app.post('/api/archivos-mp3/reordenar', isAuthenticated, async (req, res) => {
    try {
      const { listaId, orden } = req.body;
      if (!listaId || !orden || !Array.isArray(orden)) {
        return res.status(400).json({ message: "Datos inválidos" });
      }
      await storage.reordenarArchivosMp3(listaId, orden);
      res.json({ message: "Orden actualizado" });
    } catch (error: any) {
      console.error("Error al reordenar archivos MP3:", error);
      res.status(400).json({ message: error.message || "Error al reordenar" });
    }
  });

  // ============================================================
  // RUTAS DE CONFIGURACIÓN
  // ============================================================

  app.get('/api/configuracion/:clave', async (req, res) => {
    try {
      const { clave } = req.params;
      const config = await storage.getConfiguracion(clave);
      res.json(config || null);
    } catch (error) {
      console.error("Error al obtener configuración:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.post('/api/configuracion', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.setConfiguracion(req.body);
      res.json(config);
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      res.status(500).json({ message: "Error al guardar configuración" });
    }
  });

  // Ruta de sugerencias (envío de formulario)
  app.post('/api/sugerencias', async (req, res) => {
    try {
      // TODO: Implementar envío de email con las sugerencias
      console.log("Nueva sugerencia recibida:", req.body);
      res.json({ message: "Sugerencia recibida correctamente" });
    } catch (error) {
      console.error("Error al procesar sugerencia:", error);
      res.status(500).json({ message: "Error al procesar sugerencia" });
    }
  });

  // ============================================================
  // RUTAS DE CAMBIO DE MONEDA (Calculadora)
  // ============================================================

  // Obtener todas las monedas configuradas (público)
  app.get('/api/monedas/configuracion', async (req, res) => {
    try {
      const monedas = await storage.getConfiguracionMonedas();
      res.json(monedas);
    } catch (error) {
      console.error("Error al obtener configuración de monedas:", error);
      res.status(500).json({ message: "Error al obtener configuración de monedas" });
    }
  });

  // Actualizar configuración de moneda (super_admin o cambista)
  app.patch('/api/monedas/configuracion/:codigo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { codigo } = req.params;
      const user = await storage.getUser(userId);
      const roles = await storage.getUserRoles(userId);
      
      const esSuperAdmin = roles.includes('super_admin');
      const esCambista = user?.rol === 'cambista';
      
      if (!esSuperAdmin && !esCambista) {
        return res.status(403).json({ message: "No tienes permisos para actualizar monedas" });
      }
      
      const moneda = await storage.updateConfiguracionMoneda(codigo, req.body);
      if (!moneda) {
        return res.status(404).json({ message: "Moneda no encontrada" });
      }
      res.json(moneda);
    } catch (error) {
      console.error("Error al actualizar moneda:", error);
      res.status(500).json({ message: "Error al actualizar moneda" });
    }
  });

  // Obtener todas las tasas de cambio locales (público)
  app.get('/api/monedas/tasas-locales', async (req, res) => {
    try {
      const tasas = await storage.getTasasCambioLocales(true);
      res.json(tasas);
    } catch (error) {
      console.error("Error al obtener tasas locales:", error);
      res.status(500).json({ message: "Error al obtener tasas locales" });
    }
  });

  // Obtener tasas del cambista actual
  app.get('/api/monedas/mis-tasas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasas = await storage.getTasasCambioLocalPorCambista(userId);
      res.json(tasas);
    } catch (error) {
      console.error("Error al obtener mis tasas:", error);
      res.status(500).json({ message: "Error al obtener mis tasas" });
    }
  });

  // Obtener historial de cambios del cambista actual
  app.get('/api/monedas/historial-cambista', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const historial = await storage.getHistorialTasasCambista(userId);
      res.json(historial);
    } catch (error) {
      console.error("Error al obtener historial cambista:", error);
      res.status(500).json({ message: "Error al obtener historial" });
    }
  });

  // Crear/actualizar tasa de cambio local (cambista o super_admin)
  app.post('/api/monedas/tasas-locales', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const roles = await storage.getUserRoles(userId);
      
      const esSuperAdmin = roles.includes('super_admin');
      const esCambista = user?.rol === 'cambista';
      
      if (!esSuperAdmin && !esCambista) {
        return res.status(403).json({ message: "No tienes permisos para registrar tasas de cambio" });
      }
      
      const data = {
        ...req.body,
        cambistaId: userId,
      };
      
      const tasa = await storage.createTasaCambioLocal(data);
      
      // Registrar en historial
      try {
        await storage.createHistorialTasaCambio({
          cambistaId: userId,
          tasaLocalId: tasa.id,
          monedaOrigenCodigo: tasa.monedaOrigenCodigo,
          monedaDestinoCodigo: tasa.monedaDestinoCodigo,
          tasaCompraAnterior: null,
          tasaVentaAnterior: null,
          tasaCompraNueva: tasa.tasaCompra,
          tasaVentaNueva: tasa.tasaVenta,
          tipoAccion: 'creacion',
          ipOrigen: req.ip || null,
        });
      } catch (histErr) {
        console.log("No se pudo registrar en historial (tabla puede no existir):", histErr);
      }
      
      res.status(201).json(tasa);
    } catch (error) {
      console.error("Error al crear tasa local:", error);
      res.status(500).json({ message: "Error al crear tasa local" });
    }
  });

  // Actualizar tasa de cambio local (PATCH)
  app.patch('/api/monedas/tasas-locales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const tasa = await storage.getTasaCambioLocal(id);
      
      if (!tasa) {
        return res.status(404).json({ message: "Tasa no encontrada" });
      }
      
      const roles = await storage.getUserRoles(userId);
      const esSuperAdmin = roles.includes('super_admin');
      
      if (tasa.cambistaId !== userId && !esSuperAdmin) {
        return res.status(403).json({ message: "No puedes editar esta tasa" });
      }
      
      const tasaAnterior = { tasaCompra: tasa.tasaCompra, tasaVenta: tasa.tasaVenta };
      const actualizada = await storage.updateTasaCambioLocal(id, req.body);
      
      // Registrar en historial si cambió la tasa
      if (actualizada && (req.body.tasaCompra || req.body.tasaVenta)) {
        try {
          await storage.createHistorialTasaCambio({
            cambistaId: tasa.cambistaId,
            tasaLocalId: id,
            monedaOrigenCodigo: tasa.monedaOrigenCodigo,
            monedaDestinoCodigo: tasa.monedaDestinoCodigo,
            tasaCompraAnterior: tasaAnterior.tasaCompra,
            tasaVentaAnterior: tasaAnterior.tasaVenta,
            tasaCompraNueva: actualizada.tasaCompra,
            tasaVentaNueva: actualizada.tasaVenta,
            tipoAccion: 'actualizacion',
            ipOrigen: req.ip || null,
          });
        } catch (histErr) {
          console.log("No se pudo registrar en historial:", histErr);
        }
      }
      
      res.json(actualizada);
    } catch (error) {
      console.error("Error al actualizar tasa local:", error);
      res.status(500).json({ message: "Error al actualizar tasa local" });
    }
  });

  // Actualizar tasa de cambio local (PUT)
  app.put('/api/monedas/tasas-locales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const tasa = await storage.getTasaCambioLocal(id);
      
      if (!tasa) {
        return res.status(404).json({ message: "Tasa no encontrada" });
      }
      
      const roles = await storage.getUserRoles(userId);
      const esSuperAdmin = roles.includes('super_admin');
      
      if (tasa.cambistaId !== userId && !esSuperAdmin) {
        return res.status(403).json({ message: "No puedes editar esta tasa" });
      }
      
      const tasaAnterior = { tasaCompra: tasa.tasaCompra, tasaVenta: tasa.tasaVenta };
      const actualizada = await storage.updateTasaCambioLocal(id, req.body);
      
      // Registrar en historial si cambió la tasa
      if (actualizada && (req.body.tasaCompra || req.body.tasaVenta)) {
        try {
          await storage.createHistorialTasaCambio({
            cambistaId: tasa.cambistaId,
            tasaLocalId: id,
            monedaOrigenCodigo: tasa.monedaOrigenCodigo,
            monedaDestinoCodigo: tasa.monedaDestinoCodigo,
            tasaCompraAnterior: tasaAnterior.tasaCompra,
            tasaVentaAnterior: tasaAnterior.tasaVenta,
            tasaCompraNueva: actualizada.tasaCompra,
            tasaVentaNueva: actualizada.tasaVenta,
            tipoAccion: 'actualizacion',
            ipOrigen: req.ip || null,
          });
        } catch (histErr) {
          console.log("No se pudo registrar en historial:", histErr);
        }
      }
      
      res.json(actualizada);
    } catch (error) {
      console.error("Error al actualizar tasa local:", error);
      res.status(500).json({ message: "Error al actualizar tasa local" });
    }
  });

  // Eliminar tasa de cambio local
  app.delete('/api/monedas/tasas-locales/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const tasa = await storage.getTasaCambioLocal(id);
      
      if (!tasa) {
        return res.status(404).json({ message: "Tasa no encontrada" });
      }
      
      const roles = await storage.getUserRoles(userId);
      const esSuperAdmin = roles.includes('super_admin');
      
      if (tasa.cambistaId !== userId && !esSuperAdmin) {
        return res.status(403).json({ message: "No puedes eliminar esta tasa" });
      }
      
      await storage.deleteTasaCambioLocal(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error al eliminar tasa local:", error);
      res.status(500).json({ message: "Error al eliminar tasa local" });
    }
  });

  // Obtener promedio de tasas locales para un par de monedas
  app.get('/api/monedas/promedio/:origen/:destino', async (req, res) => {
    try {
      const { origen, destino } = req.params;
      const promedio = await storage.getPromedioTasasLocales(origen, destino);
      res.json(promedio || { promedioCompra: null, promedioVenta: null });
    } catch (error) {
      console.error("Error al obtener promedio:", error);
      res.status(500).json({ message: "Error al obtener promedio" });
    }
  });

  // ============================================================
  // RUTAS DE CALCULADORA - COMPARTIR EJERCICIOS
  // ============================================================

  // Listar usuarios disponibles para compartir (excluyendo al usuario actual)
  app.get('/api/usuarios/lista', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const todosUsuarios = await storage.getAllUsers();
      // Filtrar al usuario actual y retornar solo datos básicos
      const usuariosFiltrados = todosUsuarios
        .filter(u => u.id !== userId)
        .map(u => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          profileImageUrl: u.profileImageUrl,
        }));
      res.json(usuariosFiltrados);
    } catch (error) {
      console.error("Error al obtener lista de usuarios:", error);
      res.status(500).json({ message: "Error al obtener usuarios" });
    }
  });

  // Compartir ejercicio de calculadora científica
  app.post('/api/calculadora/compartir', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { ejercicio, destinatarios } = req.body;
      
      if (!ejercicio || !destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
        return res.status(400).json({ message: "Datos incompletos para compartir" });
      }

      // Validar que los destinatarios existan y eliminar duplicados
      const destinatariosUnicos = [...new Set(destinatarios)];
      const destinatariosValidos: string[] = [];
      
      for (const destId of destinatariosUnicos) {
        if (destId !== userId) { // No permitir compartir consigo mismo
          const usuario = await storage.getUser(destId);
          if (usuario) {
            destinatariosValidos.push(destId);
          }
        }
      }

      if (destinatariosValidos.length === 0) {
        return res.status(400).json({ message: "No se encontraron destinatarios válidos" });
      }

      const remitente = await storage.getUser(userId);
      const nombreRemitente = remitente?.firstName 
        ? `${remitente.firstName} ${remitente.lastName || ''}`.trim() 
        : remitente?.email || 'Usuario';

      // Registro del evento de compartir (trazabilidad básica)
      console.log(`[CALCULADORA] Ejercicio compartido por ${nombreRemitente} (${userId}):`, {
        expresion: ejercicio.expresion,
        resultado: ejercicio.resultado,
        modoAngulo: ejercicio.modoAngulo,
        destinatarios: destinatariosValidos,
        fecha: new Date().toISOString(),
      });

      res.json({ 
        success: true, 
        message: `Ejercicio compartido con ${destinatariosValidos.length} usuario(s)`,
        destinatariosNotificados: destinatariosValidos.length,
      });
    } catch (error) {
      console.error("Error al compartir ejercicio:", error);
      res.status(500).json({ message: "Error al compartir ejercicio" });
    }
  });

  // Obtener lista de cambistas (super_admin)
  app.get('/api/admin/cambistas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const cambistas = await storage.getCambistas();
      res.json(cambistas);
    } catch (error) {
      console.error("Error al obtener cambistas:", error);
      res.status(500).json({ message: "Error al obtener cambistas" });
    }
  });

  // Asignar rol de cambista a usuario
  app.post('/api/admin/cambistas/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { usuarioId } = req.params;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const usuario = await storage.asignarRolCambista(usuarioId);
      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      console.error("Error al asignar rol de cambista:", error);
      res.status(500).json({ message: "Error al asignar rol de cambista" });
    }
  });

  // Remover rol de cambista
  app.delete('/api/admin/cambistas/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { usuarioId } = req.params;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const usuario = await storage.removerRolCambista(usuarioId);
      if (!usuario) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json(usuario);
    } catch (error) {
      console.error("Error al remover rol de cambista:", error);
      res.status(500).json({ message: "Error al remover rol de cambista" });
    }
  });

  // Obtener historial de tasas de cambio (admin)
  app.get('/api/admin/historial-tasas-cambio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const historial = await storage.getHistorialTasasCambioAdmin(100);
      res.json(historial);
    } catch (error) {
      console.error("Error al obtener historial de tasas:", error);
      res.status(500).json({ message: "Error al obtener historial" });
    }
  });

  // Crear tabla de historial y datos de prueba (super_admin)
  app.post('/api/admin/setup-historial-tasas', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      console.log('🔄 Configurando tabla historial_tasas_cambio y datos de prueba...');
      
      // Crear tabla si no existe usando SQL crudo
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS historial_tasas_cambio (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          cambista_id VARCHAR(255) NOT NULL REFERENCES users(id),
          tasa_local_id VARCHAR(255) REFERENCES tasas_cambio_locales(id),
          moneda_origen_codigo VARCHAR(10) NOT NULL,
          moneda_destino_codigo VARCHAR(10) NOT NULL,
          tasa_compra_anterior DECIMAL(12,6),
          tasa_venta_anterior DECIMAL(12,6),
          tasa_compra_nueva DECIMAL(12,6) NOT NULL,
          tasa_venta_nueva DECIMAL(12,6) NOT NULL,
          tipo_accion VARCHAR(20) NOT NULL DEFAULT 'actualizacion',
          ip_origen VARCHAR(45),
          notas TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('✅ Tabla historial_tasas_cambio creada/verificada');
      
      // Verificar si hay cambistas para crear datos de prueba
      const cambistas = await storage.getCambistas();
      
      if (cambistas.length > 0) {
        // Usar el primer cambista para datos de prueba
        const cambistaId = cambistas[0].id;
        
        // Crear datos de prueba
        const datosPrueba = [
          { monedaOrigen: 'USD', monedaDestino: 'PEN', compraAnterior: '3.7200', ventaAnterior: '3.7800', compraNueva: '3.7350', ventaNueva: '3.7950', accion: 'actualizacion', horasAtras: 2 },
          { monedaOrigen: 'USD', monedaDestino: 'PEN', compraAnterior: '3.7100', ventaAnterior: '3.7700', compraNueva: '3.7200', ventaNueva: '3.7800', accion: 'actualizacion', horasAtras: 4 },
          { monedaOrigen: 'USD', monedaDestino: 'PEN', compraAnterior: null, ventaAnterior: null, compraNueva: '3.7100', ventaNueva: '3.7700', accion: 'creacion', horasAtras: 6 },
          { monedaOrigen: 'CLP', monedaDestino: 'PEN', compraAnterior: '0.0041', ventaAnterior: '0.0044', compraNueva: '0.0042', ventaNueva: '0.0045', accion: 'actualizacion', horasAtras: 1 },
          { monedaOrigen: 'CLP', monedaDestino: 'PEN', compraAnterior: null, ventaAnterior: null, compraNueva: '0.0041', ventaNueva: '0.0044', accion: 'creacion', horasAtras: 8 },
          { monedaOrigen: 'BOB', monedaDestino: 'PEN', compraAnterior: '0.5350', ventaAnterior: '0.5550', compraNueva: '0.5380', ventaNueva: '0.5580', accion: 'actualizacion', horasAtras: 3 },
          { monedaOrigen: 'BOB', monedaDestino: 'PEN', compraAnterior: null, ventaAnterior: null, compraNueva: '0.5350', ventaNueva: '0.5550', accion: 'creacion', horasAtras: 12 },
          { monedaOrigen: 'ARS', monedaDestino: 'PEN', compraAnterior: '0.0037', ventaAnterior: '0.0040', compraNueva: '0.0038', ventaNueva: '0.0041', accion: 'actualizacion', horasAtras: 5 },
          { monedaOrigen: 'ARS', monedaDestino: 'PEN', compraAnterior: null, ventaAnterior: null, compraNueva: '0.0037', ventaNueva: '0.0040', accion: 'creacion', horasAtras: 24 },
          { monedaOrigen: 'USD', monedaDestino: 'PEN', compraAnterior: '3.7350', ventaAnterior: '3.7950', compraNueva: '3.7400', ventaNueva: '3.8000', accion: 'actualizacion', horasAtras: 0.5 },
        ];
        
        for (const dato of datosPrueba) {
          const fechaCreacion = new Date(Date.now() - dato.horasAtras * 60 * 60 * 1000);
          await db.execute(sql`
            INSERT INTO historial_tasas_cambio (cambista_id, moneda_origen_codigo, moneda_destino_codigo, 
              tasa_compra_anterior, tasa_venta_anterior, tasa_compra_nueva, tasa_venta_nueva, 
              tipo_accion, created_at)
            VALUES (${cambistaId}, ${dato.monedaOrigen}, ${dato.monedaDestino}, 
              ${dato.compraAnterior}, ${dato.ventaAnterior}, ${dato.compraNueva}, ${dato.ventaNueva},
              ${dato.accion}, ${fechaCreacion})
          `);
        }
        console.log(`✅ ${datosPrueba.length} registros de prueba creados para cambista ${cambistaId}`);
        res.json({ message: `Tabla creada y ${datosPrueba.length} registros de prueba insertados`, cambistaId });
      } else {
        res.json({ message: "Tabla creada pero no hay cambistas para crear datos de prueba. Asigna el rol 'cambista' a un usuario primero." });
      }
    } catch (error) {
      console.error("Error al configurar historial de tasas:", error);
      res.status(500).json({ message: "Error al configurar historial de tasas", error: String(error) });
    }
  });

  // Actualizar configuración de moneda por ID (super_admin)
  app.patch('/api/admin/monedas/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      const { id } = req.params;
      const { tasaPromedioInternet, tasaPromedioLocal, activo } = req.body;
      
      // Actualizar la configuración de moneda
      const updateData: any = { updatedAt: new Date(), ultimaActualizacion: new Date() };
      if (tasaPromedioInternet !== undefined) updateData.tasaPromedioInternet = tasaPromedioInternet;
      if (tasaPromedioLocal !== undefined) updateData.tasaPromedioLocal = tasaPromedioLocal;
      if (activo !== undefined) updateData.activo = activo;
      
      const [actualizada] = await db.update(configuracionMonedas)
        .set(updateData)
        .where(eq(configuracionMonedas.id, id))
        .returning();
      
      if (!actualizada) {
        return res.status(404).json({ message: "Moneda no encontrada" });
      }
      
      console.log(`✅ Moneda ${actualizada.codigo} actualizada por super_admin ${userId}`);
      res.json(actualizada);
    } catch (error) {
      console.error("Error al actualizar moneda:", error);
      res.status(500).json({ message: "Error al actualizar moneda" });
    }
  });

  // Recalcular tasas locales promedio desde cambistas activos
  app.post('/api/admin/monedas/recalcular-tasas-locales', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: "Acceso denegado" });
      }
      
      console.log('🔄 Recalculando tasas locales desde cambistas activos...');
      
      // Obtener todas las monedas configuradas
      const monedas = await storage.getConfiguracionMonedas();
      const monedasActualizadas: string[] = [];
      
      for (const moneda of monedas) {
        if (moneda.esPrincipal) continue; // Saltar la moneda principal (PEN)
        
        // Obtener promedio de tasas locales para esta moneda vs PEN
        const promedio = await storage.getPromedioTasasLocales(moneda.codigo, 'PEN');
        
        if (promedio && promedio.promedioVenta) {
          // Actualizar la tasa promedio local en la configuración
          await db.update(configuracionMonedas)
            .set({ 
              tasaPromedioLocal: String(promedio.promedioVenta.toFixed(6)),
              ultimaActualizacion: new Date(),
              updatedAt: new Date()
            })
            .where(eq(configuracionMonedas.codigo, moneda.codigo));
          
          monedasActualizadas.push(`${moneda.codigo}: ${promedio.promedioVenta.toFixed(4)}`);
        }
      }
      
      console.log(`✅ Tasas locales recalculadas: ${monedasActualizadas.join(', ')}`);
      res.json({ 
        message: `Tasas locales actualizadas para ${monedasActualizadas.length} monedas`,
        monedasActualizadas 
      });
    } catch (error) {
      console.error("Error al recalcular tasas locales:", error);
      res.status(500).json({ message: "Error al recalcular tasas locales" });
    }
  });

  // ============================================================
  // MIGRACIÓN DE DATOS: Backfill miembros_grupo
  // ============================================================
  
  app.post('/api/admin/backfill-miembros', isAuthenticated, async (req: any, res) => {
    try {
      // Solo super_admin puede ejecutar backfill
      const userId = req.user.claims.sub;
      const roles = await storage.getUserRoles(userId);
      
      if (!roles.includes('super_admin')) {
        return res.status(403).json({ message: 'Acceso denegado' });
      }

      console.log('🔄 Iniciando backfill de miembros_grupo...');
      
      // Obtener todos los grupos con miembros JSON legacy
      const grupos = await storage.getAllGruposConMiembrosLegacy() as any[];
      let migrados = 0;
      let errores = 0;
      
      for (const grupo of grupos) {
        try {
          // Migrar miembros del JSON a la tabla normalizada (campo legacy)
          const miembrosLegacy = grupo.miembros as string[] | null | undefined;
          if (miembrosLegacy && Array.isArray(miembrosLegacy)) {
            for (const usuarioId of miembrosLegacy) {
              try {
                await storage.agregarMiembroGrupo({
                  grupoId: grupo.id,
                  usuarioId: usuarioId as string,
                  rol: usuarioId === grupo.creadorId ? 'admin' : 'miembro',
                });
                migrados++;
              } catch (error) {
                console.error(`Error al agregar miembro ${usuarioId} al grupo ${grupo.id}:`, error);
                errores++;
              }
            }
          }
        } catch (error) {
          console.error(`Error al procesar grupo ${grupo.id}:`, error);
          errores++;
        }
      }

      console.log(`✅ Backfill completado: ${migrados} miembros migrados, ${errores} errores`);
      res.json({
        success: true,
        migrados,
        errores,
        message: `Backfill completado: ${migrados} miembros migrados`,
      });
    } catch (error) {
      console.error('❌ Error en backfill:', error);
      res.status(500).json({ message: 'Error en backfill' });
    }
  });

  // ============================================================
  // SISTEMA DE REGISTRO POR NIVELES (5 ESTRELLAS)
  // ============================================================

  // Obtener nivel actual del usuario
  app.get('/api/registro/nivel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const nivel = await storage.getNivelRegistro(userId);
      res.json({ nivel });
    } catch (error) {
      console.error("Error al obtener nivel de registro:", error);
      res.status(500).json({ message: "Error al obtener nivel de registro" });
    }
  });

  // NIVEL 1: Registro Básico
  app.get('/api/registro/basico', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroBasico(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro básico:", error);
      res.status(500).json({ message: "Error al obtener registro básico" });
    }
  });

  app.post('/api/registro/basico', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertRegistroBasicoSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroBasico(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro básico:", error);
      res.status(400).json({ message: error.message || "Error al crear registro básico" });
    }
  });

  // NIVEL 2: Servicio Chat
  app.get('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroChat(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro chat:", error);
      res.status(500).json({ message: "Error al obtener registro chat" });
    }
  });

  app.post('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 1 exactamente (verificar existencia de registro_basico)
      const registroBasico = await storage.getRegistroBasico(userId);
      if (!registroBasico) {
        return res.status(400).json({ message: "Debe completar el nivel 1 (registro básico) primero" });
      }
      
      const data = insertRegistroChatSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroChat(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro chat:", error);
      res.status(400).json({ message: error.message || "Error al crear registro chat" });
    }
  });

  app.patch('/api/registro/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroChat(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro chat:", error);
      res.status(500).json({ message: "Error al actualizar registro chat" });
    }
  });

  // NIVEL 3: Ubicación
  app.get('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroUbicacion(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro ubicación:", error);
      res.status(500).json({ message: "Error al obtener registro ubicación" });
    }
  });

  app.post('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 2 exactamente (verificar existencia de registro_chat)
      const registroChat = await storage.getRegistroChat(userId);
      if (!registroChat) {
        return res.status(400).json({ message: "Debe completar el nivel 2 (registro chat) primero" });
      }
      
      const data = insertRegistroUbicacionSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroUbicacion(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro ubicación:", error);
      res.status(400).json({ message: error.message || "Error al crear registro ubicación" });
    }
  });

  app.patch('/api/registro/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroUbicacion(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro ubicación:", error);
      res.status(500).json({ message: "Error al actualizar registro ubicación" });
    }
  });

  // NIVEL 4: Dirección
  app.get('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroDireccion(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro dirección:", error);
      res.status(500).json({ message: "Error al obtener registro dirección" });
    }
  });

  app.post('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 3 exactamente (verificar existencia de registro_ubicacion)
      const registroUbicacion = await storage.getRegistroUbicacion(userId);
      if (!registroUbicacion) {
        return res.status(400).json({ message: "Debe completar el nivel 3 (registro ubicación) primero" });
      }
      
      const data = insertRegistroDireccionSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroDireccion(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro dirección:", error);
      res.status(400).json({ message: error.message || "Error al crear registro dirección" });
    }
  });

  app.patch('/api/registro/direccion', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroDireccion(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro dirección:", error);
      res.status(500).json({ message: "Error al actualizar registro dirección" });
    }
  });

  // NIVEL 5: Marketplace
  app.get('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.getRegistroMarketplace(userId);
      res.json(registro || {});
    } catch (error) {
      console.error("Error al obtener registro marketplace:", error);
      res.status(500).json({ message: "Error al obtener registro marketplace" });
    }
  });

  app.post('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Verificar que completó nivel 4 exactamente (verificar existencia de registro_direccion)
      const registroDireccion = await storage.getRegistroDireccion(userId);
      if (!registroDireccion) {
        return res.status(400).json({ message: "Debe completar el nivel 4 (registro dirección) primero" });
      }
      
      const data = insertRegistroMarketplaceSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const registro = await storage.createRegistroMarketplace(data);
      res.json(registro);
    } catch (error: any) {
      console.error("Error al crear registro marketplace:", error);
      res.status(400).json({ message: error.message || "Error al crear registro marketplace" });
    }
  });

  app.patch('/api/registro/marketplace', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registro = await storage.updateRegistroMarketplace(userId, req.body);
      if (!registro) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }
      res.json(registro);
    } catch (error) {
      console.error("Error al actualizar registro marketplace:", error);
      res.status(500).json({ message: "Error al actualizar registro marketplace" });
    }
  });

  // CREDENCIALES DE CONDUCTOR
  app.get('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credenciales = await storage.getCredencialesConductor(userId);
      res.json(credenciales || {});
    } catch (error) {
      console.error("Error al obtener credenciales conductor:", error);
      res.status(500).json({ message: "Error al obtener credenciales conductor" });
    }
  });

  app.post('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertCredencialesConductorSchema.parse({
        ...req.body,
        usuarioId: userId,
      });
      const credenciales = await storage.createCredencialesConductor(data);
      res.json(credenciales);
    } catch (error: any) {
      console.error("Error al crear credenciales conductor:", error);
      res.status(400).json({ message: error.message || "Error al crear credenciales conductor" });
    }
  });

  app.patch('/api/registro/credenciales-conductor', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const credenciales = await storage.updateCredencialesConductor(userId, req.body);
      if (!credenciales) {
        return res.status(404).json({ message: "Credenciales no encontradas" });
      }
      res.json(credenciales);
    } catch (error) {
      console.error("Error al actualizar credenciales conductor:", error);
      res.status(500).json({ message: "Error al actualizar credenciales conductor" });
    }
  });

  // ============================================================
  // ENCUESTAS
  // ============================================================

  app.get('/api/encuestas', async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      res.json(encuestas);
    } catch (error) {
      console.error("Error al obtener encuestas:", error);
      res.status(500).json({ message: "Error al obtener encuestas" });
    }
  });

  app.get('/api/encuestas/activas', async (req, res) => {
    try {
      const encuestas = await storage.getEncuestas();
      const ahora = new Date();
      const activas = encuestas.filter(e => {
        if (e.estado !== 'activa') return false;
        const inicioValido = !e.fechaInicio || new Date(e.fechaInicio) <= ahora;
        const finValido = !e.fechaFin || new Date(e.fechaFin) >= ahora;
        return inicioValido && finValido;
      });
      res.json(activas);
    } catch (error) {
      console.error("Error al obtener encuestas activas:", error);
      res.status(500).json({ message: "Error al obtener encuestas activas" });
    }
  });

  app.get('/api/encuestas/:id', async (req, res) => {
    try {
      const encuesta = await storage.getEncuesta(req.params.id);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error) {
      console.error("Error al obtener encuesta:", error);
      res.status(500).json({ message: "Error al obtener encuesta" });
    }
  });

  app.get('/api/encuestas/:id/resultados', async (req, res) => {
    try {
      const encuesta = await storage.getEncuesta(req.params.id);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      const resultados = await storage.getResultadosEncuesta(req.params.id);
      res.json({ encuesta, resultados });
    } catch (error) {
      console.error("Error al obtener resultados:", error);
      res.status(500).json({ message: "Error al obtener resultados" });
    }
  });

  app.post('/api/encuestas', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        usuarioId: userId,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
      };
      const encuesta = await storage.createEncuesta(data);
      res.json(encuesta);
    } catch (error: any) {
      console.error("Error al crear encuesta:", error);
      res.status(400).json({ message: error.message || "Error al crear encuesta" });
    }
  });

  app.patch('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
      };
      const encuesta = await storage.updateEncuesta(req.params.id, data);
      if (!encuesta) {
        return res.status(404).json({ message: "Encuesta no encontrada" });
      }
      res.json(encuesta);
    } catch (error: any) {
      console.error("Error al actualizar encuesta:", error);
      res.status(400).json({ message: error.message || "Error al actualizar encuesta" });
    }
  });

  app.delete('/api/encuestas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteEncuesta(req.params.id);
      res.json({ message: "Encuesta eliminada" });
    } catch (error) {
      console.error("Error al eliminar encuesta:", error);
      res.status(500).json({ message: "Error al eliminar encuesta" });
    }
  });

  app.post('/api/encuestas/:id/responder', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const encuestaId = req.params.id;
      
      const yaRespondio = await storage.verificarRespuestaUsuario(encuestaId, userId);
      if (yaRespondio) {
        return res.status(400).json({ message: "Ya has respondido esta encuesta" });
      }

      const respuesta = await storage.createRespuestaEncuesta({
        encuestaId,
        usuarioId: userId,
        respuestas: req.body.respuestas,
      });
      res.json(respuesta);
    } catch (error: any) {
      console.error("Error al responder encuesta:", error);
      res.status(400).json({ message: error.message || "Error al responder encuesta" });
    }
  });

  // ============================================================
  // POPUPS PUBLICITARIOS
  // ============================================================

  app.get('/api/popups', async (req, res) => {
    try {
      const popups = await storage.getPopups();
      res.json(popups);
    } catch (error) {
      console.error("Error al obtener popups:", error);
      res.status(500).json({ message: "Error al obtener popups" });
    }
  });

  app.get('/api/popups/activos', async (req, res) => {
    try {
      const popups = await storage.getPopupsActivos();
      res.json(popups);
    } catch (error) {
      console.error("Error al obtener popups activos:", error);
      res.status(500).json({ message: "Error al obtener popups activos" });
    }
  });

  app.get('/api/popups/:id', async (req, res) => {
    try {
      const popup = await storage.getPopup(req.params.id);
      if (!popup) {
        return res.status(404).json({ message: "Popup no encontrado" });
      }
      res.json(popup);
    } catch (error) {
      console.error("Error al obtener popup:", error);
      res.status(500).json({ message: "Error al obtener popup" });
    }
  });

  app.post('/api/popups', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = {
        ...req.body,
        usuarioId: userId,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : null,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : null,
      };
      const popup = await storage.createPopup(data);
      res.json(popup);
    } catch (error: any) {
      console.error("Error al crear popup:", error);
      res.status(400).json({ message: error.message || "Error al crear popup" });
    }
  });

  app.patch('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const data = {
        ...req.body,
        fechaInicio: req.body.fechaInicio ? new Date(req.body.fechaInicio) : undefined,
        fechaFin: req.body.fechaFin ? new Date(req.body.fechaFin) : undefined,
      };
      const popup = await storage.updatePopup(req.params.id, data);
      if (!popup) {
        return res.status(404).json({ message: "Popup no encontrado" });
      }
      res.json(popup);
    } catch (error: any) {
      console.error("Error al actualizar popup:", error);
      res.status(400).json({ message: error.message || "Error al actualizar popup" });
    }
  });

  app.delete('/api/popups/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deletePopup(req.params.id);
      res.json({ message: "Popup eliminado" });
    } catch (error) {
      console.error("Error al eliminar popup:", error);
      res.status(500).json({ message: "Error al eliminar popup" });
    }
  });

  app.post('/api/popups/:id/vista', async (req, res) => {
    try {
      await storage.incrementarVistasPopup(req.params.id);
      res.json({ message: "Vista registrada" });
    } catch (error) {
      console.error("Error al registrar vista:", error);
      res.status(500).json({ message: "Error al registrar vista" });
    }
  });

  // ============================================================
  // INTERACCIONES SOCIALES (likes, favoritos, compartir, calendario)
  // ============================================================

  app.get('/api/interacciones/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const contadores = await storage.getContadoresInteracciones(tipoContenido, contenidoId);
      res.json(contadores);
    } catch (error) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  app.post('/api/interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, tipoInteraccion, valor } = req.body;
      
      const yaExiste = await storage.verificarInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
      if (yaExiste) {
        await storage.deleteInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
        return res.json({ message: "Interacción eliminada", accion: "eliminada" });
      }

      const interaccion = await storage.createInteraccion({
        tipoContenido,
        contenidoId,
        usuarioId: userId,
        tipoInteraccion,
        valor,
      });
      res.json({ ...interaccion, accion: "creada" });
    } catch (error: any) {
      console.error("Error al crear interacción:", error);
      res.status(400).json({ message: error.message || "Error al crear interacción" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId/usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId } = req.params;
      
      const tipos = ['like', 'favorito', 'compartir', 'calendario'];
      const interacciones: { [key: string]: boolean } = {};
      
      for (const tipo of tipos) {
        interacciones[tipo] = await storage.verificarInteraccion(userId, tipoContenido, contenidoId, tipo);
      }
      
      res.json(interacciones);
    } catch (error) {
      console.error("Error al verificar interacciones:", error);
      res.status(500).json({ message: "Error al verificar interacciones" });
    }
  });

  // ============================================================
  // COMENTARIOS
  // ============================================================

  app.get('/api/comentarios/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const comentarios = await storage.getComentarios(tipoContenido, contenidoId);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  app.post('/api/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, texto } = req.body;
      
      const comentario = await storage.createComentario({
        tipoContenido,
        contenidoId,
        usuarioId: userId,
        texto,
      });
      res.json(comentario);
    } catch (error: any) {
      console.error("Error al crear comentario:", error);
      res.status(400).json({ message: error.message || "Error al crear comentario" });
    }
  });

  app.delete('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteComentario(req.params.id);
      res.json({ message: "Comentario eliminado" });
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // ============================================================
  // CATEGORÍAS DE SERVICIOS LOCALES
  // ============================================================

  app.get('/api/categorias-servicio', async (req, res) => {
    try {
      const categorias = await storage.getCategoriasServicio();
      res.json(categorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  });

  app.get('/api/categorias-servicio/:id', async (req, res) => {
    try {
      const categoria = await storage.getCategoriaServicio(req.params.id);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error) {
      console.error("Error al obtener categoría:", error);
      res.status(500).json({ message: "Error al obtener categoría" });
    }
  });

  app.post('/api/categorias-servicio', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.createCategoriaServicio(req.body);
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      res.status(400).json({ message: error.message || "Error al crear categoría" });
    }
  });

  app.patch('/api/categorias-servicio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.updateCategoriaServicio(req.params.id, req.body);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al actualizar categoría:", error);
      res.status(400).json({ message: error.message || "Error al actualizar categoría" });
    }
  });

  app.delete('/api/categorias-servicio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteCategoriaServicio(req.params.id);
      res.json({ message: "Categoría eliminada" });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ message: "Error al eliminar categoría" });
    }
  });

  // ============================================================
  // SUBCATEGORÍAS DE SERVICIOS LOCALES
  // ============================================================

  app.get('/api/subcategorias-servicio', async (req, res) => {
    try {
      const { categoriaId } = req.query;
      const subcategorias = await storage.getSubcategoriasServicio(categoriaId as string);
      res.json(subcategorias);
    } catch (error) {
      console.error("Error al obtener subcategorías:", error);
      res.status(500).json({ message: "Error al obtener subcategorías" });
    }
  });

  app.get('/api/subcategorias-servicio/:id', async (req, res) => {
    try {
      const subcategoria = await storage.getSubcategoriaServicio(req.params.id);
      if (!subcategoria) {
        return res.status(404).json({ message: "Subcategoría no encontrada" });
      }
      res.json(subcategoria);
    } catch (error) {
      console.error("Error al obtener subcategoría:", error);
      res.status(500).json({ message: "Error al obtener subcategoría" });
    }
  });

  app.post('/api/subcategorias-servicio', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const subcategoria = await storage.createSubcategoriaServicio(req.body);
      res.json(subcategoria);
    } catch (error: any) {
      console.error("Error al crear subcategoría:", error);
      res.status(400).json({ message: error.message || "Error al crear subcategoría" });
    }
  });

  app.patch('/api/subcategorias-servicio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const subcategoria = await storage.updateSubcategoriaServicio(req.params.id, req.body);
      if (!subcategoria) {
        return res.status(404).json({ message: "Subcategoría no encontrada" });
      }
      res.json(subcategoria);
    } catch (error: any) {
      console.error("Error al actualizar subcategoría:", error);
      res.status(400).json({ message: error.message || "Error al actualizar subcategoría" });
    }
  });

  app.delete('/api/subcategorias-servicio/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteSubcategoriaServicio(req.params.id);
      res.json({ message: "Subcategoría eliminada" });
    } catch (error) {
      console.error("Error al eliminar subcategoría:", error);
      res.status(500).json({ message: "Error al eliminar subcategoría" });
    }
  });

  // ============================================================
  // LOGOS DE SERVICIOS (Negocios/Locales)
  // ============================================================

  app.get('/api/logos-servicio', async (req, res) => {
    try {
      const { categoriaId, estado } = req.query;
      const logos = await storage.getLogosServicio(categoriaId as string, estado as string);
      res.json(logos);
    } catch (error) {
      console.error("Error al obtener logos:", error);
      res.status(500).json({ message: "Error al obtener logos" });
    }
  });

  app.get('/api/logos-servicio/:id', async (req, res) => {
    try {
      const logo = await storage.getLogoServicio(req.params.id);
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      res.json(logo);
    } catch (error) {
      console.error("Error al obtener logo:", error);
      res.status(500).json({ message: "Error al obtener logo" });
    }
  });

  app.get('/api/logos-servicio/usuario/:usuarioId', isAuthenticated, async (req: any, res) => {
    try {
      const logos = await storage.getLogosServicioPorUsuario(req.params.usuarioId);
      res.json(logos);
    } catch (error) {
      console.error("Error al obtener logos del usuario:", error);
      res.status(500).json({ message: "Error al obtener logos del usuario" });
    }
  });

  app.post('/api/logos-servicio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body, usuarioId: userId };
      const logo = await storage.createLogoServicio(data);
      res.json(logo);
    } catch (error: any) {
      console.error("Error al crear logo:", error);
      res.status(400).json({ message: error.message || "Error al crear logo" });
    }
  });

  app.patch('/api/logos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const logo = await storage.getLogoServicio(req.params.id);
      
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para modificar este logo" });
      }
      
      const updatedLogo = await storage.updateLogoServicio(req.params.id, req.body);
      res.json(updatedLogo);
    } catch (error: any) {
      console.error("Error al actualizar logo:", error);
      res.status(400).json({ message: error.message || "Error al actualizar logo" });
    }
  });

  app.delete('/api/logos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const logo = await storage.getLogoServicio(req.params.id);
      
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      
      const esSuperAdmin = userRoles.includes('super_admin');
      
      if (!esSuperAdmin) {
        return res.status(403).json({ message: "Solo el super administrador puede eliminar logos" });
      }
      
      await storage.deleteLogoServicio(req.params.id);
      res.json({ message: "Logo eliminado" });
    } catch (error) {
      console.error("Error al eliminar logo:", error);
      res.status(500).json({ message: "Error al eliminar logo" });
    }
  });

  app.post('/api/logos-servicio/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const logoId = req.params.id;
      const logo = await storage.getLogoServicio(logoId);
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      const nuevoTotal = (logo.totalLikes || 0) + 1;
      await storage.updateLogoServicio(logoId, { totalLikes: nuevoTotal });
      res.json({ totalLikes: nuevoTotal });
    } catch (error) {
      console.error("Error al dar like:", error);
      res.status(500).json({ message: "Error al dar like" });
    }
  });

  app.post('/api/logos-servicio/:id/favorito', isAuthenticated, async (req: any, res) => {
    try {
      const logoId = req.params.id;
      const logo = await storage.getLogoServicio(logoId);
      if (!logo) {
        return res.status(404).json({ message: "Logo no encontrado" });
      }
      const nuevoTotal = (logo.totalFavoritos || 0) + 1;
      await storage.updateLogoServicio(logoId, { totalFavoritos: nuevoTotal });
      res.json({ totalFavoritos: nuevoTotal });
    } catch (error) {
      console.error("Error al agregar a favoritos:", error);
      res.status(500).json({ message: "Error al agregar a favoritos" });
    }
  });

  // Sugerir logo propio para aprobación por super admin
  app.post('/api/logos-servicios/sugerir', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { nombre, descripcion, logoUrl } = req.body;
      
      if (!nombre || !logoUrl) {
        return res.status(400).json({ message: "El nombre y la imagen del logo son requeridos" });
      }
      
      const logo = await storage.createLogoServicio({
        nombre,
        descripcion: descripcion || "",
        logoUrl,
        usuarioId: userId,
        estado: "pendiente",
      });
      
      // Notificar a super admins
      try {
        await notificarSuperAdmins({
          tipo: 'nuevo_usuario',
          titulo: 'Nuevo Logo Sugerido',
          mensaje: `Nuevo logo "${nombre}" pendiente de aprobación`,
          usuarioId: userId,
        });
      } catch (notifError) {
        console.error("Error al notificar super admins:", notifError);
      }
      
      res.status(201).json({ 
        message: "Logo enviado para aprobación", 
        logo 
      });
    } catch (error: any) {
      console.error("Error al sugerir logo:", error);
      res.status(400).json({ message: error.message || "Error al sugerir logo" });
    }
  });

  // ============================================================
  // PRODUCTOS DE SERVICIOS LOCALES
  // ============================================================

  app.get('/api/productos-servicio', async (req, res) => {
    try {
      const { logoServicioId, categoria, disponible } = req.query;
      const productos = await storage.getProductosServicio(
        logoServicioId as string, 
        categoria as string, 
        disponible === 'true'
      );
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  app.get('/api/productos-servicio/:id', async (req, res) => {
    try {
      const producto = await storage.getProductoServicio(req.params.id);
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(producto);
    } catch (error) {
      console.error("Error al obtener producto:", error);
      res.status(500).json({ message: "Error al obtener producto" });
    }
  });

  app.get('/api/logos-servicio/:logoId/productos', async (req, res) => {
    try {
      const productos = await storage.getProductosPorLogo(req.params.logoId);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos del logo:", error);
      res.status(500).json({ message: "Error al obtener productos del logo" });
    }
  });

  app.post('/api/productos-servicio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { logoServicioId } = req.body;
      
      const logo = await storage.getLogoServicio(logoServicioId);
      if (!logo) {
        return res.status(404).json({ message: "Logo de servicio no encontrado" });
      }
      
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para agregar productos a este servicio" });
      }
      
      const resultado = await storage.createProductoServicioConCobro(req.body, userId, esSuperAdmin);
      res.json(resultado);
    } catch (error: any) {
      console.error("Error al crear producto:", error);
      res.status(400).json({ message: error.message || "Error al crear producto" });
    }
  });

  app.patch('/api/productos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const producto = await storage.getProductoServicio(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      const logo = await storage.getLogoServicio(producto.logoServicioId);
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo?.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
      }
      
      const updatedProducto = await storage.updateProductoServicio(req.params.id, req.body);
      res.json(updatedProducto);
    } catch (error: any) {
      console.error("Error al actualizar producto:", error);
      res.status(400).json({ message: error.message || "Error al actualizar producto" });
    }
  });

  app.delete('/api/productos-servicio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const producto = await storage.getProductoServicio(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      const logo = await storage.getLogoServicio(producto.logoServicioId);
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const esPropietario = logo?.usuarioId === userId;
      
      if (!esSuperAdmin && !esPropietario) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
      }
      
      await storage.deleteProductoServicio(req.params.id);
      res.json({ message: "Producto eliminado" });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(500).json({ message: "Error al eliminar producto" });
    }
  });

  // ============================================================
  // INTERACCIONES SOCIALES (likes, favoritos, compartir)
  // ============================================================

  app.post('/api/interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, tipoInteraccion } = req.body;
      
      if (!tipoContenido || !contenidoId || !tipoInteraccion) {
        return res.status(400).json({ message: "Faltan campos requeridos" });
      }

      const interaccion = await storage.toggleInteraccion(userId, tipoContenido, contenidoId, tipoInteraccion);
      res.json(interaccion);
    } catch (error: any) {
      console.error("Error en interacción:", error);
      res.status(400).json({ message: error.message || "Error en interacción" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const stats = await storage.getInteraccionesStats(tipoContenido, contenidoId);
      res.json(stats);
    } catch (error) {
      console.error("Error al obtener stats:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  app.get('/api/interacciones/:tipoContenido/:contenidoId/usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId } = req.params;
      const interacciones = await storage.getInteraccionesUsuario(userId, tipoContenido, contenidoId);
      res.json(interacciones);
    } catch (error) {
      console.error("Error al obtener interacciones del usuario:", error);
      res.status(500).json({ message: "Error al obtener interacciones" });
    }
  });

  // ============================================================
  // COMENTARIOS
  // ============================================================

  app.get('/api/comentarios/:tipoContenido/:contenidoId', async (req, res) => {
    try {
      const { tipoContenido, contenidoId } = req.params;
      const comentarios = await storage.getComentarios(tipoContenido, contenidoId);
      res.json(comentarios);
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      res.status(500).json({ message: "Error al obtener comentarios" });
    }
  });

  app.post('/api/comentarios', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipoContenido, contenidoId, texto } = req.body;
      
      if (!tipoContenido || !contenidoId || !texto) {
        return res.status(400).json({ message: "Faltan campos requeridos" });
      }

      const comentario = await storage.createComentario({
        usuarioId: userId,
        tipoContenido,
        contenidoId,
        texto,
      });
      res.json(comentario);
    } catch (error: any) {
      console.error("Error al crear comentario:", error);
      res.status(400).json({ message: error.message || "Error al crear comentario" });
    }
  });

  app.patch('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const comentario = await storage.getComentario(req.params.id);
      if (!comentario) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      
      if (!esSuperAdmin && comentario.usuarioId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para editar este comentario" });
      }
      
      const { texto } = req.body;
      if (!texto) {
        return res.status(400).json({ message: "El texto es requerido" });
      }
      
      const actualizado = await storage.updateComentario(req.params.id, { texto });
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar comentario:", error);
      res.status(400).json({ message: error.message || "Error al actualizar comentario" });
    }
  });

  app.delete('/api/comentarios/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const comentario = await storage.getComentario(req.params.id);
      if (!comentario) {
        return res.status(404).json({ message: "Comentario no encontrado" });
      }
      
      if (!esSuperAdmin && comentario.usuarioId !== userId) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este comentario" });
      }
      
      await storage.deleteComentario(req.params.id);
      res.json({ message: "Comentario eliminado" });
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      res.status(500).json({ message: "Error al eliminar comentario" });
    }
  });

  // ============================================================
  // FAVORITOS DEL USUARIO
  // ============================================================

  app.get('/api/favoritos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipo } = req.query;
      const favoritos = await storage.getFavoritosUsuario(userId, tipo as string);
      res.json(favoritos);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ message: "Error al obtener favoritos" });
    }
  });

  // ============================================================
  // SISTEMA DE CARTERA Y SALDOS
  // ============================================================

  // --- MÉTODOS DE PAGO ---
  
  // Obtener métodos de pago (plataforma o de un usuario)
  app.get('/api/metodos-pago', isAuthenticated, async (req: any, res) => {
    try {
      const { esPlataforma, usuarioId } = req.query;
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      // Si busca métodos de plataforma, cualquiera puede verlos
      if (esPlataforma === 'true') {
        const metodos = await storage.getMetodosPago(undefined, true);
        return res.json(metodos);
      }
      
      // Si es super admin, puede ver de cualquier usuario
      if (esSuperAdmin && usuarioId) {
        const metodos = await storage.getMetodosPago(usuarioId as string);
        return res.json(metodos);
      }
      
      // Usuario normal solo ve sus propios métodos
      const metodos = await storage.getMetodosPago(userId);
      res.json(metodos);
    } catch (error) {
      console.error("Error al obtener métodos de pago:", error);
      res.status(500).json({ message: "Error al obtener métodos de pago" });
    }
  });

  // Crear método de pago
  app.post('/api/metodos-pago', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const data = req.body;
      
      // Solo super admin puede crear métodos de plataforma
      if (data.esPlataforma && !esSuperAdmin) {
        return res.status(403).json({ message: "No autorizado para crear métodos de plataforma" });
      }
      
      // Si no es método de plataforma, asignar al usuario actual
      if (!data.esPlataforma) {
        data.usuarioId = userId;
      }
      
      const metodo = await storage.createMetodoPago(data);
      res.status(201).json(metodo);
    } catch (error) {
      console.error("Error al crear método de pago:", error);
      res.status(500).json({ message: "Error al crear método de pago" });
    }
  });

  // Actualizar método de pago
  app.patch('/api/metodos-pago/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const metodo = await storage.getMetodoPago(req.params.id);
      if (!metodo) {
        return res.status(404).json({ message: "Método de pago no encontrado" });
      }
      
      // Verificar permisos
      if (!esSuperAdmin && metodo.usuarioId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      const actualizado = await storage.updateMetodoPago(req.params.id, req.body);
      res.json(actualizado);
    } catch (error) {
      console.error("Error al actualizar método de pago:", error);
      res.status(500).json({ message: "Error al actualizar método de pago" });
    }
  });

  // Eliminar método de pago
  app.delete('/api/metodos-pago/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      const metodo = await storage.getMetodoPago(req.params.id);
      if (!metodo) {
        return res.status(404).json({ message: "Método de pago no encontrado" });
      }
      
      // Verificar permisos
      if (!esSuperAdmin && metodo.usuarioId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      await storage.deleteMetodoPago(req.params.id);
      res.json({ message: "Método de pago eliminado" });
    } catch (error) {
      console.error("Error al eliminar método de pago:", error);
      res.status(500).json({ message: "Error al eliminar método de pago" });
    }
  });

  // --- MONEDAS Y TIPOS DE CAMBIO ---
  
  // Obtener todas las monedas
  app.get('/api/monedas', async (req, res) => {
    try {
      const monedas = await storage.getMonedas();
      res.json(monedas);
    } catch (error) {
      console.error("Error al obtener monedas:", error);
      res.status(500).json({ message: "Error al obtener monedas" });
    }
  });

  // Crear moneda (solo super admin)
  app.post('/api/monedas', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const moneda = await storage.createMoneda(req.body);
      res.status(201).json(moneda);
    } catch (error) {
      console.error("Error al crear moneda:", error);
      res.status(500).json({ message: "Error al crear moneda" });
    }
  });

  // Actualizar moneda (solo super admin)
  app.patch('/api/monedas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const actualizada = await storage.updateMoneda(req.params.id, req.body);
      if (!actualizada) {
        return res.status(404).json({ message: "Moneda no encontrada" });
      }
      res.json(actualizada);
    } catch (error) {
      console.error("Error al actualizar moneda:", error);
      res.status(500).json({ message: "Error al actualizar moneda" });
    }
  });

  // Eliminar moneda (solo super admin)
  app.delete('/api/monedas/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteMoneda(req.params.id);
      res.json({ message: "Moneda eliminada" });
    } catch (error) {
      console.error("Error al eliminar moneda:", error);
      res.status(500).json({ message: "Error al eliminar moneda" });
    }
  });

  // --- SALDOS DE USUARIOS ---
  
  // Obtener saldo del usuario actual
  app.get('/api/saldos/mi-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let saldo = await storage.getSaldoUsuario(userId);
      
      // Si no existe, crear con saldo 0
      if (!saldo) {
        saldo = await storage.upsertSaldoUsuario({
          usuarioId: userId,
          saldo: "0",
          monedaPreferida: "PEN",
          totalIngresos: "0",
          totalEgresos: "0",
        });
      }
      
      res.json(saldo);
    } catch (error) {
      console.error("Error al obtener saldo:", error);
      res.status(500).json({ message: "Error al obtener saldo" });
    }
  });

  // Obtener todos los saldos (solo super admin)
  app.get('/api/saldos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const saldos = await storage.getAllSaldosUsuarios();
      res.json(saldos);
    } catch (error) {
      console.error("Error al obtener saldos:", error);
      res.status(500).json({ message: "Error al obtener saldos" });
    }
  });

  // Obtener saldo de un usuario específico (solo super admin)
  app.get('/api/saldos/:usuarioId', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const saldo = await storage.getSaldoUsuario(req.params.usuarioId);
      if (!saldo) {
        return res.status(404).json({ message: "Saldo no encontrado" });
      }
      res.json(saldo);
    } catch (error) {
      console.error("Error al obtener saldo del usuario:", error);
      res.status(500).json({ message: "Error al obtener saldo del usuario" });
    }
  });

  // --- SOLICITUDES DE SALDO (Recargas y Retiros) ---
  
  // Obtener solicitudes (super admin ve todas, usuario ve las suyas)
  app.get('/api/solicitudes-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      const { estado } = req.query;
      
      if (esSuperAdmin) {
        const solicitudes = await storage.getSolicitudesSaldo(estado as string);
        res.json(solicitudes);
      } else {
        const solicitudes = await storage.getSolicitudesSaldoPorUsuario(userId);
        res.json(solicitudes);
      }
    } catch (error) {
      console.error("Error al obtener solicitudes de saldo:", error);
      res.status(500).json({ message: "Error al obtener solicitudes" });
    }
  });

  // Crear solicitud de recarga o retiro
  app.post('/api/solicitudes-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tipo, monto, metodoPagoId, numeroOperacion, comprobante, notas } = req.body;
      
      if (!tipo || !monto) {
        return res.status(400).json({ message: "Tipo y monto son requeridos" });
      }
      
      // Validar que el monto sea positivo
      if (parseFloat(monto) <= 0) {
        return res.status(400).json({ message: "El monto debe ser mayor a 0" });
      }
      
      // Para retiros, verificar que tenga saldo suficiente
      if (tipo === 'retiro') {
        const saldo = await storage.getSaldoUsuario(userId);
        if (!saldo || parseFloat(saldo.saldo) < parseFloat(monto)) {
          return res.status(400).json({ message: "Saldo insuficiente" });
        }
      }
      
      const solicitud = await storage.createSolicitudSaldo({
        usuarioId: userId,
        tipo,
        monto,
        metodoPagoId,
        numeroOperacion,
        comprobante,
        notas,
        estado: 'pendiente',
      });
      
      // Notificar a super admins
      const usuario = await storage.getUser(userId);
      const nombreUsuario = [usuario?.firstName, usuario?.lastName].filter(Boolean).join(' ') || 'Usuario';
      
      notificarSuperAdmins({
        tipo: tipo === 'recarga' ? 'recarga' : 'retiro',
        titulo: tipo === 'recarga' ? '💰 Nueva Recarga' : '💸 Nueva Solicitud de Retiro',
        mensaje: `${nombreUsuario} solicita ${tipo} de S/. ${monto}`,
        usuarioId: userId,
        usuarioNombre: nombreUsuario,
        monto: parseFloat(monto),
      });
      
      res.status(201).json(solicitud);
    } catch (error) {
      console.error("Error al crear solicitud de saldo:", error);
      res.status(500).json({ message: "Error al crear solicitud" });
    }
  });

  // Aprobar solicitud (solo super admin)
  app.post('/api/solicitudes-saldo/:id/aprobar', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const solicitud = await storage.aprobarSolicitudSaldo(req.params.id, adminId);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      res.json(solicitud);
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      res.status(500).json({ message: "Error al aprobar solicitud" });
    }
  });

  // Rechazar solicitud (solo super admin)
  app.post('/api/solicitudes-saldo/:id/rechazar', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { motivoRechazo } = req.body;
      
      if (!motivoRechazo) {
        return res.status(400).json({ message: "Motivo de rechazo es requerido" });
      }
      
      const solicitud = await storage.rechazarSolicitudSaldo(req.params.id, motivoRechazo);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      res.json(solicitud);
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      res.status(500).json({ message: "Error al rechazar solicitud" });
    }
  });

  // Observar solicitud (cambiar estado a observado)
  app.post('/api/solicitudes-saldo/:id/observar', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const { notas } = req.body;
      const solicitud = await storage.observarSolicitudSaldo(req.params.id, notas || null);
      
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      res.json(solicitud);
    } catch (error) {
      console.error("Error al observar solicitud:", error);
      res.status(500).json({ message: "Error al observar solicitud" });
    }
  });

  // --- TRANSACCIONES DE SALDO ---
  
  // Obtener transacciones (super admin ve todas, usuario ve las suyas)
  app.get('/api/transacciones-saldo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      if (esSuperAdmin) {
        const transacciones = await storage.getTransaccionesSaldo();
        res.json(transacciones);
      } else {
        const transacciones = await storage.getTransaccionesSaldo(userId);
        res.json(transacciones);
      }
    } catch (error) {
      console.error("Error al obtener transacciones:", error);
      res.status(500).json({ message: "Error al obtener transacciones" });
    }
  });

  // Obtener transacciones de un usuario específico (solo super admin)
  app.get('/api/transacciones-saldo/usuario/:usuarioId', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const transacciones = await storage.getTransaccionesSaldo(req.params.usuarioId);
      res.json(transacciones);
    } catch (error) {
      console.error("Error al obtener transacciones del usuario:", error);
      res.status(500).json({ message: "Error al obtener transacciones del usuario" });
    }
  });

  // --- CONFIGURACIÓN DE SALDOS (Tarifas y comisiones) ---
  
  // Obtener todas las configuraciones de tarifas
  app.get('/api/configuracion-saldos', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getConfiguracionesSaldos();
      res.json(config);
    } catch (error) {
      console.error("Error al obtener configuración de saldos:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  // Actualizar o crear configuración de tarifa (solo super admin)
  app.post('/api/configuracion-saldos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const config = await storage.upsertConfiguracionSaldo(req.body);
      res.json(config);
    } catch (error: any) {
      console.error("Error al actualizar configuración de saldos:", error);
      res.status(400).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  // ============================================================
  // PLANES DE MEMBRESÍA
  // ============================================================

  // Obtener todos los planes de membresía (públicos los activos, admin ve todos)
  app.get('/api/planes-membresia', async (req: any, res) => {
    try {
      const soloActivos = req.query.todos !== 'true';
      const planes = await storage.getPlanesMembresia(soloActivos);
      res.json(planes);
    } catch (error) {
      console.error("Error al obtener planes de membresía:", error);
      res.status(500).json({ message: "Error al obtener planes de membresía" });
    }
  });

  // Obtener un plan específico
  app.get('/api/planes-membresia/:id', async (req, res) => {
    try {
      const plan = await storage.getPlanMembresia(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Plan no encontrado" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error al obtener plan:", error);
      res.status(500).json({ message: "Error al obtener plan" });
    }
  });

  // Crear plan (solo super admin)
  app.post('/api/planes-membresia', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const plan = await storage.createPlanMembresia(req.body);
      res.json(plan);
    } catch (error: any) {
      console.error("Error al crear plan:", error);
      res.status(400).json({ message: error.message || "Error al crear plan" });
    }
  });

  // Actualizar plan (solo super admin)
  app.patch('/api/planes-membresia/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const plan = await storage.updatePlanMembresia(req.params.id, req.body);
      if (!plan) {
        return res.status(404).json({ message: "Plan no encontrado" });
      }
      res.json(plan);
    } catch (error: any) {
      console.error("Error al actualizar plan:", error);
      res.status(400).json({ message: error.message || "Error al actualizar plan" });
    }
  });

  // Eliminar plan (solo super admin)
  app.delete('/api/planes-membresia/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deletePlanMembresia(req.params.id);
      res.json({ message: "Plan eliminado" });
    } catch (error) {
      console.error("Error al eliminar plan:", error);
      res.status(500).json({ message: "Error al eliminar plan" });
    }
  });

  // ============================================================
  // MEMBRESÍAS DE USUARIOS
  // ============================================================

  // Obtener todas las membresías (solo super admin)
  app.get('/api/membresias', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const membresias = await storage.getMembresiasUsuarios();
      res.json(membresias);
    } catch (error) {
      console.error("Error al obtener membresías:", error);
      res.status(500).json({ message: "Error al obtener membresías" });
    }
  });

  // Obtener membresía activa del usuario autenticado
  app.get('/api/mi-membresia', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membresia = await storage.getMembresiaActiva(userId);
      
      if (!membresia) {
        return res.json(null);
      }
      
      // Obtener datos del plan asociado
      const plan = await storage.getPlanMembresia(membresia.planId);
      
      // Serializar fechas a ISO string para evitar problemas de parsing en el frontend
      res.json({
        ...membresia,
        fechaInicio: membresia.fechaInicio instanceof Date ? membresia.fechaInicio.toISOString() : membresia.fechaInicio,
        fechaFin: membresia.fechaFin instanceof Date ? membresia.fechaFin.toISOString() : membresia.fechaFin,
        activa: true,
        plan: plan || null,
      });
    } catch (error) {
      console.error("Error al obtener membresía del usuario:", error);
      res.status(500).json({ message: "Error al obtener membresía" });
    }
  });

  // Contratar membresía (el usuario paga con saldo o solicita pago)
  app.post('/api/membresias/contratar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId, metodoPago } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "ID del plan requerido" });
      }
      
      const plan = await storage.getPlanMembresia(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan no encontrado" });
      }
      
      const precio = plan.precioDescuento ? parseFloat(plan.precioDescuento) : parseFloat(plan.precioNormal);
      
      // Si el pago es con saldo, verificar y descontar
      if (metodoPago === 'saldo') {
        const saldoData = await storage.getSaldoUsuario(userId);
        const saldoActual = saldoData ? parseFloat(saldoData.saldo) : 0;
        
        if (saldoActual < precio) {
          return res.status(400).json({ 
            message: "Saldo insuficiente", 
            saldoActual,
            requerido: precio 
          });
        }
        
        // Descontar saldo
        await storage.upsertSaldoUsuario({
          usuarioId: userId,
          saldo: (saldoActual - precio).toFixed(2)
        });
        
        // Registrar transacción
        await storage.createTransaccionSaldo({
          usuarioId: userId,
          tipo: 'gasto',
          monto: precio.toFixed(2),
          concepto: `Contratación de membresía: ${plan.nombre}`,
          estado: 'completada'
        });
      }
      
      // Calcular fechas
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + plan.duracionMeses);
      
      // Crear membresía
      const membresia = await storage.createMembresiaUsuario({
        usuarioId: userId,
        planId,
        fechaInicio,
        fechaFin,
        estado: metodoPago === 'saldo' ? 'activa' : 'pendiente',
        montoTotal: precio.toFixed(2),
        metodoPago: metodoPago || 'pendiente'
      });
      
      res.json(membresia);
    } catch (error: any) {
      console.error("Error al contratar membresía:", error);
      res.status(400).json({ message: error.message || "Error al contratar membresía" });
    }
  });

  // Aprobar membresía pendiente (solo super admin)
  app.patch('/api/membresias/:id/aprobar', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const membresia = await storage.updateMembresiaUsuario(req.params.id, {
        estado: 'activa'
      });
      if (!membresia) {
        return res.status(404).json({ message: "Membresía no encontrada" });
      }
      res.json(membresia);
    } catch (error) {
      console.error("Error al aprobar membresía:", error);
      res.status(500).json({ message: "Error al aprobar membresía" });
    }
  });

  // Asignar membresía de cortesía (solo super admin)
  app.post('/api/membresias/cortesia', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { usuarioId, duracionMeses, motivo } = req.body;
      const adminId = req.user?.claims?.sub;
      
      if (!usuarioId || !duracionMeses) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }
      
      if (![1, 3, 6, 12].includes(duracionMeses)) {
        return res.status(400).json({ message: "Duración inválida. Use 1, 3, 6 o 12 meses" });
      }
      
      // Buscar o crear plan de cortesía temporal
      const nombrePlan = `Cortesía ${duracionMeses} ${duracionMeses === 1 ? 'mes' : 'meses'}`;
      let plan = await storage.getPlanMembresiaPorNombre(nombrePlan);
      
      if (!plan) {
        // Crear plan de cortesía si no existe
        plan = await storage.createPlanMembresia({
          nombre: nombrePlan,
          descripcion: `Plan de cortesía asignado por administrador - ${duracionMeses} ${duracionMeses === 1 ? 'mes' : 'meses'}`,
          duracionMeses,
          precioNormal: "0.00",
          precioDescuento: "0.00",
          beneficios: ["Acceso completo", "Calculadora Científica", "Sin restricciones"],
          productosIncluidos: 100,
          destacado: false,
          activo: true
        });
      }
      
      // Calcular fechas
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + duracionMeses);
      
      // Crear membresía de cortesía
      const membresia = await storage.createMembresiaUsuario({
        usuarioId,
        planId: plan.id,
        fechaInicio,
        fechaFin,
        estado: 'activa',
        montoTotal: "0.00",
        metodoPago: 'cortesia',
        esCortesia: true,
        asignadoPor: adminId,
        motivoCortesia: motivo || 'Asignado por administrador'
      });
      
      res.json(membresia);
    } catch (error: any) {
      console.error("Error al asignar membresía de cortesía:", error);
      res.status(400).json({ message: error.message || "Error al asignar membresía de cortesía" });
    }
  });

  // ============================================================
  // CATEGORÍAS DE PRODUCTOS DE USUARIO
  // ============================================================

  // Obtener categorías
  app.get('/api/categorias-productos-usuario', async (req, res) => {
    try {
      const incluyeInactivas = req.query.todas === 'true';
      const categorias = await storage.getCategoriasProductosUsuario(incluyeInactivas);
      res.json(categorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error al obtener categorías" });
    }
  });

  // Obtener subcategorías
  app.get('/api/categorias-productos-usuario/:id/subcategorias', async (req, res) => {
    try {
      const subcategorias = await storage.getSubcategorias(req.params.id);
      res.json(subcategorias);
    } catch (error) {
      console.error("Error al obtener subcategorías:", error);
      res.status(500).json({ message: "Error al obtener subcategorías" });
    }
  });

  // Crear categoría (solo super admin)
  app.post('/api/categorias-productos-usuario', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.createCategoriaProductoUsuario(req.body);
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      res.status(400).json({ message: error.message || "Error al crear categoría" });
    }
  });

  // Actualizar categoría (solo super admin)
  app.patch('/api/categorias-productos-usuario/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const categoria = await storage.updateCategoriaProductoUsuario(req.params.id, req.body);
      if (!categoria) {
        return res.status(404).json({ message: "Categoría no encontrada" });
      }
      res.json(categoria);
    } catch (error: any) {
      console.error("Error al actualizar categoría:", error);
      res.status(400).json({ message: error.message || "Error al actualizar categoría" });
    }
  });

  // Eliminar categoría (solo super admin - soft delete)
  app.delete('/api/categorias-productos-usuario/:id', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteCategoriaProductoUsuario(req.params.id);
      res.json({ message: "Categoría desactivada" });
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ message: "Error al eliminar categoría" });
    }
  });

  // ============================================================
  // PRODUCTOS DE USUARIO (Marketplace personal)
  // ============================================================

  // Obtener productos (con filtros opcionales)
  app.get('/api/productos-usuario', async (req: any, res) => {
    try {
      const filtros: { usuarioId?: string; categoriaId?: string; estado?: string } = {};
      
      if (req.query.usuarioId) filtros.usuarioId = req.query.usuarioId;
      if (req.query.categoriaId) filtros.categoriaId = req.query.categoriaId;
      if (req.query.estado) filtros.estado = req.query.estado;
      
      const productos = await storage.getProductosUsuario(filtros);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  // Obtener productos del usuario autenticado
  app.get('/api/mis-productos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productos = await storage.getProductosUsuario({ usuarioId: userId });
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos del usuario:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });

  // Obtener un producto específico
  app.get('/api/productos-usuario/:id', async (req, res) => {
    try {
      const producto = await storage.getProductoUsuario(req.params.id);
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(producto);
    } catch (error) {
      console.error("Error al obtener producto:", error);
      res.status(500).json({ message: "Error al obtener producto" });
    }
  });

  // Crear producto (requiere membresía o saldo) - Usa lógica centralizada de cupos
  app.post('/api/productos-usuario', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Usar lógica centralizada para calcular costo según membresía y cupos
      const infoCosto = await storage.calcularCostoCreacionProducto(userId);
      
      if (!infoCosto.puedeCrear) {
        return res.status(402).json({ 
          message: infoCosto.mensaje,
          saldoActual: infoCosto.saldoActual.toFixed(2),
          costoRequerido: infoCosto.costo.toFixed(2),
          productosUsados: infoCosto.productosUsados,
          productosIncluidos: infoCosto.productosIncluidos,
          planNombre: infoCosto.planNombre,
          tipoError: infoCosto.tipoError || 'saldo_insuficiente'
        });
      }
      
      // Solo descontar saldo si el cobro es por saldo (no membresía)
      if (infoCosto.tipoCobro === 'saldo' && infoCosto.costo > 0) {
        await storage.actualizarSaldo(userId, infoCosto.costo, 'egreso');
        
        // Registrar transacción
        await storage.createTransaccionSaldo({
          usuarioId: userId,
          tipo: 'egreso',
          monto: infoCosto.costo.toFixed(2),
          concepto: `Publicación de producto: ${req.body.nombre}`,
          saldoAnterior: infoCosto.saldoActual.toFixed(2),
          saldoNuevo: (infoCosto.saldoActual - infoCosto.costo).toFixed(2),
          estado: 'completado'
        });
      }
      
      // Generar código único
      const codigo = `PRD-${Date.now().toString(36).toUpperCase()}`;
      
      const producto = await storage.createProductoUsuario({
        ...req.body,
        usuarioId: userId,
        codigo,
        estado: 'activo'
      });
      
      res.json({
        ...producto,
        infoCosto: {
          tipoCobro: infoCosto.tipoCobro,
          costo: infoCosto.costo,
          mensaje: infoCosto.mensaje,
          productosUsados: infoCosto.productosUsados + 1,
          productosIncluidos: infoCosto.productosIncluidos
        }
      });
    } catch (error: any) {
      console.error("Error al crear producto:", error);
      res.status(400).json({ message: error.message || "Error al crear producto" });
    }
  });

  // Actualizar producto
  app.patch('/api/productos-usuario/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const producto = await storage.getProductoUsuario(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      // Verificar propiedad o admin
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      if (producto.usuarioId !== userId && !esSuperAdmin) {
        return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
      }
      
      const actualizado = await storage.updateProductoUsuario(req.params.id, req.body);
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar producto:", error);
      res.status(400).json({ message: error.message || "Error al actualizar producto" });
    }
  });

  // Eliminar producto (soft delete)
  app.delete('/api/productos-usuario/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const producto = await storage.getProductoUsuario(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      
      // Verificar propiedad o admin
      const userRoles = await storage.getUserRoles(userId);
      const esSuperAdmin = userRoles.includes('super_admin');
      
      if (producto.usuarioId !== userId && !esSuperAdmin) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
      }
      
      await storage.deleteProductoUsuario(req.params.id);
      res.json({ message: "Producto eliminado" });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(500).json({ message: "Error al eliminar producto" });
    }
  });

  // ============================================================
  // CONFIGURACIÓN DE COSTOS (para super admin)
  // ============================================================

  // Obtener todas las configuraciones de costos
  app.get('/api/configuracion-costos', isAuthenticated, async (req, res) => {
    try {
      const config = await storage.getConfiguracionesCostos();
      res.json(config);
    } catch (error) {
      console.error("Error al obtener configuración de costos:", error);
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  // Actualizar o crear configuración de costo (solo super admin)
  app.post('/api/configuracion-costos', isAuthenticated, requireSuperAdmin, async (req, res) => {
    try {
      const config = await storage.upsertConfiguracionCosto(req.body);
      res.json(config);
    } catch (error: any) {
      console.error("Error al actualizar configuración de costos:", error);
      res.status(400).json({ message: error.message || "Error al actualizar configuración" });
    }
  });

  // ============================================================
  // CATÁLOGOS DE LOCALES COMERCIALES (Sistema nuevo)
  // ============================================================

  // Obtener todos los catálogos activos (público)
  app.get('/api/catalogos-locales', async (req, res) => {
    try {
      const catalogos = await storage.getCatalogosLocales(true);
      res.json(catalogos);
    } catch (error: any) {
      console.error("Error al obtener catálogos locales:", error);
      res.status(500).json({ message: error.message || "Error al obtener catálogos" });
    }
  });

  // Obtener detalle de un catálogo con categorías e items (público)
  app.get('/api/catalogos-locales/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const catalogo = await storage.getCatalogoLocal(id);
      
      if (!catalogo) {
        return res.status(404).json({ message: "Catálogo no encontrado" });
      }
      
      const categorias = await storage.getCategoriasCatalogo(id);
      const items = await storage.getItemsCatalogo(id);
      
      res.json({
        ...catalogo,
        categorias,
        items,
      });
    } catch (error: any) {
      console.error("Error al obtener catálogo:", error);
      res.status(500).json({ message: error.message || "Error al obtener catálogo" });
    }
  });

  // Obtener mi catálogo (autenticado)
  app.get('/api/mi-catalogo-local', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.json(null);
      }
      
      const categorias = await storage.getCategoriasCatalogo(catalogo.id);
      const items = await storage.getItemsCatalogo(catalogo.id);
      
      res.json({
        ...catalogo,
        categorias,
        items,
      });
    } catch (error: any) {
      console.error("Error al obtener mi catálogo local:", error);
      res.status(500).json({ message: error.message || "Error al obtener catálogo" });
    }
  });

  // Crear catálogo (autenticado)
  app.post('/api/mi-catalogo-local', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Verificar si ya tiene catálogo
      const existente = await storage.getCatalogoLocalPorUsuario(usuarioId);
      if (existente) {
        return res.status(400).json({ message: "Ya tienes un catálogo creado. Usa PUT para actualizarlo." });
      }
      
      const catalogo = await storage.createCatalogoLocal({
        ...req.body,
        usuarioId,
      });
      
      res.status(201).json(catalogo);
    } catch (error: any) {
      console.error("Error al crear catálogo local:", error);
      res.status(500).json({ message: error.message || "Error al crear catálogo" });
    }
  });

  // Actualizar catálogo (autenticado - propietario)
  app.put('/api/mi-catalogo-local', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(404).json({ message: "No tienes un catálogo. Crea uno primero." });
      }
      
      const actualizado = await storage.updateCatalogoLocal(catalogo.id, req.body);
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar catálogo local:", error);
      res.status(500).json({ message: error.message || "Error al actualizar catálogo" });
    }
  });

  // Eliminar catálogo (autenticado - propietario)
  app.delete('/api/mi-catalogo-local', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(404).json({ message: "No tienes un catálogo para eliminar" });
      }
      
      await storage.deleteCatalogoLocal(catalogo.id);
      res.json({ message: "Catálogo eliminado correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar catálogo local:", error);
      res.status(500).json({ message: error.message || "Error al eliminar catálogo" });
    }
  });

  // ============================================================
  // CATEGORÍAS DEL CATÁLOGO
  // ============================================================

  // Crear categoría
  app.post('/api/mi-catalogo-local/categorias', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(400).json({ message: "Debes crear un catálogo primero" });
      }

      // Validar código único si se proporciona
      if (req.body.codigo) {
        const categoriasExistentes = await storage.getCategoriasCatalogo(catalogo.id);
        const codigoExiste = categoriasExistentes.some(c => c.codigo === req.body.codigo);
        if (codigoExiste) {
          return res.status(400).json({ message: `El código "${req.body.codigo}" ya existe. Por favor usa un código diferente.` });
        }
      }
      
      const categoria = await storage.createCategoriaCatalogo({
        ...req.body,
        catalogoId: catalogo.id,
      });
      
      res.status(201).json(categoria);
    } catch (error: any) {
      console.error("Error al crear categoría:", error);
      res.status(500).json({ message: error.message || "Error al crear categoría" });
    }
  });

  // Actualizar categoría
  app.put('/api/mi-catalogo-local/categorias/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(400).json({ message: "No tienes un catálogo" });
      }
      
      const categoria = await storage.getCategoriaCatalogo(req.params.id);
      if (!categoria || categoria.catalogoId !== catalogo.id) {
        return res.status(403).json({ message: "No tienes permiso para modificar esta categoría" });
      }

      // Validar código único si se proporciona (excluyendo la categoría actual)
      if (req.body.codigo && req.body.codigo !== categoria.codigo) {
        const categoriasExistentes = await storage.getCategoriasCatalogo(catalogo.id);
        const codigoExiste = categoriasExistentes.some((c: any) => c.codigo === req.body.codigo && c.id !== req.params.id);
        if (codigoExiste) {
          return res.status(400).json({ message: `El código "${req.body.codigo}" ya existe. Por favor usa un código diferente.` });
        }
      }
      
      const actualizada = await storage.updateCategoriaCatalogo(req.params.id, req.body);
      res.json(actualizada);
    } catch (error: any) {
      console.error("Error al actualizar categoría:", error);
      res.status(500).json({ message: error.message || "Error al actualizar categoría" });
    }
  });

  // Eliminar categoría
  app.delete('/api/mi-catalogo-local/categorias/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(400).json({ message: "No tienes un catálogo" });
      }
      
      const categoria = await storage.getCategoriaCatalogo(req.params.id);
      if (!categoria || categoria.catalogoId !== catalogo.id) {
        return res.status(403).json({ message: "No tienes permiso para eliminar esta categoría" });
      }
      
      await storage.deleteCategoriaCatalogo(req.params.id);
      res.json({ message: "Categoría eliminada correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar categoría:", error);
      res.status(500).json({ message: error.message || "Error al eliminar categoría" });
    }
  });

  // ============================================================
  // ITEMS DEL CATÁLOGO (Productos)
  // ============================================================

  // Helper para limpiar datos numéricos (convertir strings vacíos a null)
  const limpiarPrecio = (valor: any): string | null => {
    if (valor === null || valor === undefined || valor === "") return null;
    const num = parseFloat(valor);
    return isNaN(num) ? null : num.toFixed(2);
  };

  // Consultar cupos y costo para crear productos
  app.get('/api/mi-catalogo-local/cupos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const infoCosto = await storage.calcularCostoCreacionProducto(usuarioId);
      
      res.json({
        tipoCobro: infoCosto.tipoCobro,
        costo: infoCosto.costo,
        saldoActual: infoCosto.saldoActual,
        productosUsados: infoCosto.productosUsados,
        productosIncluidos: infoCosto.productosIncluidos,
        planNombre: infoCosto.planNombre,
        puedeCrear: infoCosto.puedeCrear,
        mensaje: infoCosto.mensaje
      });
    } catch (error: any) {
      console.error("Error al consultar cupos:", error);
      res.status(500).json({ message: error.message || "Error al consultar cupos" });
    }
  });

  // Crear item
  app.post('/api/mi-catalogo-local/items', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(400).json({ message: "Debes crear un catálogo primero" });
      }

      // Calcular costo según membresía y cupos disponibles
      const infoCosto = await storage.calcularCostoCreacionProducto(usuarioId);
      
      if (!infoCosto.puedeCrear) {
        return res.status(402).json({ 
          message: infoCosto.mensaje,
          saldoActual: infoCosto.saldoActual.toFixed(2),
          costoRequerido: infoCosto.costo.toFixed(2),
          productosUsados: infoCosto.productosUsados,
          productosIncluidos: infoCosto.productosIncluidos,
          planNombre: infoCosto.planNombre,
          tipoError: infoCosto.tipoError || 'saldo_insuficiente'
        });
      }

      // Validar código único si se proporciona
      if (req.body.codigo) {
        const itemsExistentes = await storage.getItemsCatalogo(catalogo.id);
        const codigoExiste = itemsExistentes.some((i: any) => i.codigo === req.body.codigo);
        if (codigoExiste) {
          return res.status(400).json({ message: `El código "${req.body.codigo}" ya existe. Por favor usa un código diferente.` });
        }
      }

      // Limpiar precios vacíos
      const datosLimpios = {
        ...req.body,
        catalogoId: catalogo.id,
        precio: limpiarPrecio(req.body.precio),
        precio1: limpiarPrecio(req.body.precio1),
        precio2: limpiarPrecio(req.body.precio2),
        precio3: limpiarPrecio(req.body.precio3),
        precio4: limpiarPrecio(req.body.precio4),
        precioOferta: limpiarPrecio(req.body.precioOferta),
      };
      
      const item = await storage.createItemCatalogoLocal(datosLimpios);

      // Solo descontar saldo si el cobro es por saldo (no membresía)
      if (infoCosto.tipoCobro === 'saldo' && infoCosto.costo > 0) {
        await storage.actualizarSaldo(usuarioId, infoCosto.costo, 'egreso');

        // Registrar la transacción
        await storage.createTransaccionSaldo({
          usuarioId,
          tipo: 'egreso',
          concepto: `Creación de producto: ${datosLimpios.nombre || 'Sin nombre'}`,
          monto: infoCosto.costo.toFixed(2),
          saldoAnterior: infoCosto.saldoActual.toFixed(2),
          saldoNuevo: (infoCosto.saldoActual - infoCosto.costo).toFixed(2),
          referenciaId: item.id,
          referenciaTipo: 'producto_catalogo',
          estado: 'completado',
        });
      }
      
      res.status(201).json({
        ...item,
        infoCosto: {
          tipoCobro: infoCosto.tipoCobro,
          costo: infoCosto.costo,
          mensaje: infoCosto.mensaje,
          productosUsados: infoCosto.productosUsados + 1,
          productosIncluidos: infoCosto.productosIncluidos
        }
      });
    } catch (error: any) {
      console.error("Error al crear item:", error);
      res.status(500).json({ message: error.message || "Error al crear item" });
    }
  });

  // Actualizar item
  app.put('/api/mi-catalogo-local/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(400).json({ message: "No tienes un catálogo" });
      }
      
      const item = await storage.getItemCatalogoLocal(req.params.id);
      if (!item || item.catalogoId !== catalogo.id) {
        return res.status(403).json({ message: "No tienes permiso para modificar este producto" });
      }

      // Validar código único si se proporciona (excluyendo el item actual)
      if (req.body.codigo && req.body.codigo !== item.codigo) {
        const itemsExistentes = await storage.getItemsCatalogo(catalogo.id);
        const codigoExiste = itemsExistentes.some((i: any) => i.codigo === req.body.codigo && i.id !== req.params.id);
        if (codigoExiste) {
          return res.status(400).json({ message: `El código "${req.body.codigo}" ya existe. Por favor usa un código diferente.` });
        }
      }

      // Limpiar precios vacíos
      const datosLimpios = {
        ...req.body,
        precio: limpiarPrecio(req.body.precio),
        precio1: limpiarPrecio(req.body.precio1),
        precio2: limpiarPrecio(req.body.precio2),
        precio3: limpiarPrecio(req.body.precio3),
        precio4: limpiarPrecio(req.body.precio4),
        precioOferta: limpiarPrecio(req.body.precioOferta),
      };
      
      const actualizado = await storage.updateItemCatalogoLocal(req.params.id, datosLimpios);
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar item:", error);
      res.status(500).json({ message: error.message || "Error al actualizar item" });
    }
  });

  // Eliminar item
  app.delete('/api/mi-catalogo-local/items/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const catalogo = await storage.getCatalogoLocalPorUsuario(usuarioId);
      
      if (!catalogo) {
        return res.status(400).json({ message: "No tienes un catálogo" });
      }
      
      const item = await storage.getItemCatalogoLocal(req.params.id);
      if (!item || item.catalogoId !== catalogo.id) {
        return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
      }
      
      await storage.deleteItemCatalogoLocal(req.params.id);
      res.json({ message: "Producto eliminado correctamente" });
    } catch (error: any) {
      console.error("Error al eliminar item:", error);
      res.status(500).json({ message: error.message || "Error al eliminar item" });
    }
  });

  // ============================================================
  // INTERACCIONES DE PRODUCTOS (likes, favoritos, compartir)
  // ============================================================

  // Toggle interacción (like, favorito, compartido)
  app.post('/api/items-catalogo/:id/interaccion', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { tipo } = req.body;
      
      if (!['like', 'favorito', 'compartido'].includes(tipo)) {
        return res.status(400).json({ message: "Tipo de interacción inválido" });
      }
      
      const resultado = await storage.toggleInteraccionProducto(usuarioId, id, tipo);
      res.json(resultado);
    } catch (error: any) {
      console.error("Error al registrar interacción:", error);
      res.status(500).json({ message: error.message || "Error al registrar interacción" });
    }
  });

  // Obtener interacciones del usuario en un producto
  app.get('/api/items-catalogo/:id/interacciones', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const interacciones = await storage.getInteraccionesUsuarioProducto(usuarioId, id);
      res.json(interacciones);
    } catch (error: any) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: error.message || "Error al obtener interacciones" });
    }
  });

  // Mis productos favoritos
  app.get('/api/mis-favoritos-productos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const favoritos = await storage.getFavoritosProductosUsuario(usuarioId);
      res.json(favoritos);
    } catch (error: any) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ message: error.message || "Error al obtener favoritos" });
    }
  });

  // Mapa de mis interacciones en productos (likes y favoritos)
  app.get('/api/mis-interacciones-productos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const interacciones = await storage.getMisInteraccionesProductos(usuarioId);
      res.json(interacciones);
    } catch (error: any) {
      console.error("Error al obtener interacciones:", error);
      res.status(500).json({ message: error.message || "Error al obtener interacciones" });
    }
  });

  // Items destacados para carrusel (público)
  app.get('/api/items-destacados', async (req, res) => {
    try {
      const limite = parseInt(req.query.limite as string) || 10;
      const items = await storage.getItemsDestacados(limite);
      res.json(items);
    } catch (error: any) {
      console.error("Error al obtener items destacados:", error);
      res.status(500).json({ message: error.message || "Error al obtener items destacados" });
    }
  });

  // Incrementar vistas de un item (público)
  app.post('/api/items-catalogo/:id/vista', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.incrementarVistasItem(id);
      res.json({ message: "Vista registrada" });
    } catch (error: any) {
      console.error("Error al registrar vista:", error);
      res.status(500).json({ message: error.message || "Error al registrar vista" });
    }
  });

  // Items recientes para parrilla (público)
  app.get('/api/items-recientes', async (req, res) => {
    try {
      const limite = parseInt(req.query.limite as string) || 12;
      const items = await storage.getItemsRecientes(limite);
      res.json(items);
    } catch (error: any) {
      console.error("Error al obtener items recientes:", error);
      res.status(500).json({ message: error.message || "Error al obtener items recientes" });
    }
  });

  // Catálogos con items para vista pública (público)
  app.get('/api/catalogos-con-items', async (req, res) => {
    try {
      const catalogos = await storage.getCatalogosLocalesConItems();
      res.json(catalogos);
    } catch (error: any) {
      console.error("Error al obtener catálogos con items:", error);
      res.status(500).json({ message: error.message || "Error al obtener catálogos" });
    }
  });

  // ============================================================
  // REPORTES Y BACKUP DE CARTERA
  // ============================================================

  // Obtener reporte de cartera con filtros
  app.get('/api/reportes/cartera', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { periodo, desde, hasta, usuarioId } = req.query;
      
      const filtro: any = {
        periodo: periodo,
        desde: desde ? new Date(desde as string) : undefined,
        hasta: hasta ? new Date(hasta as string) : undefined,
        usuarioId: usuarioId,
      };
      
      const reporte = await obtenerReporteCartera(filtro);
      res.json(reporte);
    } catch (error: any) {
      console.error("Error al obtener reporte de cartera:", error);
      res.status(500).json({ message: error.message || "Error al generar reporte" });
    }
  });

  // Generar y descargar PDF de reporte
  app.get('/api/reportes/cartera/pdf', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { periodo, desde, hasta, usuarioId } = req.query;
      
      const filtro: any = {
        periodo: periodo,
        desde: desde ? new Date(desde as string) : undefined,
        hasta: hasta ? new Date(hasta as string) : undefined,
        usuarioId: usuarioId,
      };
      
      const pdfBuffer = await generarPDFReporte(filtro);
      
      const nombreArchivo = `reporte_cartera_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error al generar PDF de reporte:", error);
      res.status(500).json({ message: error.message || "Error al generar PDF" });
    }
  });

  // ============================================================
  // BACKUPS - DOS TIPOS: CARTERA (PDF) Y SISTEMA (JSON)
  // ============================================================

  // Generar backup de cartera (PDF)
  app.post('/api/reportes/backup/cartera', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const rutaArchivo = await generarBackupCartera();
      const info = extraerInfoUsuario(req);
      await registrarActividad({
        ...info,
        tipoAccion: 'crear',
        entidad: 'backup_cartera',
        descripcion: 'Backup de cartera generado manualmente',
        modulo: 'reportes',
      });
      res.json({ message: "Backup de cartera generado exitosamente", archivo: rutaArchivo });
    } catch (error: any) {
      console.error("Error al generar backup de cartera:", error);
      res.status(500).json({ message: error.message || "Error al generar backup de cartera" });
    }
  });

  // Generar backup del sistema (JSON)
  app.post('/api/reportes/backup/sistema', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const rutaArchivo = await generarBackupSistema();
      const info = extraerInfoUsuario(req);
      await registrarActividad({
        ...info,
        tipoAccion: 'crear',
        entidad: 'backup_sistema',
        descripcion: 'Backup completo del sistema generado manualmente',
        modulo: 'reportes',
      });
      res.json({ message: "Backup del sistema generado exitosamente", archivo: rutaArchivo });
    } catch (error: any) {
      console.error("Error al generar backup del sistema:", error);
      res.status(500).json({ message: error.message || "Error al generar backup del sistema" });
    }
  });

  // Generar ambos backups (cartera + sistema)
  app.post('/api/reportes/backup/ambos', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const resultado = await generarAmbosBackups();
      const info = extraerInfoUsuario(req);
      await registrarActividad({
        ...info,
        tipoAccion: 'crear',
        entidad: 'backup_completo',
        descripcion: 'Backup completo (cartera + sistema) generado manualmente',
        modulo: 'reportes',
      });
      res.json({ 
        message: "Backups generados exitosamente", 
        cartera: resultado.cartera,
        sistema: resultado.sistema,
      });
    } catch (error: any) {
      console.error("Error al generar backups:", error);
      res.status(500).json({ message: error.message || "Error al generar backups" });
    }
  });

  // Listar todos los backups disponibles
  app.get('/api/reportes/backups', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { tipo } = req.query;
      let backups;
      if (tipo === 'cartera') {
        backups = listarBackupsCartera();
      } else if (tipo === 'sistema') {
        backups = listarBackupsSistema();
      } else {
        backups = listarTodosBackups();
      }
      res.json(backups);
    } catch (error: any) {
      console.error("Error al listar backups:", error);
      res.status(500).json({ message: error.message || "Error al listar backups" });
    }
  });

  // Descargar backup específico
  app.get('/api/reportes/backups/:nombreArchivo', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { nombreArchivo } = req.params;
      const rutaArchivo = obtenerRutaBackup(nombreArchivo);
      
      if (!rutaArchivo) {
        return res.status(404).json({ message: "Backup no encontrado" });
      }
      
      res.download(rutaArchivo);
    } catch (error: any) {
      console.error("Error al descargar backup:", error);
      res.status(500).json({ message: error.message || "Error al descargar backup" });
    }
  });

  // ============================================================
  // AUDITORÍA - REGISTRO DE ACTIVIDADES DEL SISTEMA
  // ============================================================

  // Obtener registros de auditoría
  app.get('/api/auditoria', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { desde, hasta, usuarioId, tipoAccion, entidad, modulo, limite } = req.query;
      
      const filtro = {
        desde: desde ? new Date(desde as string) : undefined,
        hasta: hasta ? new Date(hasta as string) : undefined,
        usuarioId: usuarioId as string | undefined,
        tipoAccion: tipoAccion as string | undefined,
        entidad: entidad as string | undefined,
        modulo: modulo as string | undefined,
        limite: limite ? parseInt(limite as string) : 500,
      };
      
      const registros = await obtenerRegistrosAuditoria(filtro);
      res.json(registros);
    } catch (error: any) {
      console.error("Error al obtener registros de auditoría:", error);
      res.status(500).json({ message: error.message || "Error al obtener auditoría" });
    }
  });

  // Obtener estadísticas de auditoría
  app.get('/api/auditoria/estadisticas', isAuthenticated, requireSuperAdmin, async (req: any, res) => {
    try {
      const { desde, hasta } = req.query;
      
      const estadisticas = await obtenerEstadisticasAuditoria(
        desde ? new Date(desde as string) : undefined,
        hasta ? new Date(hasta as string) : undefined,
      );
      
      res.json(estadisticas);
    } catch (error: any) {
      console.error("Error al obtener estadísticas de auditoría:", error);
      res.status(500).json({ message: error.message || "Error al obtener estadísticas" });
    }
  });

  // ============================================================
  // CRON JOB - BACKUP AUTOMÁTICO A LAS 00:55 AM
  // ============================================================

  cron.schedule('55 0 * * *', async () => {
    console.log('[Cron] Iniciando backup automático (cartera + sistema)...');
    try {
      const resultado = await generarAmbosBackups();
      await registrarActividad({
        tipoAccion: 'crear',
        entidad: 'backup_automatico',
        descripcion: 'Backup automático diario generado por cron job',
        datosNuevos: resultado,
        modulo: 'sistema',
      });
      console.log('[Cron] Backups completados:', resultado);
    } catch (error) {
      console.error('[Cron] Error en backup automático:', error);
    }
  });

  console.log('[Cron] Backup automático programado para las 00:55 AM (hora de Lima)');

  // ============================================================
  // CARTA DIGITAL - Acceso público sin autenticación
  // ============================================================

  // Obtener carta digital completa de un local (público)
  app.get('/api/carta-digital/:catalogoId', async (req, res) => {
    try {
      const { catalogoId } = req.params;
      const carta = await storage.getCartaDigital(catalogoId);
      if (!carta) {
        return res.status(404).json({ message: "Catálogo no encontrado" });
      }
      
      // Obtener datos del local comercial
      const catalogo = carta.catalogo;
      let localComercial = null;
      if (catalogo.usuarioId) {
        localComercial = await storage.getUser(catalogo.usuarioId);
      }
      
      res.json({
        ...carta,
        localComercial: localComercial ? {
          id: localComercial.id,
          nombre: localComercial.nombre || localComercial.nombreCompleto,
          direccion: localComercial.direccion,
          telefono: localComercial.telefono,
          email: localComercial.email,
          foto: localComercial.foto || localComercial.fotoUrl,
        } : null,
      });
    } catch (error: any) {
      console.error("Error al obtener carta digital:", error);
      res.status(500).json({ message: error.message || "Error al obtener carta" });
    }
  });

  // Obtener formas de pago de un catálogo/negocio (público)
  app.get('/api/carta-digital/:catalogoId/formas-pago', async (req, res) => {
    try {
      const { catalogoId } = req.params;
      
      // Obtener el catálogo para saber el usuarioId del negocio
      const catalogo = await storage.getCatalogoLocal(catalogoId);
      if (!catalogo) {
        return res.status(404).json({ message: "Catálogo no encontrado" });
      }
      
      // Obtener formas de pago del negocio
      const formasPago = await storage.getFormasPagoNegocio(catalogo.usuarioId);
      
      // Filtrar solo las activas
      const formasActivas = formasPago.filter(f => f.activo !== false);
      
      res.json(formasActivas);
    } catch (error: any) {
      console.error("Error al obtener formas de pago:", error);
      res.status(500).json({ message: error.message || "Error al obtener formas de pago" });
    }
  });

  // Convertir precio entre monedas (público)
  app.get('/api/conversion-moneda', async (req, res) => {
    try {
      const { monto, origen, destino } = req.query;
      if (!monto || !origen || !destino) {
        return res.status(400).json({ message: "Parámetros requeridos: monto, origen, destino" });
      }
      
      const resultado = await storage.convertirPrecio(
        parseFloat(monto as string),
        origen as string,
        destino as string
      );
      
      res.json(resultado);
    } catch (error: any) {
      console.error("Error en conversión de moneda:", error);
      res.status(500).json({ message: error.message || "Error en conversión" });
    }
  });

  // ============================================================
  // CARRITO DE COMPRAS - Requiere autenticación
  // ============================================================

  // Obtener carrito del usuario
  app.get('/api/carrito', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { catalogoId } = req.query;
      
      let items = await storage.getCarritoUsuario(usuarioId);
      
      // Filtrar por catálogo si se especifica
      if (catalogoId) {
        items = items.filter(item => item.catalogoId === catalogoId);
      }
      
      // Enriquecer con datos del producto
      const itemsEnriquecidos = await Promise.all(items.map(async (item) => {
        let producto = null;
        if (item.tipoProducto === 'item_catalogo' && item.itemCatalogoId) {
          producto = await storage.getItemCatalogo(item.itemCatalogoId);
        } else if (item.tipoProducto === 'producto_usuario' && item.productoUsuarioId) {
          producto = await storage.getProductoUsuario(item.productoUsuarioId);
        }
        return { ...item, producto };
      }));
      
      const { total, items: totalItems } = await storage.getTotalCarrito(usuarioId, catalogoId as string | undefined);
      
      res.json({ items: itemsEnriquecidos, total, totalItems });
    } catch (error: any) {
      console.error("Error al obtener carrito:", error);
      res.status(500).json({ message: error.message || "Error al obtener carrito" });
    }
  });

  // Agregar item al carrito
  app.post('/api/carrito', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { 
        itemCatalogoId, 
        productoUsuarioId, 
        tipoProducto, 
        cantidad, 
        precioSeleccionado, 
        etiquetaPrecio, 
        precioUnitario, 
        catalogoId,
        notas 
      } = req.body;
      
      if (!tipoProducto || !precioUnitario) {
        return res.status(400).json({ message: "Datos incompletos" });
      }
      
      const item = await storage.addItemCarrito({
        usuarioId,
        itemCatalogoId: itemCatalogoId || null,
        productoUsuarioId: productoUsuarioId || null,
        tipoProducto,
        cantidad: cantidad || 1,
        precioSeleccionado: precioSeleccionado || 1,
        etiquetaPrecio: etiquetaPrecio || null,
        precioUnitario: precioUnitario.toString(),
        monedaOriginal: 'PEN',
        catalogoId: catalogoId || null,
        notas: notas || null,
      });
      
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error al agregar al carrito:", error);
      res.status(500).json({ message: error.message || "Error al agregar al carrito" });
    }
  });

  // Actualizar cantidad de item en carrito
  app.patch('/api/carrito/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { cantidad, notas } = req.body;
      
      const item = await storage.getItemCarrito(id);
      if (!item || item.usuarioId !== usuarioId) {
        return res.status(404).json({ message: "Item no encontrado" });
      }
      
      if (cantidad <= 0) {
        await storage.deleteItemCarrito(id);
        return res.json({ message: "Item eliminado" });
      }
      
      const actualizado = await storage.updateItemCarrito(id, { cantidad, notas });
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar carrito:", error);
      res.status(500).json({ message: error.message || "Error al actualizar carrito" });
    }
  });

  // Eliminar item del carrito
  app.delete('/api/carrito/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const item = await storage.getItemCarrito(id);
      if (!item || item.usuarioId !== usuarioId) {
        return res.status(404).json({ message: "Item no encontrado" });
      }
      
      await storage.deleteItemCarrito(id);
      res.json({ message: "Item eliminado" });
    } catch (error: any) {
      console.error("Error al eliminar del carrito:", error);
      res.status(500).json({ message: error.message || "Error al eliminar del carrito" });
    }
  });

  // Limpiar carrito completo
  app.delete('/api/carrito', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { catalogoId } = req.query;
      
      await storage.limpiarCarritoUsuario(usuarioId, catalogoId as string | undefined);
      res.json({ message: "Carrito limpiado" });
    } catch (error: any) {
      console.error("Error al limpiar carrito:", error);
      res.status(500).json({ message: error.message || "Error al limpiar carrito" });
    }
  });

  // ============================================================
  // FORMAS DE PAGO DEL NEGOCIO
  // ============================================================

  // Obtener formas de pago del negocio (público - para checkout)
  app.get('/api/formas-pago-negocio/:negocioId', async (req, res) => {
    try {
      const { negocioId } = req.params;
      const formas = await storage.getFormasPagoNegocio(negocioId);
      res.json(formas);
    } catch (error: any) {
      console.error("Error al obtener formas de pago:", error);
      res.status(500).json({ message: error.message || "Error al obtener formas de pago" });
    }
  });

  // Obtener formas de pago por catálogo (público - para checkout)
  app.get('/api/formas-pago-catalogo/:catalogoId', async (req, res) => {
    try {
      const { catalogoId } = req.params;
      const formas = await storage.getFormasPagoPorCatalogo(catalogoId);
      res.json(formas);
    } catch (error: any) {
      console.error("Error al obtener formas de pago:", error);
      res.status(500).json({ message: error.message || "Error al obtener formas de pago" });
    }
  });

  // Obtener mis formas de pago configuradas (para dueño del negocio)
  app.get('/api/mis-formas-pago', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const formas = await storage.getFormasPagoNegocio(usuarioId);
      res.json(formas);
    } catch (error: any) {
      console.error("Error al obtener mis formas de pago:", error);
      res.status(500).json({ message: error.message || "Error al obtener formas de pago" });
    }
  });

  // Crear forma de pago
  app.post('/api/mis-formas-pago', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const data = { ...req.body, negocioId: usuarioId };
      const nueva = await storage.createFormaPagoNegocio(data);
      res.status(201).json(nueva);
    } catch (error: any) {
      console.error("Error al crear forma de pago:", error);
      res.status(500).json({ message: error.message || "Error al crear forma de pago" });
    }
  });

  // Actualizar forma de pago
  app.patch('/api/mis-formas-pago/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const forma = await storage.getFormaPagoNegocio(id);
      if (!forma || forma.negocioId !== usuarioId) {
        return res.status(404).json({ message: "Forma de pago no encontrada" });
      }
      
      const updated = await storage.updateFormaPagoNegocio(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error("Error al actualizar forma de pago:", error);
      res.status(500).json({ message: error.message || "Error al actualizar forma de pago" });
    }
  });

  // Eliminar forma de pago (soft delete)
  app.delete('/api/mis-formas-pago/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const forma = await storage.getFormaPagoNegocio(id);
      if (!forma || forma.negocioId !== usuarioId) {
        return res.status(404).json({ message: "Forma de pago no encontrada" });
      }
      
      await storage.deleteFormaPagoNegocio(id);
      res.json({ message: "Forma de pago eliminada" });
    } catch (error: any) {
      console.error("Error al eliminar forma de pago:", error);
      res.status(500).json({ message: error.message || "Error al eliminar forma de pago" });
    }
  });

  // ============================================================
  // TICKETS DE FACTURACIÓN
  // ============================================================
  
  // Obtener tickets de facturación del negocio
  app.get('/api/tickets-facturacion', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { filtro } = req.query;
      
      const tickets = await storage.getTicketsFacturacionNegocio(usuarioId, filtro as string || 'hoy');
      res.json(tickets);
    } catch (error: any) {
      console.error("Error al obtener tickets de facturación:", error);
      res.status(500).json({ message: error.message || "Error al obtener tickets" });
    }
  });

  // Crear nuevo ticket de facturación
  app.post('/api/tickets-facturacion', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const ticketData = {
        ...req.body,
        negocioId: usuarioId,
      };
      
      const ticket = await storage.createTicketFacturacion(ticketData);
      res.status(201).json(ticket);
    } catch (error: any) {
      console.error("Error al crear ticket de facturación:", error);
      res.status(500).json({ message: error.message || "Error al crear ticket" });
    }
  });

  // Obtener un ticket específico
  app.get('/api/tickets-facturacion/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const ticket = await storage.getTicketFacturacion(id);
      if (!ticket || ticket.negocioId !== usuarioId) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      console.error("Error al obtener ticket:", error);
      res.status(500).json({ message: error.message || "Error al obtener ticket" });
    }
  });

  // Anular ticket
  app.patch('/api/tickets-facturacion/:id/anular', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { motivo } = req.body;
      
      const ticket = await storage.getTicketFacturacion(id);
      if (!ticket || ticket.negocioId !== usuarioId) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }
      
      const updated = await storage.anularTicketFacturacion(id, motivo);
      res.json(updated);
    } catch (error: any) {
      console.error("Error al anular ticket:", error);
      res.status(500).json({ message: error.message || "Error al anular ticket" });
    }
  });

  // Obtener resumen del carrito con totales por negocio
  app.get('/api/carrito/resumen', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const items = await storage.getCarritoUsuario(usuarioId);
      
      // Enriquecer items con datos del producto, categoría y código
      const itemsEnriquecidos = await Promise.all(items.map(async (item) => {
        let nombreProducto = item.etiquetaPrecio || 'Producto';
        let imagenProducto: string | null = null;
        let codigoProducto: string | null = null;
        let nombreCategoria: string | null = null;
        let codigoCategoria: string | null = null;
        let etiquetaPrecio: string | null = item.etiquetaPrecio || null;
        
        if (item.tipoProducto === 'item_catalogo' && item.itemCatalogoId) {
          const itemCatalogo = await storage.getItemCatalogoLocal(item.itemCatalogoId);
          if (itemCatalogo) {
            nombreProducto = itemCatalogo.nombre;
            imagenProducto = itemCatalogo.imagenUrl || null;
            codigoProducto = itemCatalogo.codigo || null;
            
            // Obtener categoría
            if (itemCatalogo.categoriaId) {
              const categoria = await storage.getCategoriaCatalogo(itemCatalogo.categoriaId);
              if (categoria) {
                nombreCategoria = categoria.nombre;
                codigoCategoria = categoria.codigo;
              }
            }
          }
        } else if (item.tipoProducto === 'producto_usuario' && item.productoUsuarioId) {
          const producto = await storage.getProductoUsuario(item.productoUsuarioId);
          if (producto) {
            nombreProducto = producto.nombre;
            imagenProducto = producto.imagenUrl || null;
          }
        }
        
        return {
          id: item.id,
          productoId: item.productoUsuarioId || null,
          itemCatalogoId: item.itemCatalogoId || null,
          catalogoId: item.catalogoId || null,
          nombreProducto,
          codigoProducto,
          nombreCategoria,
          codigoCategoria,
          etiquetaPrecio,
          precioUnitario: item.precioUnitario,
          cantidad: item.cantidad || 1,
          imagenProducto,
          notas: item.notas || null,
        };
      }));
      
      // Agrupar por catálogo/negocio
      const porNegocio: Record<string, { 
        catalogoId: string | null; 
        localComercialId: string | null;
        nombreNegocio: string;
        items: typeof itemsEnriquecidos;
        subtotal: number;
      }> = {};
      
      for (const item of itemsEnriquecidos) {
        const key = item.catalogoId || 'sin-catalogo';
        if (!porNegocio[key]) {
          let nombreNegocio = 'Productos';
          let localComercialId = null;
          
          if (item.catalogoId) {
            const catalogo = await storage.getCatalogoLocal(item.catalogoId);
            if (catalogo) {
              nombreNegocio = catalogo.nombre || 'Negocio';
              localComercialId = catalogo.usuarioId || null;
            }
          }
          
          porNegocio[key] = {
            catalogoId: item.catalogoId,
            localComercialId,
            nombreNegocio,
            items: [],
            subtotal: 0
          };
        }
        
        const precioUnitario = parseFloat(String(item.precioUnitario || 0));
        const cantidad = item.cantidad || 1;
        const subtotalItem = precioUnitario * cantidad;
        
        porNegocio[key].items.push(item);
        porNegocio[key].subtotal += subtotalItem;
      }
      
      const resumen = Object.values(porNegocio);
      const totalGeneral = resumen.reduce((acc, neg) => acc + neg.subtotal, 0);
      const totalItems = itemsEnriquecidos.reduce((acc, item) => acc + (item.cantidad || 1), 0);
      
      res.json({
        grupos: resumen,
        totalGeneral,
        totalItems,
        moneda: 'PEN'
      });
    } catch (error: any) {
      console.error("Error al obtener resumen del carrito:", error);
      res.status(500).json({ message: error.message || "Error al obtener resumen del carrito" });
    }
  });

  // Endpoint de conversión de moneda para el carrito
  app.get('/api/convertir-precio', async (req, res) => {
    try {
      const { monto, monedaOrigen, monedaDestino } = req.query;
      
      if (!monto || !monedaOrigen || !monedaDestino) {
        return res.status(400).json({ message: "Parámetros requeridos: monto, monedaOrigen, monedaDestino" });
      }
      
      const resultado = await storage.convertirPrecio(
        parseFloat(String(monto)),
        String(monedaOrigen),
        String(monedaDestino)
      );
      
      res.json(resultado);
    } catch (error: any) {
      console.error("Error en conversión de moneda:", error);
      res.status(500).json({ message: error.message || "Error en conversión" });
    }
  });

  // ============================================================
  // PEDIDOS - Sistema de órdenes
  // ============================================================

  // Obtener pedidos del usuario
  app.get('/api/mis-pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { estado } = req.query;
      
      const pedidosLista = await storage.getPedidosUsuario(usuarioId, estado as string | undefined);
      
      // Enriquecer con items y datos del local
      const pedidosEnriquecidos = await Promise.all(pedidosLista.map(async (pedido) => {
        const items = await storage.getItemsPedido(pedido.id);
        const historial = await storage.getHistorialPedido(pedido.id);
        let localComercial = null;
        if (pedido.localComercialId) {
          const local = await storage.getUser(pedido.localComercialId);
          if (local) {
            localComercial = {
              id: local.id,
              nombre: local.nombre || local.nombreCompleto,
              telefono: local.telefono,
              foto: local.foto || local.fotoUrl,
            };
          }
        }
        return { ...pedido, items, historial, localComercial };
      }));
      
      res.json(pedidosEnriquecidos);
    } catch (error: any) {
      console.error("Error al obtener pedidos:", error);
      res.status(500).json({ message: error.message || "Error al obtener pedidos" });
    }
  });

  // Obtener pedidos activos del usuario (no confirmados ni cancelados)
  app.get('/api/mis-pedidos/activos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Estados activos (no finalizados)
      const estadosActivos = ['pendiente', 'aceptado', 'preparando', 'listo', 'en_camino', 'entregado'];
      const pedidosActivos = await storage.getPedidosUsuarioActivos(usuarioId, estadosActivos);
      
      // Enriquecer con nombre del local
      const pedidosEnriquecidos = await Promise.all(pedidosActivos.map(async (pedido) => {
        let nombreLocal = null;
        if (pedido.localComercialId) {
          const local = await storage.getUser(pedido.localComercialId);
          const negocio = await storage.getDatosNegocio(pedido.localComercialId);
          nombreLocal = negocio?.nombreComercial || local?.nombreCompleto || local?.firstName || "Local";
        }
        return { ...pedido, nombreLocal };
      }));
      
      res.json(pedidosEnriquecidos);
    } catch (error: any) {
      console.error("Error al obtener pedidos activos:", error);
      res.status(500).json({ message: error.message || "Error al obtener pedidos activos" });
    }
  });

  // Obtener pedidos delegados al usuario actual (donde él es el pagador)
  app.get('/api/mis-pedidos/delegados', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      // Buscar pedidos donde el usuario es el pagador delegado
      const pedidosDelegados = await storage.getPedidosDelegadosAlUsuario(usuarioId);
      
      // Enriquecer con nombre del local y del solicitante
      const pedidosEnriquecidos = await Promise.all(pedidosDelegados.map(async (pedido) => {
        let nombreLocal = null;
        let nombreSolicitante = null;
        
        if (pedido.localComercialId) {
          const local = await storage.getUser(pedido.localComercialId);
          const negocio = await storage.getDatosNegocio(pedido.localComercialId);
          nombreLocal = negocio?.nombreComercial || local?.nombreCompleto || local?.firstName || "Local";
        }
        
        if (pedido.usuarioId) {
          const solicitante = await storage.getUser(pedido.usuarioId);
          nombreSolicitante = solicitante?.nombreCompleto || solicitante?.nombre || solicitante?.firstName || "Usuario";
        }
        
        return { ...pedido, nombreLocal, nombreSolicitante };
      }));
      
      res.json(pedidosEnriquecidos);
    } catch (error: any) {
      console.error("Error al obtener pedidos delegados:", error);
      res.status(500).json({ message: error.message || "Error al obtener pedidos delegados" });
    }
  });

  // Confirmar recepción del pedido (cliente confirma que recibió el pedido)
  app.patch('/api/mis-pedidos/:id/confirmar', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const pedido = await storage.getPedido(id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Verificar que el pedido pertenece al usuario
      if (pedido.usuarioId !== usuarioId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      // Verificar que el estado es "entregado" para poder confirmar
      if (pedido.estado !== 'entregado') {
        return res.status(400).json({ message: "Solo puedes confirmar pedidos que han sido entregados" });
      }
      
      // Actualizar estado a confirmado
      const pedidoActualizado = await storage.updatePedido(id, {
        estado: 'confirmado',
        estadoAnterior: pedido.estado,
        fechaConfirmado: new Date(),
      });
      
      // Registrar en historial
      await storage.addHistorialEstadoPedido({
        pedidoId: id,
        estadoAnterior: 'entregado',
        estadoNuevo: 'confirmado',
        descripcion: 'Cliente confirmó recepción del pedido',
        usuarioId: usuarioId,
        tipoUsuario: 'cliente',
      });
      
      res.json(pedidoActualizado);
    } catch (error: any) {
      console.error("Error al confirmar recepción:", error);
      res.status(500).json({ message: error.message || "Error al confirmar recepción" });
    }
  });

  // Procesar pago de pedido delegado (el pagador completa el pago)
  app.post('/api/mis-pedidos/:id/pagar-delegado', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { metodoPago, voucherUrl } = req.body;
      
      const pedido = await storage.getPedido(id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Verificar que el usuario es el pagador delegado
      if (pedido.usuarioPagadorId !== usuarioId) {
        return res.status(403).json({ message: "No eres el pagador delegado de este pedido" });
      }
      
      // Verificar que el pago aún está pendiente
      if (pedido.estadoPago !== 'pendiente') {
        return res.status(400).json({ message: "Este pedido ya fue pagado" });
      }
      
      // Validar método de pago
      if (!metodoPago || !['billetera', 'yape', 'plin'].includes(metodoPago)) {
        return res.status(400).json({ message: "Método de pago no válido" });
      }
      
      // Para Yape/Plin, requerir voucher
      if (['yape', 'plin'].includes(metodoPago) && !voucherUrl) {
        return res.status(400).json({ message: "Debes adjuntar el comprobante de pago" });
      }
      
      // Procesar pago con billetera si se especificó
      if (metodoPago === 'billetera') {
        const saldo = await storage.getSaldoUsuario(usuarioId);
        const totalPedido = parseFloat(pedido.total || '0');
        const saldoActual = parseFloat(saldo?.saldo || '0');
        
        if (saldoActual < totalPedido) {
          return res.status(400).json({ message: "Saldo insuficiente en billetera" });
        }
        
        // Descontar saldo
        await storage.actualizarSaldo(usuarioId, -totalPedido, 'pago_pedido_delegado', `Pago de pedido delegado #${pedido.numeroPedido || id}`);
      }
      
      // Actualizar pedido con información de pago
      const pedidoActualizado = await storage.updatePedido(id, {
        estadoPago: 'pagado',
        metodoPago: metodoPago || pedido.metodoPago,
        fechaPago: new Date(),
        notasCliente: voucherUrl 
          ? `${pedido.notasCliente || ""}\n\n[Voucher pagador: ${voucherUrl}]`.trim()
          : pedido.notasCliente,
      });
      
      // Registrar en historial
      await storage.addHistorialEstadoPedido({
        pedidoId: id,
        estadoAnterior: 'pago_pendiente',
        estadoNuevo: 'pagado',
        descripcion: 'Pagador delegado completó el pago',
        usuarioId: usuarioId,
        tipoUsuario: 'pagador',
      });
      
      // Notificar al solicitante original que su pedido fue pagado
      if (pedido.usuarioId) {
        notificarUsuario(pedido.usuarioId, {
          tipo: 'general',
          titulo: 'Pago Completado',
          mensaje: 'Tu pedido ha sido pagado correctamente',
          pedidoId: id,
        });
      }
      
      res.json({ 
        success: true, 
        pedido: pedidoActualizado,
        message: "Pago procesado exitosamente" 
      });
    } catch (error: any) {
      console.error("Error al procesar pago delegado:", error);
      res.status(500).json({ message: error.message || "Error al procesar el pago" });
    }
  });

  // Obtener detalle de un pedido
  app.get('/api/mis-pedidos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const pedido = await storage.getPedido(id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Verificar que el pedido pertenece al usuario o es el local
      if (pedido.usuarioId !== usuarioId && pedido.localComercialId !== usuarioId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      const items = await storage.getItemsPedido(id);
      const historial = await storage.getHistorialPedido(id);
      const solicitudDelivery = await storage.getSolicitudDeliveryPorPedido(id);
      
      let localComercial = null;
      if (pedido.localComercialId) {
        const local = await storage.getUser(pedido.localComercialId);
        if (local) {
          localComercial = {
            id: local.id,
            nombre: local.nombre || local.nombreCompleto,
            direccion: local.direccion,
            telefono: local.telefono,
            foto: local.foto || local.fotoUrl,
          };
        }
      }
      
      res.json({ ...pedido, items, historial, solicitudDelivery, localComercial });
    } catch (error: any) {
      console.error("Error al obtener pedido:", error);
      res.status(500).json({ message: error.message || "Error al obtener pedido" });
    }
  });

  // Cambiar estado del pedido (para locales comerciales)
  app.patch('/api/pedidos/:id/estado', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { estado, descripcion, motivoCancelacion } = req.body;
      
      const pedido = await storage.getPedido(id);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Determinar tipo de usuario y verificar permisos
      let tipoUsuario = 'cliente';
      if (pedido.localComercialId === usuarioId) {
        tipoUsuario = 'local';
      } else if (pedido.deliveryId === usuarioId) {
        tipoUsuario = 'delivery';
      } else if (pedido.usuarioId !== usuarioId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      // Validar transiciones de estado permitidas
      const transicionesPermitidas: Record<string, string[]> = {
        'pendiente': ['aceptado', 'cancelado'],
        'aceptado': ['preparando', 'cancelado'],
        'preparando': ['listo', 'cancelado'],
        'listo': ['en_camino', 'entregado'],
        'en_camino': ['entregado'],
        'entregado': ['confirmado'],
      };
      
      if (!transicionesPermitidas[pedido.estado!]?.includes(estado)) {
        return res.status(400).json({ 
          message: `No se puede cambiar de ${pedido.estado} a ${estado}` 
        });
      }
      
      // Actualizar datos adicionales si es cancelación
      if (estado === 'cancelado' && motivoCancelacion) {
        await storage.updatePedido(id, { 
          motivoCancelacion, 
          canceladoPor: tipoUsuario 
        });
      }
      
      const actualizado = await storage.cambiarEstadoPedido(id, estado, usuarioId, tipoUsuario, descripcion);
      
      // Notificar cambio de estado via WebSocket
      notificarSuperAdmins(`pedido_estado:${pedido.usuarioId}`, { pedidoId: id, estado });
      if (pedido.localComercialId && pedido.localComercialId !== usuarioId) {
        notificarSuperAdmins(`pedido_estado:${pedido.localComercialId}`, { pedidoId: id, estado });
      }
      
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      res.status(500).json({ message: error.message || "Error al cambiar estado" });
    }
  });

  // Cola de pedidos para local comercial
  app.get('/api/local/cola-pedidos', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      
      const cola = await storage.getColaPedidosLocal(usuarioId);
      
      // Enriquecer con items
      const colaEnriquecida = await Promise.all(cola.map(async (pedido) => {
        const items = await storage.getItemsPedido(pedido.id);
        let cliente = null;
        const user = await storage.getUser(pedido.usuarioId);
        if (user) {
          cliente = {
            id: user.id,
            nombre: user.nombre || user.nombreCompleto,
            telefono: user.telefono,
          };
        }
        return { ...pedido, items, cliente };
      }));
      
      res.json(colaEnriquecida);
    } catch (error: any) {
      console.error("Error al obtener cola:", error);
      res.status(500).json({ message: error.message || "Error al obtener cola" });
    }
  });

  // ============================================================
  // SOLICITUDES DE DELIVERY
  // ============================================================

  // Crear solicitud de delivery para un pedido
  app.post('/api/pedidos/:pedidoId/delivery', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { pedidoId } = req.params;
      const { tipoVehiculo } = req.body;
      
      const pedido = await storage.getPedido(pedidoId);
      if (!pedido) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }
      
      // Verificar permisos (usuario o local)
      if (pedido.usuarioId !== usuarioId && pedido.localComercialId !== usuarioId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      // Verificar que no exista solicitud activa
      const solicitudExistente = await storage.getSolicitudDeliveryPorPedido(pedidoId);
      if (solicitudExistente && solicitudExistente.estado !== 'cancelado') {
        return res.status(400).json({ message: "Ya existe una solicitud de delivery activa" });
      }
      
      // Obtener datos del local
      let direccionOrigen = null;
      let latitudOrigen = null;
      let longitudOrigen = null;
      
      if (pedido.localComercialId) {
        const local = await storage.getUser(pedido.localComercialId);
        if (local) {
          direccionOrigen = local.direccion;
        }
      }
      
      const solicitud = await storage.createSolicitudDelivery({
        pedidoId,
        localComercialId: pedido.localComercialId,
        latitudOrigen,
        longitudOrigen,
        direccionOrigen,
        latitudDestino: pedido.latitudEntrega,
        longitudDestino: pedido.longitudEntrega,
        direccionDestino: pedido.direccionEntrega,
        tipoVehiculo: tipoVehiculo || 'moto',
        estado: 'pendiente',
      });
      
      // Notificar a conductores disponibles
      notificarSuperAdmins('nueva_solicitud_delivery', { solicitudId: solicitud.id });
      
      res.status(201).json(solicitud);
    } catch (error: any) {
      console.error("Error al crear solicitud delivery:", error);
      res.status(500).json({ message: error.message || "Error al crear solicitud" });
    }
  });

  // Obtener solicitudes de delivery pendientes (para conductores)
  app.get('/api/delivery/solicitudes', isAuthenticated, async (req: any, res) => {
    try {
      const { estado } = req.query;
      const solicitudes = await storage.getSolicitudesDelivery(estado as string | undefined);
      res.json(solicitudes);
    } catch (error: any) {
      console.error("Error al obtener solicitudes:", error);
      res.status(500).json({ message: error.message || "Error al obtener solicitudes" });
    }
  });

  // Aceptar solicitud de delivery (conductor)
  app.post('/api/delivery/solicitudes/:id/aceptar', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      
      const solicitud = await storage.getSolicitudDelivery(id);
      if (!solicitud) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }
      
      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({ message: "Solicitud ya no está disponible" });
      }
      
      // Obtener datos del conductor
      const conductor = await storage.getUser(usuarioId);
      
      const actualizado = await storage.asignarDelivery(id, usuarioId, {
        nombre: conductor?.nombre || conductor?.nombreCompleto || 'Conductor',
        telefono: conductor?.telefono,
        vehiculo: '', // Se puede obtener de credenciales_conductor
        placa: '',
      });
      
      // Actualizar pedido con el delivery asignado
      if (solicitud.pedidoId) {
        await storage.updatePedido(solicitud.pedidoId, { 
          deliveryId: usuarioId,
          deliveryTipo: solicitud.tipoVehiculo,
        });
      }
      
      // Notificar al cliente y local
      const pedido = await storage.getPedido(solicitud.pedidoId);
      if (pedido) {
        notificarSuperAdmins(`delivery_asignado:${pedido.usuarioId}`, { solicitudId: id });
        if (pedido.localComercialId) {
          notificarSuperAdmins(`delivery_asignado:${pedido.localComercialId}`, { solicitudId: id });
        }
      }
      
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al aceptar solicitud:", error);
      res.status(500).json({ message: error.message || "Error al aceptar solicitud" });
    }
  });

  // Actualizar ubicación del delivery
  app.patch('/api/delivery/solicitudes/:id/ubicacion', isAuthenticated, async (req: any, res) => {
    try {
      const usuarioId = req.user.claims.sub;
      const { id } = req.params;
      const { latitud, longitud } = req.body;
      
      const solicitud = await storage.getSolicitudDelivery(id);
      if (!solicitud || solicitud.deliveryId !== usuarioId) {
        return res.status(403).json({ message: "No autorizado" });
      }
      
      const actualizado = await storage.actualizarUbicacionDelivery(id, latitud, longitud);
      
      // Notificar ubicación en tiempo real
      const pedido = await storage.getPedido(solicitud.pedidoId);
      if (pedido) {
        notificarSuperAdmins(`ubicacion_delivery:${pedido.usuarioId}`, { 
          solicitudId: id, 
          latitud, 
          longitud 
        });
      }
      
      res.json(actualizado);
    } catch (error: any) {
      console.error("Error al actualizar ubicación:", error);
      res.status(500).json({ message: error.message || "Error al actualizar ubicación" });
    }
  });

  // ============================================================
  // CONFIGURACIÓN DE WEBSOCKET
  // ============================================================

  const httpServer = createServer(app);
  
  // Configurar WebSocket con rooms y persistencia
  const { setupWebSocket } = await import('./websocket');
  setupWebSocket(httpServer);

  return httpServer;
}
