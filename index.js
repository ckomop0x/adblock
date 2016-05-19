'use strict';

var Promise = require('lie');

var HOST_NAME = location.hostname;
var PLATE_COOKIE = 'adblock_plate_closed';
var ADBLOCK_COOKIE = 'c_adbl_sid';
var SETTINGS_DEV = {
  cookie: 'dev_c_adbl_sid',
  createUrl: 'https://noadblock.rambler.ru/createsid',
  checkUrl: 'https://noadblock.rambler.ru/checksid',
  verifyUrl: 'https://noadblock.rambler.ru/verify?content=' + HOST_NAME,
};
var SETTINGS_PROD = {
  cookie: 'c_adbl_sid',
  createUrl: 'https://adblock.rambler.ru/createsid',
  checkUrl: 'https://adblock.rambler.ru/checksid',
  verifyUrl: 'https://adblock.rambler.ru/verify?content=' + HOST_NAME,
};

function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    '(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options) {
  var _options = options || {};
  var d = new Date();
  var _value = encodeURIComponent(value);
  var expires = _options.expires;
  var updatedCookie = name + '=' + _value;

  if (typeof expires === 'number' && expires) {
    d.setTime(d.getTime() + expires * 1000);
    expires = _options.expires = d;
  }
  if (expires && expires.toUTCString) {
    _options.expires = expires.toUTCString();
  }
  for (var propName in _options) {
    updatedCookie += '; ' + propName;
    var propValue = _options[propName];
    if (propValue !== true) {
      updatedCookie += '=' + propValue;
    }
  }
  document.cookie = updatedCookie;
}

function deleteCookie(_name, _domain) {
  var domain = _domain || '';
  setCookie(_name, '', {
    domain: domain,
    expires: -1
  });
}

function getUrlParam(name) {
  var search = window.location.search;
  search = search.match(new RegExp(name + '=([^&=]+)'));
  return search ? search[1] : '';
}

function isRamblerDomain() {
  return HOST_NAME.split('.').reverse()[1] === 'rambler';
}

function setLocalSID(SID, cookieName) {
  if (isRamblerDomain()) {
    setCookie(
      cookieName,
      SID,
      {
        path: '/',
        domain: '.rambler.ru',
        expires: 3600 * 24 * 365
      }
    );
  } else {
    localStorage.setItem(ADBLOCK_COOKIE, SID);
  }
}

function getLocalSID(cookieName) {
  return localStorage.getItem(cookieName) || getCookie(cookieName);
}

function removeLocalSID(cookieName) {
  deleteCookie(cookieName, '.rambler.ru');
  localStorage.removeItem(cookieName);
}

/**
 * return show or hide ad and plate
 */
function init(_debug) {
  var settings;
  var debug = _debug || false;
  var result = {};
  result.plate = !getCookie(PLATE_COOKIE);
  result.ad = true;

  // Настройки берем из window, если их нет, то берем локальные, в зависимости от окружения
  if (window.ramblerAdblockParams) {
    settings = window.ramblerAdblockParams;
    settings.cookie = settings.cookie || SETTINGS_PROD.cookie;
  } else {
    settings = debug ? SETTINGS_DEV : SETTINGS_PROD;
  }
  // Если есть get параметр adblock_sid, то записываем его в куки или локасторадж
  if (getUrlParam('adblock_sid')) {
    setLocalSID(getUrlParam('adblock_sid'), settings.cookie);
  }

  return new Promise(function(resolve, reject) {
    var SID = getLocalSID(settings.cookie);
    var request = new XMLHttpRequest();
    if (!SID) {
      resolve(result);
      return;
    }
    request.open('GET', settings.checkUrl + '?SID=' + SID, true);
    request.onload = function() {
      if (request.status === 200) {
        result.ad = false;
        result.plate = false;
        resolve(result);
        return;
      }
      if (request.status === 404) {
        removeLocalSID(settings.cookie);
      }
      resolve(result);
    };
    request.onerror = function() {
      reject(result);
    };
    request.send();
  });
}

/**
 * set plate cookie
 */
function delaySubscribe(_expires) {
  var expires = _expires || 3600 * 24;
  setCookie(PLATE_COOKIE, '1', {
    expires: expires,
    path: '/'
  });
}

module.exports = {
  init: init,
  delaySubscribe: delaySubscribe
};
