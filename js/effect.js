$(document).ready(function(){

// for article

var article      = {
  selector:             '.backdrop',
  parent:               '.big-bg',
  exclude:              [ 'rgb(0,0,0)', 'rgba(255,255,255)' ],
  normalizeTextColor:   false,
  normalizedTextColors:  {
    light:      "#fff",
    dark:       "#000"
  },
  lumaClasses:  {
    light:      "ab-light",
    dark:       "ab-dark"
  }
};
$.adaptiveBackground.run(article);

$.adaptiveBackground.run();


});