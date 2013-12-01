/*
 * textillate.js
 * http://jschr.github.com/textillate
 * MIT licensed
 *
 * Copyright (C) 2012-2013 Jordan Schroter
 */

(function ($) {
    'use strict';

    function isInEffect(effect) {
        return /In/.test(effect) || $.inArray(effect, $.fn.textillate.defaults.inEffects) >= 0;
    };

    function isOutEffect(effect) {
        return /Out/.test(effect) || $.inArray(effect, $.fn.textillate.defaults.outEffects) >= 0;
    };

    // custom get data api method
    function getData(node) {
        var attrs = node.attributes || [],
            data = {};

        if (!attrs.length) {
            return data;
        }

        $.each(attrs, function (i, attr) {
            if (/^data-in-*/.test(attr.nodeName)) {
                data.in = data.in || {};
                data.in[attr.nodeName.replace(/data-in-/, '')] = attr.nodeValue;
            } else if (/^data-out-*/.test(attr.nodeName)) {
                data.out = data.out || {};
                data.out[attr.nodeName.replace(/data-out-/, '')] = attr.nodeValue;
            } else if (/^data-*/.test(attr.nodeName)) {
                data[attr.nodeName] = attr.nodeValue;
            }
        });

        return data;
    }

    function shuffle(o) {
        for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    }

    function animate($c, effect, cb) {
        $c.addClass('animated ' + effect)
          .css('visibility', 'visible')
          .show();

        $c.one('animationend webkitAnimationEnd oAnimationEnd', function () {
            $c.removeClass('animated ' + effect);
            cb && cb();
        });
    }

    function animateChars($chars, options, cb) {
        var count = $chars.length;

        if (!count) {
            cb && cb();
            return;
        }

        if (options.shuffle) {
            shuffle($chars);
        }

        $chars.each(function (i) {
            var $this = $(this);

            function complete() {
                if (isInEffect(options.effect)) {
                    $this.css('visibility', 'visible');
                } else if (isOutEffect(options.effect)) {
                    $this.css('visibility', 'hidden');
                }

                count -= 1;
                if (!count && cb) cb();
            }

            var delay = options.sync ? options.delay : options.delay * i * options.delayScale;

            $this.text()
                ? setTimeout(function () { animate($this, options.effect, complete); }, delay)
                : complete();
        });
    };

    var Textillate = function (element, options) {
        var self = this,
            $element = $(element);

        self.init = function () {
            self.$texts = $element.find(options.selector);

            if (!self.$texts.length) {
                self.$texts = $('<ul class="texts"><li>' + $element.html() + '</li></ul>');
                $element.html(self.$texts);
            }

            self.$texts.hide();

            self.$current = $('<span>')
                .text(self.$texts.find(':first-child').html())
                .prependTo($element);

            if (isInEffect(options.effect)) {
                self.$current.css('visibility', 'hidden');
            } else if (isOutEffect(options.effect)) {
                self.$current.css('visibility', 'visible');
            }

            self.setOptions(options);

            setTimeout(function () {
                self.options.autoStart && self.start();
            }, self.options.initialDelay);
        };

        self.setOptions = function (o) {
            self.options = o;
        };

        self.triggerEvent = function (name) {
            var e = $.Event(name + '.tlt', { data: self });
            $element.trigger(e);
            return e;
        };

        self.in = function (index, cb) {
            index = index || 0;

            var $elem = self.$texts.find(':nth-child(' + (index + 1) + ')'),
                o = $.extend({}, self.options, getData($elem)),
                $chars;

            self.triggerEvent('inAnimationBegin');

            self.$current
                .text($elem.html())
                .lettering('words');

            self.$current.find('[class^="word"]')
                .css({
                    'display': 'inline-block',
                    // fix for poor ios performance
                    '-webkit-transform': 'translate3d(0,0,0)',
                    '-moz-transform': 'translate3d(0,0,0)',
                    '-o-transform': 'translate3d(0,0,0)',
                    'transform': 'translate3d(0,0,0)'
                })
                .each(function () { $(this).lettering(); });

            $chars = self.$current
                .find('[class^="char"]')
                .css('display', 'inline-block');

            if (isInEffect(o.in.effect)) {
                $chars.css('visibility', 'hidden');
            } else if (isOutEffect(o.in.effect)) {
                $chars.css('visibility', 'visible');
            }

            self.currentIndex = index;

            animateChars($chars, o.in, function () {
                self.triggerEvent('inAnimationEnd');

                if (o.in.callback) {
                    o.in.callback();
                }

                if (cb) {
                    cb(self);
                }
            });
        };

        self.out = function (cb) {
            var $elem = self.$texts.find(':nth-child(' + (self.currentIndex + 1) + ')'),
                $chars = self.$current.find('[class^="char"]'),
                o = $.extend({}, self.options, getData($elem));

            self.triggerEvent('outAnimationBegin');

            animateChars($chars, o.out, function () {
                self.triggerEvent('outAnimationEnd');

                if (o.out.callback) {
                    o.out.callback();
                }

                if (cb) {
                    cb(self);
                }
            });
        };

        self.start = function (index) {
            self.triggerEvent('start');

            (function run(i) {
                self.in(i, function () {
                    var length = self.$texts.children().length;
                    i = (i + 1) % length;
                    setTimeout(function () {
                        self.out(function () {
                            if (self.options.loop && i >= length) {
                                run(i);
                            } else {
                                self.triggerEvent('end');
                            }
                        });
                    }, self.options.minDisplayTime);

                });
            }(index || 0));
        };

        self.init();
    };

    $.fn.textillate = function (settings, args) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('textillate'),
                options = $.extend(true, {}, $.fn.textillate.defaults, getData(this), typeof settings == 'object' && settings);

            if (!data) {
                $this.data('textillate', new Textillate(this, options));
            } else if (typeof settings == 'string') {
                data[settings].apply(data, [].concat(args));
            } else {
                data.setOptions.call(data, options);
            }
        });
    };

    $.fn.textillate.defaults = {
        selector: '.texts',
        loop: false,
        minDisplayTime: 2000,
        initialDelay: 0,
        in: {
            effect: 'fadeInLeftBig',
            delayScale: 1.5,
            delay: 50,
            sync: false,
            shuffle: false,
            callback: function () { }
        },
        out: {
            effect: 'hinge',
            delayScale: 1.5,
            delay: 50,
            sync: false,
            shuffle: false,
            callback: function () { }
        },
        autoStart: true,
        inEffects: [],
        outEffects: ['hinge'],
        callback: function () { }
    };
}(jQuery));
