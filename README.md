# adblock

Модуль adblock имеет 2 метода:
|Метод|Аргументы|Ответ|Примечание|
|-----|---------|---------------|----------|
|init()|debug (тестовая среда – true или боевая среда - false); По умолчанию init()  : debug = false|Показ рекламы (true or false); Показ виджета восстановления подписки (true or false)|Метод вызывается при загрузке страницы и при подгрузке ajax запросов.|
|delaySubscribe()   |нет|true or false|Вызывается при закрытии виджета восстановления. Устанавливает cookie в зависимости от настройки периода.|

## Node.js

To install:

```sh
npm i git+ssh://git@github.com:arezakov/adblock.git --save
```

To use:

```js
'use strict';

import * as adblock from 'adblock';

const HOST_NAME = location.hostname;
const PLATE_TEXT = 'Воспользуйтесь опцией отключения рекламы. Если у&nbsp;вас она уже активирована, то нажмите сюда.';
const PLATE_URL = 'http://noadblock.rambler.ru/verify?content=' + HOST_NAME;
const DEBUG = document.body.getAttribute('data-prod');

export function init() {
  adblock.init(DEBUG)
    .then(start)
    .catch(start);

  function start(isAdblock) {
    if (isAdblock.ad) {
        console.log('Показать рекламу');
    }
    if (isAdblock.plate) {
      showPlate();
    }
  }
}

function showPlate() {
  var plate = document.createElement('div');
  plate.className = 'adblock-plate';
  plate.innerHTML = `<a href="${PLATE_URL}" class="adblock-plate__link">${PLATE_TEXT}</a><span class="adblock-plate__close"></span>`;
  document.body
    .insertBefore(plate, document.body.firstChild)
    .querySelector('.adblock-plate__close')
    .addEventListener('click', function(e) {
      adblock.delaySubscribe();
      this.parentNode.parentNode.removeChild(plate);
      e.preventDefault();
    });
}
```
