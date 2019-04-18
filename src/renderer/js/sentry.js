import Vue from 'vue'
import * as Sentry from '@sentry/browser'
import * as Integrations from '@sentry/integrations'

Sentry.init({
  dsn: 'https://59176e76a98a4240ae8be8ca45a3be54@sentry.io/1442029',
  integrations: [
    new Integrations.Vue({
      Vue,
      attachProps: true
    })
  ]
})
