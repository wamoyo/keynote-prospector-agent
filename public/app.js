// AI Prospector - Client-side UI updates

var state = {
  phase: 'waiting',
  prospects: [],
  currentProspectId: null,
  total: 0,
  processed: 0,
  filters: {
    showIncomplete: true,
    showSkipped: true,
    showContacted: true
  }
}

// Pure: Format timestamp
function formatTime (timestamp) {
  var date = new Date(timestamp)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).replace(",", "") + " | " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// Pure: Create prospect card HTML
function createProspectCard (prospect) {
  var message = prospect.message || ''
  var linkedinUrl = prospect.linkedin_url || ''
  var eventUrl = prospect.event_url || ''
  var verifiedEvent = prospect.verified_event || ''
  var skipReason = prospect.skip_reason || ''

  // Build event button if we have a verified event
  var eventButton = ''
  if ((prospect.status === 'complete' || prospect.status === 'contacted') && verifiedEvent) {
    if (eventUrl) {
      eventButton = `<a href="${eventUrl}" target="_blank" class="event-btn" title="View event source">🔗 ${verifiedEvent}</a>`
    } else {
      eventButton = `<div class="event-btn no-link" title="No source link available">📌 ${verifiedEvent}</div>`
    }
  } else if (prospect.status === 'skipped') {
    eventButton = `<div class="event-btn skipped" title="${skipReason}">⏭️ Skipped</div>`
  }

  // Build LinkedIn button
  var linkedinButton = ''
  if (linkedinUrl) {
    linkedinButton = `<a href="${linkedinUrl}" target="_blank" class="linkedin-btn" title="Open LinkedIn profile"><img src="/linkedin.svg" class="btn-icon" alt="">LinkedIn</a>`
  }

  // Build copy button (only show if we have a message)
  var copyButton = ''
  if (message) {
    copyButton = `<button class="copy-btn" data-message="${message.replace(/"/g, '&quot;')}" title="Copy message">📋 Copy</button>`
  }

  // Build contact button (only for complete prospects)
  var contactButton = ''
  if (prospect.status === 'complete') {
    contactButton = `<button class="contact-btn" data-id="${prospect.id}" title="Mark as contacted">✅ Contacted</button>`
  } else if (prospect.status === 'contacted') {
    contactButton = `<div class="contacted-badge">✅ Contacted</div>`
  }

  return `
    <div class="prospect-card"
         id="prospect-${prospect.id}"
         data-status="${prospect.status}">
      <div class="prospect-info">
        <div class="prospect-name">${prospect.name}</div>
        <div class="prospect-company">${prospect.company}</div>
        <div class="prospect-title">${prospect.title || ''}</div>
      </div>
      <div class="card-buttons">
        ${eventButton}
        <div class="button-row">
          ${linkedinButton}
          ${copyButton}
        </div>
        ${contactButton}
      </div>
    </div>
  `
}

// Pure: Create activity item HTML
function createActivityItem (activity) {
  return `
    <div class="activity-item">
      <div class="activity-time">${formatTime(activity.timestamp)}</div>
      <div class="activity-message">${formatActivityMessage(activity)}</div>
    </div>
  `
}

// Pure: Format activity message based on event type
function formatActivityMessage (activity) {
  var name = activity.name || activity.prospect_id || 'Unknown'
  switch (activity.event) {
    case 'search_started':
      return `🔍 Searching: ${activity.query}`
    case 'prospects_found':
      return `✓ Found ${activity.count} prospects`
    case 'verifying_prospect':
      return `🔎 Verifying: ${name}`
    case 'researching_prospect':
      return `📋 Researching: ${name}`
    case 'research_complete':
      return `✅ ${name}: ${activity.verified_event || activity.details || 'Complete'}`
    case 'research_skipped':
      return `⏭️ ${name}: Skipped`
    case 'draft_ready':
      return `✉️ Draft ready for ${name}`
    case 'phase_change':
      return `⚡ Phase: ${activity.phase}`
    case 'prospect_contacted':
      return `📨 Contacted: ${name}`
    default:
      return activity.message || activity.details || activity.event || 'Activity'
  }
}

// Side effect: Update phase indicator
function updatePhase (phase) {
  state.phase = phase
  var phaseEl = document.getElementById('phase')
  if (phaseEl) {
    phaseEl.textContent = phase
  }
}

// Side effect: Update progress bar
function updateProgress () {
  var completed = state.prospects.filter(p =>
    p.status === 'complete' || p.status === 'drafted'
  ).length

  var needsResearch = state.prospects.filter(p =>
    p.status === 'needs_research' || p.status === 'queued'
  ).length

  var progress = state.total > 0 ? (completed / state.total) * 100 : 0

  var progressBar = document.getElementById('progress')
  if (progressBar) {
    progressBar.style.width = `${progress}%`
  }

  var statsText = document.getElementById('stats-text')
  if (statsText) {
    statsText.textContent = `${completed} complete, ${needsResearch} need research (${state.total} total)`
  }
}

// Pure: Filter prospects based on current filter state
function filterProspects (prospects) {
  return prospects.filter(function (p) {
    // Always show complete prospects
    if (p.status === 'complete') return true
    // Show contacted if filter enabled
    if (p.status === 'contacted') return state.filters.showContacted
    // Show skipped if filter enabled
    if (p.status === 'skipped') return state.filters.showSkipped
    // Show incomplete (needs_research, researching, queued) if filter enabled
    if (['needs_research', 'researching', 'queued'].includes(p.status)) {
      return state.filters.showIncomplete
    }
    return true
  })
}

// Side effect: Mark prospect as contacted via API
function markContacted (prospectId) {
  fetch('/api/contact/' + prospectId, { method: 'POST' })
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to mark contacted')
      return res.json()
    })
    .then(function (data) {
      console.log('Marked contacted:', prospectId)
    })
    .catch(function (err) {
      console.error('Error marking contacted:', err)
      alert('Failed to mark as contacted')
    })
}

// Side effect: Render all prospect cards
function renderProspects () {
  var grid = document.getElementById('prospects')
  if (!grid) return

  // Clear current highlight
  document.querySelectorAll('.prospect-card').forEach(card => {
    card.classList.remove('current')
  })

  // Filter and render cards
  var filtered = filterProspects(state.prospects)
  grid.innerHTML = filtered.map(createProspectCard).join('')

  // Add click handlers for copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var message = this.getAttribute('data-message')
      navigator.clipboard.writeText(message).then(() => {
        var originalText = this.textContent
        this.textContent = 'Copied!'
        setTimeout(() => {
          this.textContent = originalText
        }, 2000)
      })
    })
  })

  // Add click handlers for contact buttons
  document.querySelectorAll('.contact-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var id = this.getAttribute('data-id')
      this.textContent = '...'
      this.disabled = true
      markContacted(id)
    })
  })

  // Highlight current
  if (state.currentProspectId) {
    var currentCard = document.getElementById(`prospect-${state.currentProspectId}`)
    if (currentCard) {
      currentCard.classList.add('current')
      currentCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  updateProgress()
}

// Side effect: Add activity item to feed
function addActivity (activity) {
  var feed = document.getElementById('activity')
  if (!feed) return

  var item = document.createElement('div')
  item.innerHTML = createActivityItem(activity)

  // Prepend (newest first)
  feed.insertBefore(item.firstElementChild, feed.firstChild)

  // Limit to 50 items
  while (feed.children.length > 50) {
    feed.removeChild(feed.lastChild)
  }
}

// Side effect: Handle status update
function handleStatusUpdate (status) {
  console.log('Status update:', status)

  if (status.phase) {
    updatePhase(status.phase)
  }

  if (status.prospects) {
    state.prospects = status.prospects
    state.total = status.prospects_total || status.prospects.length
    state.currentProspectId = status.current_prospect_id
    renderProspects()
  }
}

// Side effect: Handle activity update
function handleActivityUpdate (activity) {
  console.log('Activity:', activity)
  addActivity(activity)
}

// Side effect: Connect to SSE stream
function connectToStream () {
  var eventSource = new EventSource('/events')

  eventSource.onmessage = function (event) {
    var data = JSON.parse(event.data)

    if (data.type === 'status') {
      handleStatusUpdate(data.data)
    } else if (data.type === 'activity') {
      // Handle both single activity and array
      if (Array.isArray(data.data)) {
        data.data.forEach(handleActivityUpdate)
      } else {
        handleActivityUpdate(data.data)
      }
    }
  }

  eventSource.onerror = function (error) {
    console.error('SSE error:', error)
    eventSource.close()

    // Retry after 5 seconds
    setTimeout(connectToStream, 5000)
  }
}

// Side effect: Setup filter toggle listeners
function setupFilters () {
  var incompleteToggle = document.getElementById('filter-incomplete')
  var skippedToggle = document.getElementById('filter-skipped')
  var contactedToggle = document.getElementById('filter-contacted')

  if (incompleteToggle) {
    incompleteToggle.addEventListener('change', function () {
      state.filters.showIncomplete = this.checked
      renderProspects()
    })
  }

  if (skippedToggle) {
    skippedToggle.addEventListener('change', function () {
      state.filters.showSkipped = this.checked
      renderProspects()
    })
  }

  if (contactedToggle) {
    contactedToggle.addEventListener('change', function () {
      state.filters.showContacted = this.checked
      renderProspects()
    })
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
  console.log('AI Prospector UI loaded')
  setupFilters()
  connectToStream()
})
