// middleware/check-auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // 'Bearer TOKEN' -> extraemos solo el TOKEN
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adjuntamos la información del usuario al objeto 'req'
    // para que las siguientes rutas puedan usarla
    req.userData = { userId: decodedToken.userId, email: decodedToken.email, rol: decodedToken.rol };
    
    next(); // Si el token es válido, continuamos a la siguiente función (la ruta)
  } catch (error) {
    res.status(401).json({ message: 'Autenticación fallida' });
  }
};

// 1656c392-2250-4393-8a42-83d40d809828// 