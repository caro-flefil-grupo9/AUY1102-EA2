// Consistencia
const value = 10;
const resultadoFinal = value * 2;

// Adaptabilidad (corregido tipo de dato)
const message: string = '10';

// Responsabilidad

class UserService {
  getUserData() {}

  sendEmail() {}
}

export { value, resultadoFinal, message, UserService };
