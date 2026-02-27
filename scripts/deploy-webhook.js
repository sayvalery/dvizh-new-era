#!/usr/bin/env node
// Deploy webhook server — triggers safe build, serves build status.
// Port 3099, localhost only. Called by CMS deploy button.

const http = require('http')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const PORT = 3099
const ROOT = path.resolve(__dirname, '..')
const SCRIPT = path.join(__dirname, 'build-site.sh')
const STATUS_FILE = path.join(ROOT, 'logs', 'build-status.json')

let isBuilding = false

function readStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'))
  } catch {
    return { status: 'idle', steps: {} }
  }
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

const server = http.createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }

  // GET /build-status — return current status
  if (req.method === 'GET' && req.url === '/build-status') {
    res.writeHead(200, corsHeaders())
    res.end(JSON.stringify(readStatus()))
    return
  }

  // POST /deploy — trigger build
  if (req.method === 'POST' && req.url === '/deploy') {
    if (isBuilding) {
      res.writeHead(409, corsHeaders())
      res.end(JSON.stringify({ ok: false, error: 'Build already in progress' }))
      return
    }

    const buildId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)
    console.log(`[${new Date().toISOString()}] Deploy triggered (${buildId})`)

    isBuilding = true
    res.writeHead(200, corsHeaders())
    res.end(JSON.stringify({ ok: true, build_id: buildId }))

    exec(`bash ${SCRIPT}`, { cwd: ROOT, timeout: 300_000 }, (err, stdout, stderr) => {
      isBuilding = false
      if (err) {
        console.error(`[deploy] FAILED: ${err.message}`)
        if (stderr) console.error(stderr)
      } else {
        console.log(`[deploy] SUCCESS`)
      }
      if (stdout) console.log(stdout)
    })
    return
  }

  res.writeHead(404, corsHeaders())
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Deploy webhook listening on http://127.0.0.1:${PORT}`)
  console.log(`  POST /deploy     — trigger build`)
  console.log(`  GET  /build-status — current status`)
})
