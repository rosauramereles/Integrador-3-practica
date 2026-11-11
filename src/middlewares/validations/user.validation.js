// body y param: funciones de express-validator para validar los datos del body y de los parametros de la url
import { body, param } from "express-validator";
// modelo de mongoose, se usa para consultar si un usuario, username o email ya existen
import { UserModel } from "../../models/user.model.js";

// validaciones para crear un usuario
// cada withMessage define el mensaje de error de la validacion que esta justo antes
export const createUserValidations = [
  // username: obligatorio, sin espacios en los extremos, de 3 a 20 caracteres, solo letras y numeros y unico
  body("username")
    // notEmpty: el campo no puede estar vacio
    .notEmpty()
    .withMessage("En campo username no debe estar vacio")
    // trim: sanitizador que elimina los espacios del principio y del final
    .trim()
    // isLength: largo minimo y maximo permitido
    .isLength({ min: 3, max: 20 })
    // isAlphanumeric: solo acepta letras y numeros
    .isAlphanumeric()
    .withMessage("El username debe contener letras y números")
    // custom: validacion propia, si lanza un error el campo se marca como invalido
    .custom(async (username) => {
      // busca si ya existe un usuario con ese username
      const existingUser = await UserModel.findOne({ username });
      if (existingUser) {
        throw new Error("El username ya esta en uso");
      }
      return true;
    }),
  // email: obligatorio, con formato de email y no registrado antes
  body("email")
    .notEmpty()
    .withMessage("En campo email no debe estar vacio")
    // isEmail: revisa que tenga formato de email, como nombre@dominio.com
    .isEmail()
    .withMessage("El email no tiene un formato valido")
    .custom(async (email) => {
      // busca si ya existe un usuario con ese email
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        throw new Error("El email ya esta reguistrado");
      }
      return true;
    }),
  // password: obligatoria, de al menos 8 caracteres, con mayuscula, minuscula y numero
  body("password")
    .notEmpty()
    .withMessage("En campo password no debe estar vacio")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    // matches: revisa que el texto cumpla una expresion regular
    // /[A-Z]/ exige al menos una letra mayuscula
    .matches(/[A-Z]/)
    .withMessage("Debe contener al menos una minuscula")
    // /[a-z]/ exige al menos una letra minuscula
    .matches(/[a-z]/)
    .withMessage("Debe contener al menos una mayúscula")
    // /[0-9]/ exige al menos un numero
    .matches(/[0-9]/)
    .withMessage("Debe contener al menos un numero"),
  // role: si no se envia usa "user", y solo se permite "admin" o "user"
  body("role")
    // default: asigna un valor cuando el campo no viene en la peticion
    .default("user")
    // isIn: el valor debe ser uno de la lista
    .isIn(["admin", "user"])
    .withMessage("El rol debe ser 'admin' o 'user'"),
  // "profile.firstName" es el campo firstName dentro del objeto profile
  body("profile.firstName")
    .notEmpty()
    .withMessage("En campo nombre no debe estar vacio")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    // isAlpha con "es-ES": solo letras del español, incluye tildes y ñ, no acepta espacios
    .isAlpha("es-ES")
    .withMessage("El nombre solo debe contener letras"),
  body("profile.lastName")
    .notEmpty()
    .withMessage("En campo apellido no debe estar vacio")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .isAlpha("es-ES")
    .withMessage("El apellido solo debe contener letras"),
  // birthDate: opcional, con formato AAAA-MM-DD y que no sea una fecha futura
  body("profile.birthDate")
    // optional: si el campo no se envia, se saltan las demas validaciones
    .optional()
    // isDate: strictMode exige que el texto coincida exactamente con el formato indicado
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("La fecha no es valida")
    .custom((birthDate) => {
      const fecha = new Date(birthDate);
      const hoy = new Date();

      // si la fecha de nacimiento es posterior a hoy, es invalida
      if (fecha > hoy) {
        throw new Error("La fecha no puede ser futura");
      }
      return true;
    }),
  // phone: opcional, solo numeros y de 8 a 15 digitos
  body("profile.phone")
    .optional()
    // isNumeric: solo acepta numeros
    .isNumeric()
    .withMessage("El teléfono solo puede contener números")
    .isLength({ min: 8, max: 15 })
    .withMessage("El teléfono debe tener entre 8 y 15 dígitos"),
];

// validaciones para actualizar un usuario
// todos los campos del body son opcionales, solo se validan los que el cliente envia
export const updateUserValidations = [
  // param("id"): toma el id de la url, como en /api/users/:id
  param("id")
    .notEmpty()
    .withMessage("se debe tener el id para actualizar el usuario")
    // isMongoId: revisa que el id tenga el formato de un id de mongodb
    .isMongoId()
    .withMessage("este no es un Id de mongoDB valido")
    .custom(async (id) => {
      // findById busca el usuario por id, devuelve null si no existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new Error("El usuario no existe");
      }
      return true;
    }),
  // username: mismas reglas que al crear, pero opcional
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .isAlphanumeric()
    .withMessage("El username debe contener letras y números")
    .custom(async (username) => {
      // busca si ya existe un usuario con ese username
      const existingUser = await UserModel.findOne({ username });
      if (existingUser) {
        throw new Error("El username ya esta en uso");
      }
      return true;
    }),
  // email: mismas reglas que al crear, pero opcional
  body("email")
    .optional()
    .isEmail()
    .withMessage("El email no tiene un formato valido")
    .custom(async (email) => {
      // busca si ya existe un usuario con ese email
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        throw new Error("El email ya esta reguistrado");
      }
      return true;
    }),
  // password: mismas reglas que al crear, pero opcional
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    // exige al menos una letra mayuscula
    .matches(/[A-Z]/)
    .withMessage("Debe contener al menos una minuscula")
    // exige al menos una letra minuscula
    .matches(/[a-z]/)
    .withMessage("Debe contener al menos una mayúscula")
    // exige al menos un numero
    .matches(/[0-9]/)
    .withMessage("Debe contener al menos un numero"),
  // role: opcional, solo "admin" o "user"
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("El rol debe ser 'admin' o 'user'"),
  // datos del perfil: mismas reglas que al crear, pero opcionales
  body("profile.firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El nombre debe tener entre 2 y 50 caracteres")
    .isAlpha("es-ES")
    .withMessage("El nombre solo debe contener letras"),
  body("profile.lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres")
    .isAlpha("es-ES")
    .withMessage("El apellido solo debe contener letras"),
  body("profile.birthDate")
    .optional()
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("La fecha no es valida")
    .custom((birthDate) => {
      const fecha = new Date(birthDate);
      const hoy = new Date();

      // si la fecha de nacimiento es posterior a hoy, es invalida
      if (fecha > hoy) {
        throw new Error("La fecha no puede ser futura");
      }
      return true;
    }),
  body("profile.phone")
    .optional()
    .isNumeric()
    .withMessage("El teléfono solo puede contener números")
    .isLength({ min: 8, max: 15 })
    .withMessage("El teléfono debe tener entre 8 y 15 dígitos"),
];

// validaciones para eliminar un usuario
export const deleteUserValidations = [
  // el id llega por la url y debe existir en la base de datos
  param("id")
    .notEmpty()
    .withMessage("se debe tener el id para actualizar el usuario")
    // isMongoId: revisa que el id tenga el formato de un id de mongodb
    .isMongoId()
    .withMessage("este no es un Id de mongoDB valido")
    .custom(async (id) => {
      // findById busca el usuario por id, devuelve null si no existe
      const existingUser = await UserModel.findById(id);
      if (!existingUser) {
        throw new Error("El usuario no existe");
      }
      return true;
    }),
];
