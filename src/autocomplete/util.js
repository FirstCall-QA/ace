"use strict";

exports.parForEach = function(array, fn, callback) {
    var completed = 0;
    var arLength = array.length;
    if (arLength === 0)
        callback();
    for (var i = 0; i < arLength; i++) {
        fn(array[i], function(result, err) {
            completed++;
            if (completed === arLength)
                callback(result, err);
        });
    }
};

var ID_REGEX = /[a-zA-Z_0-9\$\-\u00A2-\u2000\u2070-\uFFFF]/;

exports.retrievePrecedingIdentifier = function(text, pos, regex) {
    regex = regex || ID_REGEX;
    var buf = [];
    for (var i = pos-1; i >= 0; i--) {
        if (regex.test(text[i]))
            buf.push(text[i]);
        else
            break;
    }
    return buf.reverse().join("");
};

exports.retrieveFollowingIdentifier = function(text, pos, regex) {
    regex = regex || ID_REGEX;
    var buf = [];
    for (var i = pos; i < text.length; i++) {
        if (regex.test(text[i]))
            buf.push(text[i]);
        else
            break;
    }
    return buf;
};

const emptyPrefix = Symbol();

/**
 * @param editor
 * @return {string}
 */
exports.getCompletionPrefix = function (editor) {
    var pos = editor.getCursorPosition();
    var line = editor.session.getLine(pos.row);
    var prefix;
    editor.completers.forEach(function(completer) {
        if (prefix) {
            return;
        }

        if (completer.getCompletionPrefix != null) {
            prefix = completer.getCompletionPrefix(editor);
            if (prefix === "") {
                prefix = emptyPrefix;
            }
        }

        if (!prefix && completer.identifierRegexps) {
            completer.identifierRegexps.forEach(function(identifierRegex) {
                if (!prefix && identifierRegex)
                    prefix = this.retrievePrecedingIdentifier(line, pos.column, identifierRegex);
            }.bind(this));
        }
    }.bind(this));

    if (prefix === emptyPrefix) {
        return "";
    }

    return prefix || this.retrievePrecedingIdentifier(line, pos.column);
};

exports.triggerAutocomplete = function (editor) {
    var pos = editor.getCursorPosition();
    var line = editor.session.getLine(pos.row);
    var column = (pos.column === 0) ? 0 : pos.column - 1;
    var previousChar = line[column];
    return editor.completers.some((el) => {
        if (el.triggerCharacters && Array.isArray(el.triggerCharacters)) {
            return el.triggerCharacters.includes(previousChar);
        }
    });
};
