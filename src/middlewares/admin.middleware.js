//adminMiddleware: verificar que el usuario autenticado sea admin.

export const adminMiddleware = (req, res, next) =>{
    
    //que hace req? req es un objeto que contiene toda la informacion de la peticion que se hizo al servidor, como los headers, el body, los params, etc. En este caso, req.user es el objeto que contiene la informacion del usuario logueado, que fue guardada en el authMiddleware.
    if (req.user.role !== "admin"){
        return res.status(403).json({message: "Usuario no autorizado, no es admin"});
    }
    next();
};