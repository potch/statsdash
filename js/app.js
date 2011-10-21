$(function() {

  "use strict";

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

  // Create our global collection of Graphs.
  window.Graphs = new GraphList;

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
        height: ~~($('body').height() / 2),
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
   * The Application
   */
  window.AppView = Backbone.View.extend({
    el: $("#graph-app"),
    initialize: function() {
      Graphs.bind('add', this.addOne, this);
      Graphs.bind('reset', this.addAll, this);
      Graphs.bind('all', this.render, this);
      Graphs.fetch();
      if (!Graphs.length) {
        _.each(cfg.defaultGraphs, function(g) {
          Graphs.create(g);
        });
      }

      // Repaint every 15 seconds
      setInterval(this.render, 15000);

      // Repaint on window resize
      var timer = false,
          self = this;
      $(window).resize(function() {
        clearTimeout(timer);
        timer = setTimeout(self.render, 1000);
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
      Graphs.each(this.addOne, this);
    },
    render: function() {
      Graphs.each(function(g) {
        g.view.updateImage();
      });
    }
  });

  // Fire up the app.
  window.App = new AppView;

});