// matchedData: devuelve solo los datos que pasaron las validaciones de la ruta
import { matchedData } from "express-validator";
// modelo de mongoose que permite consultar y modificar la coleccion de eventos
import { eventModel } from "../models/event.model.js";

// crear un evento
export const createEvent = async (req, res) => {
  try {
    // user_id viene de req.user, que se completa con los datos del usuario logueado
    const { user_id } = req.user;
    // "body" es el contenido que el cliente envia, solo con los campos validados
    const dataEvent = matchedData(req, { locations: ["body"] });

    // la fecha de fin tiene que ser posterior a la de inicio, si no responde 400
    if (new Date(dataEvent.endDate) <= new Date(dataEvent.startDate)) {
      return res.status(400).json({
        message: "La fecha de finalización debe ser posterior a la de inicio",
      });
    }

    // create guarda el evento nuevo
    // organizer guarda el id del usuario que lo creo
    await eventModel.create({ ...dataEvent, organizer: user_id });

    return res.status(201).json({ msg: "Evento creado exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// obtener todos los eventos
export const getAllEvent = async (req, res) => {
  try {
    // find sin filtro trae todos los eventos
    const events = await EventModel.find()
      // reemplaza el id del organizador por sus datos, sin la password
      .populate("organizer", "-password")
      // reemplaza los ids de categorias por sus datos, sin el campo _id
      .populate("categories", "-_id");
    return res.status(200).json(events);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// obtener un evento por id
export const getEventById = async (req, res) => {
  try {
    // toma el id de la url, como en /api/events/:id
    const { id } = req.params;
    // find devuelve siempre un array, vacio si no encuentra ningun evento
    const events = await eventModel.find({ _id: id })
      // reemplaza el id del organizador por sus datos, sin la password
      .populate("organizer", "-password")
      // reemplaza los ids de categorias por sus datos, sin el campo _id
      .populate("categories", "-_id");

    return res.status(200).json(events);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// obtener los eventos creados por el usuario logueado
export const getUserEvents = async (req, res) => {
  try {
    // user_id viene de req.user, que se completa con los datos del usuario logueado
    const { user_id } = req.user;
    // trae solo los eventos cuyo organizer sea este usuario
    const events = await eventModel.find({ organizer: user_id })
      // reemplaza el id del organizador por sus datos, sin la password
      .populate("organizer", "-password")
      // reemplaza los ids de categorias por sus datos, sin el campo _id
      .populate("categories", "-_id");
    return res.status(200).json(events);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// actualizar un evento
export const updateEvent = async (req, res) => {
  try {
    // toma el id de la url
    const { id } = req.params;
    // campos nuevos enviados por el cliente que pasaron las validaciones
    const datavalida = matchedData(req, { locations: ["body"] });

    // si se cambia alguna fecha, hay que revisar que sigan siendo coherentes
    if (datavalida.startDate || datavalida.endDate) {
      // busca las fechas que el evento tiene guardadas
      // select trae solo esos dos campos
      const event = await eventModel.findById(id).select("startDate endDate");

      if (event) {
        // ?? usa la fecha nueva si fue enviada, si no usa la que ya estaba guardada
        const startDate = datavalida.startDate ?? event.startDate;
        const endDate = datavalida.endDate ?? event.endDate;

        // la fecha de fin tiene que ser posterior a la de inicio, si no responde 400
        if (new Date(endDate) <= new Date(startDate)) {
          return res.status(400).json({
            msg: "La fecha de finalización debe ser posterior a la de inicio",
          });
        }
      }
    }

    // findByIdAndUpdate busca el evento por id y lo modifica
    const updatedEvent = await eventModel.findByIdAndUpdate(
      { _id: id },
      // $set cambia solo los campos indicados y deja los demas como estan
      // ...datavalida copia todos los campos validados dentro de $set
      { $set: { ...datavalida } },
      // returnDocument define que version del evento se devuelve
      // runValidators: true aplica las validaciones del esquema tambien al actualizar
      { returnDocument: true, runValidators: true },
    );

    return res
      .status(200)
      .json({ msg: "El evento se a actualizado correctamente", updatedEvent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// eliminar un evento
export const deleteEvent = async (req, res) => {
  try {
    // toma el id de la url
    const { id } = req.params;

    // findByIdAndDelete borra el evento de la base y devuelve el evento borrado
    const updatedEvent = await eventModel.findByIdAndDelete(
      { _id: id },
      { returnDocument: true },
    );

    return res
      .status(200)
      .json({ msg: "El evento se a eliminado correctamente", updatedEvent });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};
