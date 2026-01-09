// AI Prospector - Deno Server
// Watches status.json and streams updates to browser via SSE

// Pure: Read status.json from root
async function readStatus () {
  try {
    var content = await Deno.readTextFile('./status.json')
    return JSON.parse(content)
  } catch (err) {
    return null
  }
}

// Side effect: Write status.json
async function writeStatus (status) {
  var content = JSON.stringify(status, null, 2)
  await Deno.writeTextFile('./status.json', content)
}

// Side effect: Toggle prospect contacted status
async function toggleContacted (prospectId) {
  var status = await readStatus()
  if (!status) return { error: 'No status file' }

  var prospect = status.prospects.find(p => p.id === prospectId)
  if (!prospect) return { error: 'Prospect not found' }

  if (prospect.status === 'contacted') {
    // Toggle back to complete
    prospect.status = 'complete'
    delete prospect.contacted_at

    status.activity.push({
      timestamp: new Date().toISOString(),
      event: 'prospect_unmarked',
      name: prospect.name
    })
  } else {
    // Mark as contacted
    prospect.status = 'contacted'
    prospect.contacted_at = new Date().toISOString()

    status.activity.push({
      timestamp: new Date().toISOString(),
      event: 'prospect_contacted',
      name: prospect.name
    })
  }

  await writeStatus(status)
  return { success: true, prospect }
}

// Side effect: Handle SSE connection
async function handleSSE (req) {
  var closed = false

  var body = new ReadableStream({
    async start (controller) {
      var encoder = new TextEncoder()

      // Send initial state
      var status = await readStatus()

      if (status) {
        // Send status (prospects, searches, phase)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', data: status })}\n\n`))

        // Send activity separately for the feed
        if (status.activity && status.activity.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'activity', data: status.activity })}\n\n`))
        }
      } else {
        // No status file yet - send empty state
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          data: { phase: 'idle', prospects: [], searches: [], activity: [] }
        })}\n\n`))
      }

      // Poll for changes every 2 seconds
      var lastJson = JSON.stringify(status)

      while (!closed) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        if (closed) break

        try {
          var newStatus = await readStatus()
          if (newStatus) {
            var newJson = JSON.stringify(newStatus)
            if (newJson !== lastJson) {
              lastJson = newJson
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', data: newStatus })}\n\n`))

              // Send latest activity
              if (newStatus.activity && newStatus.activity.length > 0) {
                var latest = newStatus.activity[newStatus.activity.length - 1]
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'activity', data: latest })}\n\n`))
              }
            }
          }
        } catch (err) {
          // Stream likely closed, stop polling
          closed = true
          break
        }
      }
    },
    cancel () {
      closed = true
    }
  })

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// Side effect: HTTP request handler
async function handler (req) {
  var url = new URL(req.url)

  // API: Toggle prospect contacted status
  if (url.pathname.startsWith('/api/contact/') && req.method === 'POST') {
    var prospectId = url.pathname.replace('/api/contact/', '')
    var result = await toggleContacted(prospectId)
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // SSE endpoint
  if (url.pathname === '/events') {
    return handleSSE(req)
  }

  // Serve static files
  if (url.pathname === '/' || url.pathname === '/index.html') {
    var html = await Deno.readTextFile('./public/index.html')
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  if (url.pathname === '/style.css') {
    var css = await Deno.readTextFile('./public/style.css')
    return new Response(css, {
      headers: { 'Content-Type': 'text/css' }
    })
  }

  if (url.pathname === '/app.js') {
    var js = await Deno.readTextFile('./public/app.js')
    return new Response(js, {
      headers: { 'Content-Type': 'application/javascript' }
    })
  }

  if (url.pathname === '/linkedin.svg') {
    var svg = await Deno.readTextFile('./public/linkedin.svg')
    return new Response(svg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    })
  }

  // Ignore favicon requests
  if (url.pathname === '/favicon.ico') {
    return new Response(null, { status: 204 })
  }

  return new Response('Not found', { status: 404 })
}

// Start server
console.log('AI Prospector dashboard running at http://localhost:8084')
Deno.serve({ port: 8084 }, handler)
