#!/usr/bin/env node
// Simple webhook server that runs build-site.sh on the host
// Runs on port 3099, called by CMS deploy button

const http = require('http')
const { exec } = require('child_process')
const path = require('path')

const PORT = 3099
const ROOT = path.resolve(__dirname, '..')
const SCRIPT = path.join(__dirname, 'build-site.sh')

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  console.log(`[${new Date().toISOString()}] Deploy triggered`)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true, message: 'Build started' }))

  exec(`bash ${SCRIPT}`, { cwd: ROOT, timeout: 300_000 }, (err, stdout, stderr) => {
    if (err) {
      console.error(`[deploy] Error: ${err.message}`)
      console.error(stderr)
    } else {
      console.log(`[deploy] Done`)
      console.log(stdout)
    }
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Deploy webhook listening on http://127.0.0.1:${PORT}`)
})
