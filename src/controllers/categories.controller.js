// matchedData: devuelve solo los datos que pasaron las validaciones de la ruta
import { matchedData } from "express-validator";
// modelo de mongoose que permite consultar y modificar la coleccion de categorias
import { categoryModel } from "../models/category.model.js";
// modelo de eventos, se usa para quitar la categoria de los eventos al eliminarla
import { EventModel } from "../models/event.model.js";

// crear una categoria
export const createCategory = async (req, res) => {
  try {
    // "body" es el contenido que el cliente envia, solo con los campos validados
    const datavalida = matchedData(req, { locations: ["body"] });

    // create guarda la categoria nueva
    // ...datavalida copia todos los campos validados dentro del documento
    await categoryModel.create({ ...datavalida });

    return res.status(201).json({ msg: "Categoria creada exitosamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// obtener todas las categorias
export const getAllCategory = async (req, res) => {
  try {
    // find sin filtro trae todas las categorias
    const categories = await categoryModel.find();

    return res.status(200).json({ categories });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// obtener una categoria por id
export const getCategoryById = async (req, res) => {
  try {
    // toma el id de la url, como en /api/categories/:id
    const { id } = req.params;
    // find devuelve siempre un array, vacio si no encuentra ninguna categoria
    // populate reemplaza los ids de events por los datos completos de cada evento
    const category = await categoryModel.find({ _id: id }).populate("events");

    return res.status(200).json({ category });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// actualizar una categoria
export const updateCategory = async (req, res) => {
  try {
    // toma el id de la url
    const { id } = req.params;
    // campos nuevos enviados por el cliente que pasaron las validaciones
    const dataValida = matchedData(req, { locations: ["body"] });
    // findByIdAndUpdate busca la categoria por id y la modifica
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      { _id: id },
      // ...dataValida copia todos los campos validados con los valores nuevos
      { ...dataValida },
      {
        // returnDocument define que version de la categoria se devuelve
        returnDocument: true,
      },
    );

    return res
      .status(200)
      .json({ msg: "Categoria editada exitosamente", updatedCategory });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// eliminar una categoria y quitarla de los eventos que la tenian
export const deleteCategory = async (req, res) => {
  try {
    // toma el id de la url
    const { id } = req.params;

    // updateMany modifica todos los eventos que cumplan el filtro
    // el filtro { categories: id } elige los eventos que tienen esta categoria
    // $pull saca el id de la categoria del array categories de cada evento
    await EventModel.updateMany(
      { categories: id },
      { $pull: { categories: id } },
    );

    // findByIdAndDelete borra la categoria de la base y devuelve la categoria borrada
    const category = await categoryModel.findByIdAndDelete(
      { _id: id },
      { returnDocument: true },
    );

    return res
      .status(200)
      .json({ msg: "Categoria eliminada exitosamente", category });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};
