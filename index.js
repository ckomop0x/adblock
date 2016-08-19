'use strict';

var Promise = require('lie');

var HOST_NAME = location.hostname;
var PLATE_COOKIE = 'adblock_plate_closed';

// default settings
var PROTOCOL = window.location.protocol + '//';

// dev settings
var devCookie = 'dev_c_adbl_sid';
var devUrl = 'noadblock.rambler.ru';

// prod settings
var prodCookie = 'c_adbl_sid';
var prodUrl = 'adblock.rambler.ru';

var SETTINGS_DEV = new Settings(devCookie,devUrl,HOST_NAME);
var SETTINGS_PROD = new Settings(prodCookie,prodUrl,HOST_NAME);

/**
 * return show or hide ad and plate
 */
function init(debug, customSettings) {
  if(customSettings) {
    changeSettings(customSettings);
  }

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
 *  Settings constructor
 */

function Settings(cookie,url,host) {
  // main methods
  this.protocol = PROTOCOL;
  this.createHash = '/createsid';
  this.checkHash = '/checksid';
  this.verifyHash = '/verify?content=';
  this.url = url;
  this.host = host;
  this.cookie = cookie;
  this.createUrl = this.protocol + this.url + this.createHash;
  this.checkUrl = this.protocol + this.url + this.checkHash;
  this.verifyUrl = this.protocol + this.url + this.verifyHash + host;
}


/**
 *  Change settings to custom
 */
function changeSettings(customSettings) {
  if(customSettings.devUrl) {
    SETTINGS_DEV = new Settings(
      devCookie,
      customSettings.devUrl,
      HOST_NAME);
    console.log('Custom development settings used');
  } else {
    console.log('Default development settings');
  }
  if(customSettings.prodUrl) {
    SETTINGS_PROD = new Settings(
      prodCookie,
      customSettings.prodUrl,
      HOST_NAME);
    console.log('Custom production settings used');
  } else {
    console.log('Default production settings');
  }
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
