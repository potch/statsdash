$(function() {

  "use strict";

  // TODO: Config model
  var cfg = window.AppConfig;

  var SITE_ID = 'AMO',
      TILES = cfg.defaultGraphs[SITE_ID].length;

  /*
   * Graph Model
   */
  window.Graph = Backbone.Model.extend({
    defaults: {},
    initialize: function() {
      if (!this.get('title')) {
        this.set({title: this.get('target')[0]});
      }
    },
    toUrl: function() {
      var attrs = {
        'title': this.attributes['title'],
        'target': this.attributes['target']
      };
      if (!!this.attributes['stacked'])
        attrs['areaMode'] = 'stacked';
      if (!!this.attributes['alpha'])
        attrs['areaAlpha'] = this.attributes['alpha'];
      return $.param(attrs, true);
    }
  });

  /*
   * Graph Collection
   */
  window.GraphList = Backbone.Collection.extend({
    model: Graph,
    localStorage: new Store('graphs:' + SITE_ID)
  });

  /*
   * Graph View
   * The DOM representaion of a Graph...
   */
  window.GraphView = Backbone.View.extend({
    tagName: 'section',
    template: _.template($('#graph-template').html()),
    initialize: function() {
      this.model.bind('change', this.updateImage, this);
      this.model.view = this;
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.updateImage();
      return this;
    },
    events: {
      'click img': 'edit',
      'click button': 'doneEdit',
      'keydown': 'catchKeys'
    },
    updateImage: function() {
      var dim = find_best_size(TILES, $('body').width(), $('body').height() - 40);
      var dimensions = {
        width: dim[0],
        height: dim[1],
        t: Math.random()
      };
      var computedSrc = cfg.srcBase + this.model.toUrl() +
                        '&' + $.param(dimensions, true) +
                        '&' + $.param(cfg.globalGraphOptions, true);
      $(this.el).width(dimensions.width).height(dimensions.height);
      $(this.el).find('img').css({
        width: dimensions.width + 'px',
        height: dimensions.height + 'px'
      }).attr('src', decodeURIComponent(computedSrc));
    },
    edit: function() {
      $(this.el).addClass('edit');
    },
    // Close the `"editing"` mode, saving changes to the todo.
    doneEdit: function(e) {
      e.preventDefault();
      var $el = $(this.el);
      this.model.save({
        title: $el.find('.title').val(),
        target: $el.find('.target').val().split(/\s*\|\s*/)
      });
      $(this.el).removeClass("edit");
    },
    catchKeys: function(e) {
      if ($(this.el).hasClass('edit'))
        e.stopPropagation();
    }
  });

  /*
   * Time Selector View
   */
  window.TimeView = Backbone.View.extend({
    el: $('#from-select'),
    initialize: function() {
      var view = this;
      cfg.globalGraphOptions.from = this.el.val();
      this.el.change(function() {
        cfg.globalGraphOptions.from = this.value;
        view.trigger('change');
      });
    }
  });

  /*
   * Legend toggle
   */

   window.LegendToggle = Backbone.View.extend({
       el: $('#show_legend'),
       initialize: function() {
           var view = this;
           cfg.globalGraphOptions.hideLegend = !this.el.is(':checked');
           this.el.change(function() {
               cfg.globalGraphOptions.hideLegend = !view.el.is(':checked');
               view.trigger('change');
           });
       }
   });

  /*
   * The Application
   */
  window.AppView = Backbone.View.extend({
    el: $("#graph-app"),
    initialize: function() {
      var self = this;

      // Time selector
      this.timeView = new TimeView();
      this.timeView.bind('change', this.render, this);

      // Legend Toggle
      this.legendToggle = new LegendToggle();
      this.legendToggle.bind('change', this.render, this);

      // The graphs
      this.model.bind('add', this.addOne, this);
      this.model.bind('reset', this.addAll, this);
      this.model.bind('all', this.render, this);
      this.model.fetch();
      if (!this.model.length) {
        _.each(cfg.defaultGraphs[SITE_ID], function(g) {
          self.model.create(g);
        });
      }

      function render() {
        self.render.apply(self);
      }

      // Repaint every 15 seconds
      setInterval(render, 15000);

      // Repaint on window resize
      var timer = false;
      $(window).resize(function() {
        clearTimeout(timer);
        timer = setTimeout(render, 1000);
      });

      $('#refresh').click(function(e) {
          e.preventDefault();
          App.render();
      });

      // Handle window keydown events
      $(window).keydown(function(e) {
        switch (e.which) {
          case 76: // l
            cfg.globalGraphOptions.hideLegend = !cfg.globalGraphOptions.hideLegend;
          case 82: // r
            App.render();
            break;
          case 72: // h
            $('legend').toggleClass("show");
            e.preventDefault();
            break;
          case 221:
            App.render();
            break;
        }
      });
    },
    addOne: function(graph) {
      var view = new GraphView({model: graph});
      this.el.append(view.render().el);
    },
    addAll: function() {
      this.model.each(this.addOne, this);
    },
    render: function() {
      this.model.each(function(g) {
        g.view.updateImage();
      });
    }
  });

  // Fire up the app.
  window.App = new AppView({
    model: new GraphList()
  })

  // Helper methods.
  function factor(n) {
    var fact = [[1, n]],
      check = 2,
      root = Math.sqrt(n);
    while (check <= root) {
      if (n % check == 0) {
        fact.push([check, n / check]);
      }
      check++;
    }
    return fact;
  }

  function find_closest(arr, width, height, aspect) {
    var size = [Infinity, 1];
    for (var i = 0; i < arr.length; i++) {
      var fact = arr[i];
      var w = width / fact[0],
          h = height / fact[1],
          wn = width / fact[1],
          hn = height / fact[0],
          current = Math.abs(size[0] / size[1] - aspect);
      if (Math.abs(w / h - aspect) < current) {
        size[0] = ~~w, size[1] = ~~h;
        current = Math.abs(w / h - aspect);
      }
      if (Math.abs(wn / hn - aspect) < current) {
        size[0] = ~~wn, size[1] = ~~hn;
      }
    }
    return size;
  }

  function find_best_size(n, width, height) {
    var f = factor(n),
        ASPECT = 21/9,  // Target aspect ratio.
        size = find_closest(f, width, height, ASPECT);
    if (f.length == 1 && n > 2) {  // A prime number!
      var g = factor(n + 1),  // Not prime.
          gsize = find_closest(g, width, height, ASPECT);
      if (Math.abs(gsize[0] / gsize[1] - ASPECT) <
          Math.abs(size[0] / size[1] - ASPECT)) {
        size = gsize;
      }
    }
    return size;
  }
});
