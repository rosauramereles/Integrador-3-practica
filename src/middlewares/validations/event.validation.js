// body: funcion de express-validator para validar los datos que llegan en el body de la peticion
import { body } from "express-validator";
// modelo de eventos, se usa para consultar si ya existe un evento con el mismo titulo
import { EventModel } from "../../models/event.model.js";
// modelo de categorias, se usa para comprobar que las categorias enviadas existen
import { CategoryModel } from "../../models/category.model.js";

// validaciones para crear un evento
// cada withMessage define el mensaje de error de la validacion que esta justo antes
export const createEventValidation = [
  // title: obligatorio, de 3 a 150 caracteres y unico
  body("title")
    // notEmpty: el campo no puede estar vacio
    .notEmpty()
    .withMessage("El título es obligatorio")
    // isLength: largo minimo y maximo permitido
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres")
    // custom: validacion propia, si lanza un error el campo se marca como invalido
    .custom(async (title) => {
      // busca si ya existe un evento con ese titulo
      const existingEvent = await EventModel.findOne({ title });
      if (existingEvent) {
        throw new Error("Ya existe un evento con este título");
      }
      return true;
    }),
  // description: obligatoria y de al menos 20 caracteres
  body("description")
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    // sin max, solo se exige el largo minimo
    .isLength({ min: 20 })
    .withMessage("La descripción debe tener al menos 20 caracteres")
    .isLength({ min: 20 })
    .withMessage("La descripción debe tener al menos 20 caracteres"),
  // startDate: obligatoria y con formato de fecha
  body("startDate")
    .notEmpty()
    .withMessage("La fecha de inicio es obligatoria")
    // isDate: revisa que el texto tenga formato de fecha valido
    .isDate()
    .withMessage("La fecha de inicio debe ser una fecha válida"),
  // endDate: obligatoria y con formato de fecha
  // que sea posterior a startDate se controla en el controlador
  body("endDate")
    .notEmpty()
    .withMessage("La fecha de finalización es obligatoria")
    .isDate()
    .withMessage("La fecha de finalización debe ser una fecha válida"),
  // capacity: numero entero de 1 o mas
  body("capacity")
    // isInt: solo acepta numeros enteros, min: 1 exige que sea 1 o mayor
    .isInt({ min: 1 })
    .withMessage("La capacidad debe ser un número entero mayor o igual a 1"),
  // price: debe ser un numero
  body("price")
    // isNumeric: solo acepta numeros
    .isNumeric({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0"),
  // status: opcional, solo acepta uno de los tres estados
  body("status")
    // optional: si el campo no se envia, se saltan las demas validaciones
    .optional()
    // isIn: el valor debe ser uno de la lista
    .isIn(["scheduled", "cancelled", "finished"])
    .withMessage("El estado debe ser 'scheduled', 'cancelled' o 'finished'"),
  // categories: opcional, pero si se envia debe ser un array de ids de categorias que existan
  body("categories")
    .optional()
    // isArray: debe ser un array, min: 1 exige al menos un elemento
    .isArray({ min: 1 })
    .withMessage("Debe haber al menos una categoría")
    .custom(async (categories) => {
      // recorre cada categoria enviada
      for (const category of categories) {
        // cada elemento debe ser un texto no vacio
        if (!category || typeof category !== "string") {
          throw new Error("Cada categoría debe ser un ID de Mongo válido");
        }

        // findById busca la categoria por id, devuelve null si no existe
        const exsitCategoty = await CategoryModel.findById(category);

        if (!exsitCategoty) {
          throw new Error("no se encontro la categoria con el ID", category);
        }
      }
      return true;
    }),
  // "location.venue" es el campo venue dentro del objeto location
  // venue: obligatorio, de 3 a 100 caracteres
  body("location.venue")
    .notEmpty()
    .withMessage("El lugar es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("el nombre del lugar debe tener entre 3 y 100 caracteres"),
  // address: obligatoria, de 5 a 150 caracteres
  body("location.address")
    .notEmpty()
    .withMessage("La dirección es obligatoria")
    .isLength({ min: 5, max: 150 })
    .withMessage("el nombre del lugar debe tener entre 5 y 150 caracteres"),
  // city: obligatoria, de 2 a 50 caracteres
  body("location.city")
    .notEmpty()
    .withMessage("La ciudad es obligatoria")
    .isLength({ min: 2, max: 50 })
    .withMessage("el nombre del lugar debe tener entre 2 y 50 caracteres"),
];

// validaciones para actualizar un evento
// todos los campos son opcionales, solo se validan los que el cliente envia
export const updateEventValidations = [
  // title: mismas reglas que al crear, pero opcional
  body("title")
    .optional()
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres")
    .custom(async (title) => {
      // busca si ya existe un evento con ese titulo
      const existingEvent = await EventModel.findOne({ title });
      if (existingEvent) {
        throw new Error("Ya existe un evento con este título");
      }
      return true;
    }),
  // description: mismas reglas que al crear, pero opcional
  body("description")
    .optional()
    .isLength({ min: 20 })
    .withMessage("La descripción debe tener al menos 20 caracteres")
    .isLength({ min: 20 })
    .withMessage("La descripción debe tener al menos 20 caracteres"),
  // fechas: si se envian, deben tener formato de fecha
  // que endDate sea posterior a startDate se controla en el controlador
  body("startDate")
    .optional()
    .isDate()
    .withMessage("La fecha de inicio debe ser una fecha válida"),
  body("endDate")
    .optional()
    .isDate()
    .withMessage("La fecha de finalización debe ser una fecha válida"),
  // capacity: si se envia, debe ser un entero de 1 o mas
  body("capacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La capacidad debe ser un número entero mayor o igual a 1"),
  // price: si se envia, debe ser un numero
  body("price")
    .optional()
    .isNumeric({ min: 0 })
    .withMessage("El precio debe ser un número mayor o igual a 0"),
  // status: si se envia, solo acepta uno de los tres estados
  body("status")
    .optional()
    .isIn(["scheduled", "cancelled", "finished"])
    .withMessage("El estado debe ser 'scheduled', 'cancelled' o 'finished'"),
  // categories: si se envia, debe ser un array de ids de categorias que existan
  body("categories")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Debe haber al menos una categoría")
    .custom(async (categories) => {
      // recorre cada categoria enviada
      for (const category of categories) {
        // cada elemento debe ser un texto no vacio
        if (!category || typeof category !== "string") {
          throw new Error("Cada categoría debe ser un ID de Mongo válido");
        }

        // findById busca la categoria por id, devuelve null si no existe
        const exsitCategoty = await CategoryModel.findById(category);

        if (!exsitCategoty) {
          throw new Error("no se encontro la categoria con el ID", category);
        }
      }
      return true;
    }),
  // datos del lugar: si se envian, deben cumplir el largo indicado
  body("location.venue")
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage("el nombre del lugar debe tener entre 3 y 100 caracteres"),
  body("location.address")
    .optional()
    .isLength({ min: 5, max: 150 })
    .withMessage("el nombre del lugar debe tener entre 5 y 150 caracteres"),
  body("location.city")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("el nombre del lugar debe tener entre 2 y 50 caracteres"),
];
