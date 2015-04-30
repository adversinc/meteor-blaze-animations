var getTplName = function(tpl) {
  return tpl.viewName.slice(-(tpl.viewName.length - "Template.".length));
}

var animateIn = function(classIn, element) {
  if (!classIn || !element) return;
  // Hide the element before inserting to avoid a flickering when applying the "in" class
  element._opacity = element._opacity || element.css("opacity") || 0;
  element.css({ opacity: 0 });
  element.removeClass(classIn);
  Tracker.afterFlush(function() {
    element.css({ opacity: element._opacity }).addClass(classIn);
  });
}

var animateOut = function(classOut, element) {
  if (!classOut || !element) return;
  element.addClass(classOut);
  element.onAnimationEnd(function(animationName) {
    element.remove();
  });
}

var animateInitialElements = function(tplName, animations) {
  if (!tplName || !animations) return;
  _.each(animations, function(attrs, selector) {
    if (!attrs.animateInitial) return;
    Template[tplName].onRendered(function() {
      $(selector, attrs.container).each(function(i) {
        var element = $(this);
        var timeout = attrs.animateInitialStep * i || 0;
        element._opacity = element.css("opacity");
        element.css({ opacity: 0 });
        Meteor.setTimeout(function() {
          animateIn(attrs.in, element);
        }, timeout);
      });
    });
  });
}

var getUiHooks = function(animations) {
  var hooks = {};
  _.each(animations, function(attrs, selector) {
    hooks[selector] = {
      container: attrs.container,
      insert: function(node, next) {
        var element = $(node);
        element.insertBefore(next);
        animateIn(attrs.in, element);
      },
      remove: function(node) {
        var element = $(node);
        if (!attrs.out) return element.remove();
        element.removeClass(attrs.in);
        animateOut(attrs.out, element);
      }
    }
  });
  return hooks;
}

Template.prototype.animations = function(animations) {
  var tplName = getTplName(this);
  var hooks = getUiHooks(animations);
  Template[tplName].uihooks(hooks);
  animateInitialElements(tplName, animations);
};
