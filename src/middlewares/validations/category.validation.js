// body: funcion de express-validator para validar los datos que llegan en el body de la peticion
import { body } from "express-validator";
// modelo de categorias, se usa para consultar si ya existe una categoria con el mismo nombre
import { CategoryModel } from "../../models/category.model.js";

// validaciones para crear una categoria
// cada withMessage define el mensaje de error de la validacion que esta justo antes
export const createCategoryValidations = [
  // name: obligatorio, de 2 a 30 caracteres y unico
  body("name")
    // notEmpty: el campo no puede estar vacio
    .notEmpty()
    .withMessage("El nombre de la categoria es obligatorio")
    // isLength: largo minimo y maximo permitido
    .isLength({ min: 2, max: 30 })
    .withMessage("el nombre de la categoria debe tener entre 2 a 30 caracteres")
    // bail: si alguna validacion anterior fallo, corta la cadena y no ejecuta las siguientes
    // asi no se consulta la base de datos con un nombre que ya es invalido
    .bail()
    // custom: validacion propia, si lanza un error el campo se marca como invalido
    .custom(async (name) => {
      // busca si ya existe una categoria con ese nombre
      const existCategory = await CategoryModel.findOne({ name });

      if (existCategory) {
        throw new Error("esta categoria ya esta creada");
      }
      return true;
    }),
  // description: opcional, pero si se envia no puede estar vacia ni superar los 200 caracteres
  body("description")
    // optional: si el campo no se envia, se saltan las demas validaciones
    .optional()
    .notEmpty()
    .withMessage("El nombre de la categoria es obligatorio")
    // sin min, solo se controla el largo maximo
    .isLength({ max: 200 })
    .withMessage("La descripcion no debe tener mas de 200 caracteres"),
];

// validaciones para actualizar una categoria
// todos los campos son opcionales, solo se validan los que el cliente envia
export const updateCategoryValidations = [
  // name: mismas reglas que al crear, pero opcional
  body("name")
    .optional()
    .notEmpty()
    .withMessage("El nombre de la categoria es obligatorio")
    .isLength({ min: 2, max: 30 })
    .withMessage("el nombre de la categoria debe tener entre 2 a 30 caracteres")
    .bail()
    // el segundo parametro da acceso a la peticion, de ahi se toma req.params.id
    .custom(async (name, { req }) => {
      // busca otra categoria con ese nombre
      // $ne significa "distinto de": excluye a la categoria que se esta editando
      // asi el cliente puede enviar el mismo nombre que ya tiene sin que de error
      const existCategory = await CategoryModel.findOne({
        name,
        _id: { $ne: req.params.id },
      });

      if (existCategory) {
        throw new Error("esta categoria ya esta creada");
      }
      return true;
    }),
  // description: mismas reglas que al crear, pero opcional
  body("description")
    .optional()
    .notEmpty()
    .withMessage("El nombre de la categoria es obligatorio")
    .isLength({ max: 200 })
    .withMessage("La descripcion no debe tener mas de 200 caracteres"),
];
