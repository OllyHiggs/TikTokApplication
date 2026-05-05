(function () {
  const LOG_URL = 'https://script.google.com/macros/s/AKfycby6VMGNMUGCrSTrSmoFNmLTVzqaoILfw60Ami7oLEYwhETiuBq9RubKVXpgXHt6EXug/exec';
  const ref = new URLSearchParams(window.location.search).get('ref') || '';

  fetch('https://ipapi.co/json/')
    .then(function (r) { return r.json(); })
    .then(function (geo) {
      var p = new URLSearchParams({
        t:       new Date().toISOString(),
        ref:     ref,
        city:    geo.city         || '',
        region:  geo.region       || '',
        country: geo.country_name || ''
      });
      fetch(LOG_URL + '?' + p.toString()).catch(function () {});
    })
    .catch(function () {
      // Geolocation unavailable — log visit with timestamp only
      var p = new URLSearchParams({ t: new Date().toISOString(), ref: ref });
      fetch(LOG_URL + '?' + p.toString()).catch(function () {});
    });
})();
