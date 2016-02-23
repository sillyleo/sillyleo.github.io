/**
 * Created by Estevao on 15-07-2015.
 */
// Extension loading compatible with AMD and CommonJs
(function (extension) {
  'use strict';

  if (typeof showdown === 'object') {
    // global (browser or nodejs global)
    showdown.extension('footnotes', extension());
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define('footnotes', extension());
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    module.exports = extension();
  } else {
    // showdown was not found so we throw
    throw Error('Could not find showdown library');
  }

}(function() {

  /**
   * How do footnotes work? Mostly like reference-style links. There is a
   * marker in the text which gets converted to a superscript number in
   * the HTML rendering. There is a definition that can happen anywhere in
   * the document and which is appended at the end inside a list of
   * footnotes. A footnote looks like this:
   *
   * That's some text with a footnote.[^1]
   *
   * [^1]: And that's the footnote.
   *
   * Footnote definitions can be found anywhere in the document, but
   * footnotes will always be listed in the order they are linked to in
   * the text. Note that you cannot make two links to the same footnotes:
   * if you try the second footnote reference will be left as plain text.
   *
   * Each footnote must have a distinct name. That name will be used for
   * linking to and from footnote references, but has no effect on the
   * numbering of the footnotes. Names can be anything which is valid
   * within an id attribute in HTML.
   *
   * Footnotes can contain block-level elements, which means that you can
   * put multiple paragraphs, lists, blockquotes and so on in a footnote.
   * It works the same as for list items: just indent the following
   * paragraphs by four spaces in the footnote definition:
   *
   * That's some text with a footnote.[^1]
   *
   * [^1]:
   *     And that's the footnote.
   *
   *     That's the second paragraph.
   *
   *
   * Reading material:
   *
   *  - http://search.gmane.org/?query=footnote&author=&group=gmane.text.markdown.general&sort=relevance&DEFAULTOP=and&xP=Zfootnot&xFILTERS=Gtext.markdown.general---A
   *  - https://michelf.ca/projects/php-markdown/extra/#footnotes
   */
  var footnotes = [],
      footRefs = {},
      footMarkers = [],
      orphanedRefs = [];
  //
  var markSup  = '<sup id="fnref-%1"><a href="#fn-%1" rel="footnote" title="go to footnote">%1</a></sup>',
      footerLi = '<li id="fn-%1">%2</li>',
      anchor   = '<a href="#fnref-%1" class="footnote-backref" title="return to article">&#8617;</a>';



  function tokenizeFootnotes(text, converter, options) {
    // block execution of this extension a second time
    if (options.blockFootnotesExtension) {
      return text;
    }

    // reset holder vars
    footnotes = [];
    footRefs = {};
    footMarkers = [];
    orphanedRefs = [];

    // add sentinel ~0 to emulate \Z
    text += '~0';

    // we will use our own escape character (trema) to prevent clash with showdown main
    text = text.replace(/¨/g, '¨T');

    // first strip the reference footnotes
    // example:  [^1]: some awesome footnote
    // example2: [^fooobar]: this is valid too
    text = text.replace(/^ {0,3}\[\^(.+?)]:[ \t]?([\s\S]+?)(?=~0|\n {0,2}[\S]|^ {0,3}\[\^(.+?)]:)/gm, function(wholematch, ref, content) {
      ref = ref.replace(/\$/g, '¨D');
      footRefs[ref] = {
        content: content,
        wMatch:  wholematch
      };
      // we return a marker so we can bail with orphaned references
      return '¨F¨R¨S' + ref + '¨F¨R¨E';
    });


    // Search for footnote markers
    text = text.replace(/\[\^(.+?)]/g, function(wholematch, ref) {
      //escape dollar signs (magic in regex)
      ref = ref.replace(/\$/g, '¨D');

      footMarkers.push(ref);
      // we now return only the ref, but double escaped with "¨F¨M" to prevent it being
      // parsed as a link in case of something like this:
      // [^1] (http://some.url.that.is.inside.parenthesis.com)
      return "¨F¨M¨S" + ref + "¨F¨M¨E";
    });

    // Now we need to match the footnote markers with footnote references
    for (var i = 0; i < footMarkers.length; ++i) {
      var ref = footMarkers[i];

      if (!footRefs.hasOwnProperty(ref)) {
        orphanedRefs.push(ref);
      } else {
        footnotes.push({
          ref: ref,
          content: footRefs[ref].content
        });
        // since, according to spec, the relation is one-one
        // we unset the used reference
        delete(footRefs[ref]);
      }
    }

    // put back unused foot references
    for (var uRef in footRefs) {
      if (footRefs.hasOwnProperty(uRef)) {
        text = text.replace(new RegExp('¨F¨R¨S' + uRef + '¨F¨R¨E', 'g'), footRefs[uRef].wMatch);
      }
    }

    // Put back the unused markers
    for (var y = 0; y < orphanedRefs.length; ++y) {
      var oRef = orphanedRefs[y].replace(/¨D/g, '$');
      text = text.replace(new RegExp('¨F¨M¨S' + oRef + '¨F¨M¨E', 'g'), '[^' + oRef + ']');
    }

    // lastly we strip the footnote tokens
    text = text.replace(/¨F¨R¨S(.+?)¨F¨R¨E/g, '');

    // and remove the sentinel
    text = text.replace(/~0/, '');

    return text;
  }

  function replaceTokensWithHtml (text, converter, options) {
    if (options.blockFootnotesExtension) {
      return text;
    }
    // ignore if footnotes length is 0
    if (footnotes.length === 0) {
      return text;
    }

    // footer reference
    var tpl =
        '<div class="footnotes">\n' +
        '<hr>\n' +
        '<ol>\n';

    // we don't want the extension to be called recursively so we "disable"
    // it in subsequent calls
    converter.setOption('blockFootnotesExtension', true);

    for (var i = 0; i < footnotes.length; ++i) {
      var n = i + 1,
          ref = footnotes[i].ref,
          mk = markSup.replace(/%1/g, n.toString());

      // replace markers with markup
      text = text.replace('¨F¨M¨S' + ref + '¨F¨M¨E', mk);

      // parse footnotes md
      var ct = footnotes[i].content.replace(/^ {0,3}/gm, '').trim();
      ct = converter.makeHtml(ct + '\n' + anchor.replace(/%1/g, n.toString()));

      // replace them in footer
      tpl += footerLi.replace(/%1/g, n.toString()).replace('%2', ct) + '\n';
    }
    //and now we enable the extension again
    converter.setOption('blockFootnotesExtension', false);

    tpl += '</ol>\n';
    tpl += '</div>\n';

    // lastly we unescape trema
    text = text.replace(/¨T/g, '¨');

    // Add footnotes to the end of file and return
    return text + '\n' + tpl;
  }

  return [
    {
      type: 'lang',
      filter: tokenizeFootnotes
    },
    {
      type: 'output',
      filter: replaceTokensWithHtml
    }
  ];
}));