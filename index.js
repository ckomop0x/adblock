'use strict';

var Promise = require('lie');

var HOST_NAME = location.hostname;
var PLATE_COOKIE = 'adblock_plate_closed';

var SETTINGS_DEV = {
  cookie: 'dev_c_adbl_sid',
  createUrl: 'https://noadblock.rambler.ru/createsid',
  checkUrl: 'https://noadblock.rambler.ru/checksid',
  verifyUrl: 'http:s//noadblock.rambler.ru/verify?content=' + HOST_NAME,
};

var SETTINGS_PROD = {
  cookie: 'c_adbl_sid',
  createUrl: 'https://adblock.rambler.ru/createsid',
  checkUrl: 'https://adblock.rambler.ru/checksid',
  verifyUrl: 'https://adblock.rambler.ru/verify?content=' + HOST_NAME,
};

/**
 * return show or hide ad and plate
 */
function init(debug) {
  var settings = debug ? SETTINGS_DEV : SETTINGS_PROD;
  var adblockCookie = getCookie(settings.cookie);
  var result = {};
  result.plate = !getCookie(PLATE_COOKIE);

  return new Promise(function(resolve, reject) {
    var request = new XMLHttpRequest();
    if (!adblockCookie) {
      result.ad = true;
      resolve(result);
      return;
    }
    request.open('GET', settings.checkUrl + '?SID=' + adblockCookie, true);
    request.onload = function() {
      console.log(request.status);
      if (request.status === 200) {
        result.ad = false;
        result.plate = false;
        resolve(result);
        return;
      }
      if (request.status === 404) {
        deleteCookie(settings.cookie, '.rambler.ru');
      }
      result.ad = true;
      resolve(result);
    };
    request.onerror = function() {
      result.ad = true;
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

module.exports = {
  init: init,
  delaySubscribe: delaySubscribe
}
