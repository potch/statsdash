$(function() {

  "use strict";

  // TODO: Config model
  var cfg = window.AppConfig;

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
      return $.param(this.attributes, true);
    }
  });

  /* 
   * Graph Collection
   */
  window.GraphList = Backbone.Collection.extend({
    model: Graph,
    localStorage: new Store('graphs')
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
      'dblclick img': 'edit',
      'click button': 'doneEdit',
      'keydown': 'catchKeys'
    },
    updateImage: function() {
      var dimensions = {
        width: ~~($('body').width() / 2),
        height: ~~($('body').height() / 2 - 20),
        t: Math.random()
      };
      var computedSrc = cfg.srcBase + this.model.toUrl() +
                        '&' + $.param(dimensions, true) +
                        '&' + $.param(cfg.globalGraphOptions, true);

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
   * The Application
   */
  window.AppView = Backbone.View.extend({
    el: $("#graph-app"),
    initialize: function() {
      var self = this;

      // Time selector
      this.timeView = new TimeView();
      this.timeView.bind('change', this.render, this);

      // The graphs
      this.model.bind('add', this.addOne, this);
      this.model.bind('reset', this.addAll, this);
      this.model.bind('all', this.render, this);
      this.model.fetch();
      if (!this.model.length) {
        _.each(cfg.defaultGraphs, function(g) {
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

      // Handle window keydown events
      $(window).keydown(function(e) {
        switch (e.which) {
          case 76: // l
            cfg.globalOptions.hideLegend = !cfg.globalOptions.hideLegend;
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

});
