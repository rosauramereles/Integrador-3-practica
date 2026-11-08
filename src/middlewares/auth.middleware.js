//authMiddleware: verificar el JWT desde las cookies y extraer el usuario.

import { verifyToken } from "../helpers/jwt.helper.js";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Usuario no autorizado, token no proporcionado" });
    }

    // playload: contiene la informacion del usuario logueado, que fue codificada en el token, como el id y el rol del usuario
    const playload = verifyToken(token);
    req.user = playload;
    // por que req.user = playload? porque queremos que el usuario logueado este disponible en todas las rutas que requieran autenticacion, para eso lo guardamos en req.user y asi podemos acceder a el desde cualquier ruta que requiera autenticacion

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalido o expirado",
    });
  }
};
