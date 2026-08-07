import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // pino-http по умолчанию пишет в лог ВСЕ заголовки, а в Cookie лежит JWT.
  // Из-за этого в журнале оказывался не след действия, а рабочий ключ от
  // системы: у кого лог — тот заходит под любым пользователем, попавшим в
  // записи, и пароль ему не нужен. Вырезаем такие заголовки до записи.
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
      // Тело запроса pino-http не пишет, но если это когда-нибудь включат —
      // пароль и токен не должны утечь вместе с ним.
      'req.body.password',
      'req.body.token'
    ],
    censor: '[скрыто]'
  },
  formatters: {
    bindings: (bindings) => ({ pid: bindings.pid, host: bindings.hostname }),
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
      }
});

export default logger;