export const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
export const validatePhone = (phone) => /^[6-9]\d{9}$/.test(phone);
export const validatePincode = (pin) => /^\d{6}$/.test(pin);
export const validatePassword = (pass) => pass && pass.length >= 6;
export const validateRequired = (val) => val && val.toString().trim().length > 0;
