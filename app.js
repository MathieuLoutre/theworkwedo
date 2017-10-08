const htmlStandards = require('reshape-standard')
const cssStandards = require('spike-css-standards')
const jsStandards = require('spike-js-standards')
const pageId = require('spike-page-id')
const env = process.env.NODE_ENV

const sugarss = require('sugarss')
const Contentful = require('spike-contentful')
const marked = require('marked')
const slug = require('slug')

marked.setOptions({
  smartypants: true
})

let locals = {
  md: marked, 
  slug: slug,
  toMs: (time = '') => {
    const parts = time.split(':')
    const minutes = parseInt(parts[0] || 0, 10)
    const seconds = parseInt(parts[1] || 0, 10)

    return (minutes * 60) + seconds
  }
}

module.exports = {
  devtool: 'source-map',
  ignore: ['**/layout.html', '**/_*', '**/.*', 'readme.md', 'yarn.lock'],
  plugins: [
    new Contentful({
      addDataTo: locals,
      accessToken: '731ddde455ec71ea16e6f8d9b48478cda9e6cf1f4ac483d68ef4df23f5d8045a',
      spaceId: 'kqxvay8hhyc8',
      contentTypes: [
        {
          name: 'podcasts',
          id: 'podcast',
          filters: {
            order: 'fields.number'
          },
          template: {
            path: 'views/podcast.html',
            output: (podcast) => `podcasts/${podcast.fields.number}-${slug(podcast.fields.guestName).toLowerCase()}.html`
          }
        },
        {
          name: 'notes',
          id: 'notes'
        }
      ]
    })
  ],
  reshape: htmlStandards({
    locals: (ctx) => Object.assign({ pageId: pageId(ctx) }, locals),
    minify: env === 'production'
  }),
  postcss: cssStandards({
    parser: sugarss,
    minify: env === 'production',
    warnForDuplicates: env !== 'production'
  }),
  babel: jsStandards()
}
