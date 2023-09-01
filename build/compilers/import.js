
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const fpath = {
  background: resolve(__dirname, '../../background/index.js'),
  compilers: resolve(__dirname, '../../background/index-compilers.js'),
  manifest: resolve(__dirname, '../../manifest.json'),
}

let compilers = `
importScripts('/vendor/showdown.min.js')
importScripts('/vendor/markdown-it.min.js')
importScripts('/vendor/remarkable.min.js')
importScripts('/vendor/commonmark.min.js')
importScripts('/background/compilers/showdown.js')
importScripts('/background/compilers/markdown-it.js')
importScripts('/background/compilers/remarkable.js')
importScripts('/background/compilers/commonmark.js')
`

// background/index-compilers.js
let sourceBackground = readFileSync(fpath.background, 'utf8')
let lines = sourceBackground.split('\n')
writeFileSync(
  fpath.compilers,
  lines.slice(0, 5).concat(compilers.split('\n')).concat(lines.slice(6)).join('\n'),
  'utf8'
)

// manifest.json
let sourceManifest = readFileSync(fpath.manifest, 'utf8')
writeFileSync(
  fpath.manifest,
  sourceManifest.replace('/background/index.js', '/background/index-compilers.js'),
  'utf8'
)
