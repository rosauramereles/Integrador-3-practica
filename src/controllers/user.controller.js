import { isValidObjectId } from "mongoose";
import { UserModel } from "../models/user.model.js";
import { EventModel } from "../models/event.model.js";

// GET /api/users-> Listar los usuarios activos con el virtual populate events.(solo admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ deletedAt: null })
      .populate("events")
      //populate: trae los datos de los eventos que organizo el usuario, en lugar de solo el id del evento
      .select("-password");
      //select: trae todos los datos del usuario, excepto la contraseña

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: "ID de usuario inválido" });
    }

    const user = await UserModel.findOne({
      _id: id,
      deletedAt: null,
    })
      .populate("events")
      .select("-password");

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: "ID de usuario inválido" });
    }

    const user = await UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Solo permitimos actualizar estos campos.
    const { username, email, role, profile } = req.body;

    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (profile !== undefined) user.profile = profile;

    // save() ejecuta las validaciones definidas en el esquema de Mongoose.
    await user.save();

    return res.status(200).json({
      msg: "Usuario actualizado correctamente",
      user,
    });
  } catch (error) {
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({
        msg: "El username o email ya está en uso",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        msg: "Los datos del usuario no son válidos",
      });
    }

    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: "ID de usuario inválido" });
    }

    const user = await UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // Eliminación lógica del usuario.
    user.deletedAt = new Date();
    await user.save();

    // Eliminación física de los eventos que organizó.
    await EventModel.deleteMany({ organizer: user._id });

    return res.status(200).json({
      msg: "Usuario eliminado correctamente junto con sus eventos",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};