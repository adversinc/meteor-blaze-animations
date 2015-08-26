Anim = {
  insertedClass: "inserted",
  insertingClass: "inserting",
  removingClass: "removing"
};

var getTplName = function(tpl) {
  return tpl.viewName.slice(-(tpl.viewName.length - "Template.".length));
};

var getClassIn = function(attrs, element, tpl) {
  return _.isFunction(attrs.in) ? attrs.in.apply(this, [element, tpl]) : attrs.in;
};

var getClassOut = function(attrs, element, tpl) {
  return _.isFunction(attrs.out) ? attrs.out.apply(this, [element, tpl]) : attrs.out;
};

var animateIn = function(attrs, element, tpl) {
  if (!attrs || !element) return;
  var el = _.clone(element.get(0));
  var classIn = getClassIn(attrs, el, tpl);
  // Hide the element before inserting to avoid a flickering when applying the "in" class
  element._opacity = element._opacity || element.css("opacity") || 0;
  element._transition = element._transition || element.css("transition") || "none";
  element.css({ opacity: 0, transition: "none" });
  element.removeClass(classIn);
  var delayIn = attrs.delayIn || 0;
  Tracker.afterFlush(function() {
    setTimeout(function() {
      element.css({ opacity: element._opacity, transition: element._transition }).addClass(classIn).addClass(Anim.insertingClass);
    }, delayIn);
  });
};

var animateOut = function(attrs, element, tpl) {
  if (!attrs || !element) return;
  var el = _.clone(element.get(0));
  var classIn = getClassIn(attrs, el, tpl);
  var classOut = getClassOut(attrs, el, tpl);
  var delayOut = attrs.delayOut || 0;
  element.removeClass(classIn).addClass(Anim.removingClass);
  setTimeout(function() {
    element.addClass(classOut);
  }, delayOut);
};

var callbacks = {};
var attachAnimationCallbacks = function(attrs, selector, tpl) {

  var s = _.compact([attrs.container, selector]).join(" ");
  if (callbacks[s]) return;
  callbacks[s] = true;

  $(s).onAnimationEnd(function() {

    var element = $(this);

    // Insert
    if (element.hasClass(Anim.insertingClass)) {
      element.removeClass(Anim.insertingClass).addClass(Anim.insertedClass);
      attrs.inCallback && attrs.inCallback.call(this);
    }

    // Remove
    if (element.hasClass(Anim.removingClass)) {
      attrs.outCallback && attrs.outCallback.call(this);
      element.remove();
    }

  });

};

var animateInitialElements = function(tplName, animations) {
  if (!tplName || !animations) return;
  _.each(animations, function(attrs, selector) {
    if (!attrs.animateInitial) return;
    Template[tplName].onRendered(function() {
      attachAnimationCallbacks(attrs, selector, this);
      var animateInitialDelay = attrs.animateInitialDelay || 0;
      $(selector, attrs.container).each(function(i) {
        var element = $(this);
        var animateInitialStep = attrs.animateInitialStep * i || 0;
        var delay = animateInitialDelay + animateInitialStep;
        element._opacity = element.css("opacity");
        element._transition = element.css("transition");
        element.css({ opacity: 0, transition: "none" });
        setTimeout(function() {
          animateIn(attrs, element);
        }, delay);
      });
    });
  });
};

var getUiHooks = function(animations) {
  var hooks = {};
  _.each(animations, function(attrs, selector) {
    hooks[selector] = {
      container: attrs.container,
      insert: function(node, next, tpl) {
        console.log('Animating element in.');
        var $element = $(node);
        if (next) {
          $element.insertBefore(next);
        } else {
          $(attrs.container).append(node);
        }
        animateIn(attrs, $element, tpl);
        attachAnimationCallbacks(attrs, selector, tpl);
      },
      remove: function(node, tpl) {
        var element = $(node);
        if (!attrs.out) return element.remove();
        animateOut(attrs, element, tpl);
        attachAnimationCallbacks(attrs, selector, tpl);
      }
    };
  });
  return hooks;
};

Template.prototype.animations = function(animations) {
  var tplName = getTplName(this);
  var hooks = getUiHooks(animations);
  Template[tplName].uihooks(hooks);
  animateInitialElements(tplName, animations);
};
