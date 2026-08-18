export const PASSWORD_MIN = 10;

export const PASSWORD_HINT =
  `Не короче ${PASSWORD_MIN} символов, обязательно буквы и цифры`;

export const validatePassword = (password) => {
  const value = String(password ?? '');

  if (value.length < PASSWORD_MIN) {
    return `Пароль должен быть не короче ${PASSWORD_MIN} символов`;
  }
  if (Buffer.byteLength(value, 'utf8') > 72) {
    return 'Пароль слишком длинный (максимум 72 байта)';
  }
  if (!/\p{L}/u.test(value) || !/\d/.test(value)) {
    return 'Пароль должен содержать буквы и цифры';
  }
  return null;
};
