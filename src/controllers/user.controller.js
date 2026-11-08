import { UserModel } from "../models/user.model.js";
//matchedData: es una función de express-validator que devuelve solo los datos que pasaron las validaciones de la ruta. Los datos que no validaste no aparecen
import { matchedData } from "express-validator";
import { hashPassword } from "../helpers/bcrypt.helper.js";
import { EventModel } from "../models/event.model.js";
import { populate } from "dotenv";

// obtener todos los usuarios activos
export const getAllUsers = async (req, res) => {
  try {
    // deletedAt: null excluye los usuarios marcados como eliminados
    const users = await UserModel.find({
      deletedAt: null,
    })
      // reemplaza los ids de events por los datos completos de cada evento
      .populate("events")
      // excluye la password para no enviarla al cliente
      .select("-password");

    return res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno en el servidor" });
  }
};

// obtener un usuario activo por id
export const getUserById = async (req, res) => {
  try {
    // toma el id de la url, ya validado con isMongoId en la ruta
    const { id } = matchedData(req, { locations: ["params"] });

    // findOne devuelve un solo documento, o null si no encuentra ninguno
    const user = await UserModel.findOne({
      _id: id,
      deletedAt: null,
    })
      // excluye la password para no enviarla al cliente
      .select("-password")
      // trae los datos completos de los eventos del usuario
      .populate("events");

    // si no existe o esta eliminado, responde 404
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno en el servidor" });
  }
};

// actualizar un usuario activo
export const updateUser = async (req, res) => {
  try {
    // datos que pasaron las validaciones de la ruta
    const data = matchedData(req);
    // separa password y profile, el resto queda en topLevelFields
    const { password, profile, ...topLevelFields } = data;

    // si viene password, se hashea antes de guardarla
    if (password) {
      topLevelFields.password = await hashPassword(password);
    }

    // Construimos las claves con notación de punto para no reemplazar el perfil completo
    const updateFields = { ...topLevelFields };

    // si viene profile, se arma una clave por cada campo (profile.firstName, etc)
    // asi se editan solo esos campos y los demas del perfil se mantienen
    if (profile) {
      for (const [key, value] of Object.entries(profile)) {
        updateFields[`profile.${key}`] = value;
      }
    }

    // busca un usuario activo con el id de la url y le aplica los cambios
    // $set modifica solo los campos indicados
    // new: true devuelve el usuario ya actualizado
    // runValidators aplica las validaciones del schema al actualizar
    // select("-password") evita devolver la password al cliente
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    // si no existe o esta eliminado, responde 404
    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    return res.json({
      message: "Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    // el codigo 11000 indica un valor duplicado en un campo unico
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "El email o username ya está en uso" });
    }
    // cualquier otro error inesperado responde 500
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
// eliminacion logica de un usuario y eliminacion en cascada de sus eventos
export const deleteUser = async (req, res) => {
  try {
    // no borra el usuario, solo guarda la fecha de eliminacion en deletedAt
    // el filtro deletedAt: null evita eliminar un usuario ya eliminado
    // new: true devuelve el usuario ya modificado
    const user = await UserModel.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true },
    );

    // si no existe o ya estaba eliminado, responde 404
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // cascada: borra todos los eventos organizados por ese usuario
    await eventModel.deleteMany({ organizer: req.params.id });

    return res.status(200).json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    // cualquier error inesperado responde 500
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
