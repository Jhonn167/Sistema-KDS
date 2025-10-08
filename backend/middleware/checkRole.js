// backend/middleware/checkRole.js
const jwt = require('jsonwebtoken');

// Esta es una "función fábrica": crea una función de middleware personalizada
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificamos si el rol del usuario está en la lista de roles permitidos
      if (allowedRoles.includes(decodedToken.rol)) {
        req.userData = decodedToken; // Pasamos los datos del usuario a la siguiente función
        next();
      } else {
        res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
      }
    } catch (error) {
      res.status(401).json({ message: 'Autenticación fallida.' });
    }
  };
};

module.exports = checkRole;
