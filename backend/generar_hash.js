// backend/generar_hash.js
const bcrypt = require('bcryptjs');

// Elige la contraseña que quieres para tu cuenta de admin
const miContrasenaAdmin = 'adminKDS123!'; // <-- Cambia esto por la contraseña que desees

console.log(`Encriptando la contraseña: "${miContrasenaAdmin}"...`);

bcrypt.hash(miContrasenaAdmin, 10, (err, hash) => {
    if (err) {
        console.error('Error al generar el hash:', err);
    } else {
        console.log('\n¡Copia la siguiente línea completa! Este es tu hash:');
        console.log(hash);
    }
});
