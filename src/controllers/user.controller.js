import { UserModel } from "../models/user.model.js";
//matchedData: es una función de express-validator que devuelve solo los datos que pasaron las validaciones de la ruta. Los datos que no validaste no aparecen
import { matchedData } from "express-validator";
import { hashPassword } from "../helpers/bcrypt.helper.js";
import { eventModel } from "../models/event.model.js";

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, profile } = matchedData(req, {
      locations: ["body"],
    });

    const hasedPassword = await hashPassword(password);

    await UserModel.create({
      username,
      email,
      password: hasedPassword,
      role,
      profile,
    });

    return res.status(201).json({ msg: "usuario registrado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

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

// actualizar un usuario
export const updateUser = async (req, res) => {
  try {
    // locations indica en que parte de la peticion buscar los datos
    // "params" son los parametros de la url, como el id en /api/users/:id
    const { id } = matchedData(req, { locations: ["params"] });
    // "body" es el contenido que el cliente envia en la peticion (los datos nuevos)
    // matchedData devuelve solo los campos que pasaron las validaciones
    const dataValida = matchedData(req, { locations: ["body"] });

    // findByIdAndUpdate busca un usuario por id y lo modifican
    // sin esto devolveria el usuario como estaba antes del cambio
    const userUpdated = await UserModel.findByIdAndUpdate(
      { _id: id },
      { $set: { ...dataValida } }, // $set cambia solo los campos indicados y deja los demas como estan
      // ...dataValida copia todos los campos validados dentro de $set
      { returnDocument: "after" },
      // returnDocument: "after" devuelve el usuario ya modificado
    );

    return res
      .status(200)
      .json({ msg: "El usuario fue editado exitozamente", userUpdated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error interno en el servidor" });
  }
};

// eliminacion logica de un usuario y eliminacion en cascada de sus eventos
export const deletUser = async (req, res) => {
  try {
    // "params" son los parametros de la url, aca se toma el id del usuario
    const { id } = matchedData(req, { locations: ["params"] });

    // deleteMany borra todos los eventos cuyo organizer sea este usuario (cascada)
    await eventModel.deleteMany({ organizer: id }); // organizer es el campo del evento que guarda el id del usuario que lo creo

    // no borra el usuario, $set guarda la fecha de eliminacion en deletedAt
    const userUpdated = await UserModel.findByIdAndUpdate(
      { _id: id },
      { $set: { deletedAt: new Date() } },
      { returnDocument: "after" }, // returnDocument: "after" devuelve el usuario ya modificado
    );

    return res
      .status(200)
      .json({ msg: "El usuario fue eliminado exitozamente", userUpdated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "error interno en el servidor" });
  }
};
