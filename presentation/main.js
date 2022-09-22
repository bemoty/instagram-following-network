const d3 = require('d3')

const file = 'export.json'
const width = window.innerWidth
const height = window.innerHeight

/** @param {boolean} loading */
const doneLoading = () => {
  document.getElementById('loading').remove()
}

const setLoadingStatus = (num, status) => {
  document.querySelector('#loading .status').innerHTML = `Step ${num}: ${status}`
}

/**
 * Preparing the graph data is quite CPU intensive, so we do it in a web worker.
 */
const prepareData = (data, ignored) => {
  return new Promise((resolve) => {
    const worker = new Worker('loadDataWorker.js')
    worker.onmessage = (e) => {
      resolve(e.data)
    }
    worker.postMessage({ data, ignored })
  })
}

const generateChart = async (data, ignored) => {
  setLoadingStatus(1, 'Preparing data')
  const { nodes, links } = await prepareData(data, ignored)
  setLoadingStatus(2, 'Rendering chart')

  var circleObjects
  var linkObjects
  var focusedNode
  var rootNode
  var hoveredNode
  var nodeStack = []

  const setHoveredNode = (user) => {
    const output = d3.select('#node-hover-name')
    hoveredNode = user
    if (hoveredNode) {
      output.text(hoveredNode.name)
    } else {
      output.text('-')
    }
  }

  const setFocusedNode = (index, back) => {
    if (focusedNode && index === focusedNode.index) {
      return
    }
    if (!back && focusedNode) {
      nodeStack.push(focusedNode.index)
    }
    if (index != null) {
      focusedNode = {
        index,
        connections: links
          .filter((link) => link.source === index)
          .map((link) => link.target)
          .concat(
            links
              .filter((link) => link.target === index)
              .map((link) => link.source),
          ),
      }
      if (!rootNode) {
        rootNode = focusedNode
      }
      d3.select('#node-link').attr(
        'href',
        index != null ? `https://instagram.com/${nodes[index].name}` : '#',
      )
      d3.select('#node-link').text(nodes[index].name)
      reload()
      return
    }
    focusedNode = null
    d3.select('#node-link').text('-')
    reload()
  }

  d3.select('#node-back').on('click', () =>
    setFocusedNode(nodeStack.pop(), true),
  )
  const nodesCopy = nodes.map((node) => ({ ...node }))
  const linksCopy = links.map((link) => ({ ...link }))

  // Zoom handling
  const zoom = d3.zoom().on('zoom', handleZoom)
  var transform
  function handleZoom(e) {
    d3.select('svg g').attr('transform', (transform = e.transform))
  }
  d3.select('svg').call(zoom).call(zoom.transform, d3.zoomIdentity)
  d3.select('svg').on('pointermove', (e) => {
    const p = transform.invert(d3.pointer(e))
  })

  d3.select('#node-search-box').on('change', (event) => {
    const search = event.target.value
    const index = nodes.findIndex((usr) => usr.name === search)
    if (index == -1) {
      alert('User not found')
    } else {
      setFocusedNode(index)
    }
  })
  const notedAccounts = []
  d3.select('#node-remove-active').on('click', () => {
    notedAccounts.push(nodes[focusedNode.index].name)
    navigator.clipboard.writeText('"' + notedAccounts.join('","') + '"')
    setFocusedNode(nodeStack.pop(), true)
  })

  d3.forceSimulation(nodesCopy)
    .force('charge', d3.forceManyBody().strength(-250))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('link', d3.forceLink().links(linksCopy))
    .on('end', () => {
      reload()
      setFocusedNode(
        nodes.findIndex((usr) => usr.name === 'joshoty'),
        true,
      )
      doneLoading()
    })

  function updateLinks() {
    d3.select('#theg')
      .selectAll('line')
      .data(linksCopy)
      .join('line')
      .style('stroke', function (d) {
        if (!focusedNode) {
          return '#ccc'
        }
        if (
          d.source.index === focusedNode.index ||
          d.target.index === focusedNode.index
        ) {
          return '#ccc'
        }
      })
      .attr('x1', function (d) {
        return d.source.x
      })
      .attr('y1', function (d) {
        return d.source.y
      })
      .attr('x2', function (d) {
        return d.target.x
      })
      .attr('y2', function (d) {
        return d.target.y
      })
  }

  function updateNodes() {
    d3.select('#theg')
      .selectAll('circle')
      .data(nodesCopy)
      .join('circle')
      .attr('r', function (d) {
        if (focusedNode && focusedNode.index == d.index) {
          return 15
        }
        return 10
      })
      .style('fill', function (d) {
        if (d.name === 'joshoty') {
          return '#cc2e20' // i'm special!
        }
        if (rootNode && rootNode.connections.includes(d.index)) {
          return '#ff796e' // all nodes that are connected to the root node (me) are special
        }
        if (!focusedNode) {
          return '#2896d6'
        }
        if (d.index == focusedNode.index) {
          return '#fff'
        }
        return focusedNode.connections.includes(d.index) ? '#2896d6' : '#a0d7f7'
      })
      .attr('cx', function (d) {
        return d.x
      })
      .attr('cy', function (d) {
        return d.y
      })
      .on('click', function (d) {
        const user = d.target.__data__
        setFocusedNode(user.index)
      })
      .on('mouseover', function (d) {
        const user = d.target.__data__
        setHoveredNode(user)
      })
      .on('mouseout', function (d) {
        setHoveredNode(null)
      })
  }

  function reload() {
    updateLinks()
    updateNodes()
  }
}

;(async () => {
  if (!window.Worker) {
    alert('This browser does not support web workers. Cannot run this application')
    return
  }
  const data = await d3.json(file).then((data) => data)
  const ignored = await d3.json('ignored.json').then((data) => data)
  generateChart(data, ignored)
})()
