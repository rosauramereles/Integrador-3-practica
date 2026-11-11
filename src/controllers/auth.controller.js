// controladores de autenticación, sirven para manejar las rutas de autenticación, como login, register, etc.
import { matchedData } from "express-validator";
import { UserModel } from "../models/user.model.js";
import { comparePassword, hashPassword } from "../helpers/bcrypt.helper.js";
import { signToken } from "../helpers/jwt.helper.js";

//Registro de usuario con perfil embebido (publico)
export const register = async (req, res) => {
  try {
    const { username, email, password, role, profile } = matchedData(req, {
      locations: ["body"],
    }); //que hago en register? 1) validar los datos, 2) hashear la contraseña, 3) guardar el usuario en la base de datos, 4) devolver un mensaje de exito al cliente

    const hasedPassword = await hashPassword(password);
    // hashPassword: funcion que recibe una contraseña y devuelve la contraseña hasheada

    // await UserModel.create: crea un nuevo usuario en la base de datos con los datos recibidos y la contraseña hasheada
    await UserModel.create({
      username,
      email,
      password: hasedPassword,
      role,
      profile,
    });

    return res
      .status(201)
      .json({ message: "usuario registrado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error interno en el servidor" });
  }
};

// login con JWT enviado como cookie segura (publico)
export const login = async (req, res) => {
  try {
    const { username, password } = matchedData(req, { locations: ["body"] }); // login: recibe un username y password, valida los datos, busca el usuario en la base de datos, compara la contraseña recibida con la contraseña hasheada en la base de datos, si son iguales genera un token de acceso y lo devuelve al cliente como cookie segura

    const userExist = await UserModel.findOne({ username });
    //userExist: busca el usuario en la base de datos por username, si no existe devuelve un error 401

    if (!userExist) {
      return res.status(401).json({ msg: "credenciales ivalidas" });
    }

    const validPassword = await comparePassword(password, userExist.password);
    // validPassword: compara la contraseña recibida con la contraseña hasheada en la base de datos, devuelve true si son iguales, false si no lo son

    if (!validPassword) {
      return res.status(401).json({ msg: "credenciales ivalidas" });
    }

    // signToken: genera un token de acceso con los datos del usuario, el token tiene una duración de 1 hora
    const token = signToken({
      user_id: userExist._id,
      //user_id: id del usuario en la base de datos, se usa para identificar al usuario en las rutas protegidas
      username: userExist.username,
      //username: nombre de usuario, se usa para identificar al usuario en las rutas protegidas
      role: userExist.role,
      //role: rol del usuario, se usa para identificar al usuario en las rutas protegidas
    });

    // res.cookie: envia el token al cliente como cookie segura, httpOnly, secure y sameSite, con una duración de 1 hora
    res.cookie("token", token, {
      httpOnly: true,
      //httpOnly: true, evita que el token sea accesible desde el cliente, solo se puede acceder desde el servidor
      secure: process.env.NODE_ENV === "production",
      //secure: true, solo se envia el token si la conexión es segura (https), en desarrollo se puede enviar en http
      sameSite: "strict",
      //sameSite: evita que el token sea enviado en peticiones de terceros, solo se envia en peticiones del mismo dominio
      maxAge: 1000 * 60 * 60, // 1 hora
    });

    return res.status(201).json({ msg: "usuario logueado correctamente" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

// logout: elimina la cookie del token de acceso, para que el usuario no pueda acceder a las rutas protegidas, y devuelve un mensaje de éxito
export const logout = (req, res) => {
  res.clearCookie("token");
  return res.status(201).json({ msg: "logout exitoso" });
};

// getUserProfile: devuelve el perfil del usuario autenticado, solo puede ser accedido por el usuario logueado, y el middleware de autenticacion devuelve un error 401 si no esta logueado
export const getUserProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    //user_id: id del usuario en la base de datos, se usa para identificar al usuario en las rutas protegidas

    const userProfile = await UserModel.findOne({ _id: user_id });
    //userProfile: busca el usuario en la base de datos por id, si no existe devuelve null

    return res.status(201).json({ userProfile });
    //userProfile: devuelve el perfil del usuario logueado, con todos los datos del usuario, incluida la contraseña hasheada
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { user_id } = req.user;
    const dataValida = matchedData(req, { locations: ["body"] });
    //dataValida: datos validados del body, de los cuales solo se usa profile

    const userExist = await UserModel.findOne({ _id: user_id });
    //userExist: busca el usuario en la base de datos por id, si no existe devuelve null

    //newProfile: objeto con los datos del perfil del usuario, con los datos validados y los datos existentes, para no perder los datos que no se actualizan
    const newProfile = {
      ...userExist.profile,
      // por que los tres puntos? porque quiero mantener los datos existentes del perfil del usuario, y solo actualizar los datos que se reciben en la petición
      ...dataValida.profile,
    };

    //userUpdated: actualiza el perfil del usuario en la base de datos, y devuelve el usuario actualizado, con los datos validados y los datos existentes
    const userUpdated = await UserModel.findByIdAndUpdate(
      { _id: user_id },
      //_id: user_id, busca el usuario en la base de datos por id
      { $set: { profile: newProfile } },
      // $set: {profile: newProfile}, actualiza el perfil del usuario en la base de datos, con los datos validados y los datos existentes
      { returnDocument: "after" },
      //returnDocument: "after", devuelve el usuario actualizado, con los datos validados y los datos existentes
    );

    return res
      .status(200)
      .json({ msg: "El usuario fue editado exitozamente", userUpdated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Error interno en el servidor" });
  }
};
