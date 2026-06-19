# App

Здесь я вам помогу установить этот проект на ваш пк для разработки. Основная команда это npm install оно установит все что нужно из файла package.json. Что бы у вас это получилось нужно сменить статус получения пакетов в powershell. 

Для этого сперва откройте сам Powershell и впишите Get-ExecutionPolicy если у вас там стоит значение блокирования, то смените его на удаленный доступ. Путем прописывания команды Set-ExecutionPolicy RemoteSigned
Это позволит устанавливать и работать с проектом через сам терминал

## Рекомендуемая настройка IDE

[VS Code](https://code.visualstudio.com/) + [Vue (официальный)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (и отключить Vetur).

## Рекомендуемая настройка браузера

- Браузеры на базе Chromium (Chrome, Edge, Brave и т.д.):
 - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
 - [Включить форматирование пользовательских объектов в Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
 - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
 - [Включить средство форматирования пользовательских объектов в Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Настроить конфигурацию

Смотрите [Ссылку на конфигурацию Vite](https://vite.dev/config/).

## Настройка проекта

``
npm install
```

### Компиляция и горячая перезагрузка для разработки

``sh
npm run dev - для запуска сайта
Q + Enter - для выключения локального сервера сайта
```

## Важная ссылка для понимания кода 
- https://sequelize.org/docs/v7/databases/mysql/ - Документация на синтаксис Sequelize для языка бд MySql
- https://axios-http.com/docs/intro - Документация библиотеки Axios
- https://pinia.vuejs.org/introduction.html - Документация библиотеки Pinia