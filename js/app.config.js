$(function() {

  "use strict";

  window.AppConfig = {
    srcBase: 'https://graphite-phx.mozilla.org/render/?',
    globalGraphOptions: {
      hideLegend: false,
      from: '-24hour'
    },
    defaultGraphs: {
      'SUMO': [
        {
          target: ['sumSeries(stats.sumo.response.*)'],
          title: 'all responses'
        },
        {
          target: ['stats.timers.sumo.view.questions.views.questions.GET.mean'],
          title: '/questions mean time'
        },
        {
          target: ['stats.timers.sumo.view.landings.views.home.GET.mean'],
          title: '/home mean time'
        },
        {
          target: ['stats.sumo.questions.new',
                   'stats.sumo.questions.answer'],
          title: 'support forum activity'
        }
      ],
      'AMO': [
        {
          target: ['sumSeries(stats.addons.response.*)'],
          title: 'all responses'
        },
        {
          target: ['stats.timers.addons.view.addons.views.home.GET.lower',
                   'stats.timers.addons.view.addons.views.home.GET.mean',
                   'stats.timers.addons.view.addons.views.home.GET.upper_90'],
          title: 'homepage performance'
        },
        {
          target: ['stats.addons.response.500',
                   'stats.addons.response.4*'],
          title: 'errors'
        },
        {
          target: ['sumSeries(addons.celery.tasks.pending.*.*.*)',
                   'derivative(sumSeries(addons.celery.tasks.total.*.*.*))',
                   'derivative(sumSeries(addons.celery.tasks.failed.*.*.*))'],
          title: 'celery queues'
        }
      ]
    }
  };

});