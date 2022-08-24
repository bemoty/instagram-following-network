import { select as d3Select, ValueFn as d3ValueFn } from 'd3-selection'
import {
  zoom as d3Zoom,
  zoomIdentity as d3ZoomIdentity,
  ZoomTransform as d3ZoomTransform,
  D3ZoomEvent as d3ZoomEvent,
} from 'd3-zoom'
import {
  forceSimulation as d3ForceSimulation,
  forceManyBody as d3ForceManyBody,
  forceLink as d3ForceLink,
  forceCenter as d3ForceCenter,
} from 'd3-force'
import { json as d3Json, pointer as d3Pointer } from 'd3'

const width = window.innerWidth
const height = window.innerHeight

const prepareData = (data: any, ignored: any) => {
  const allFollowings = data.flatMap((usr: any) => usr.followings)
  const nodes = [
    ...new Set(allFollowings.concat(data.map((usr: any) => usr.name))),
  ]
    .filter(
      (usr) => allFollowings.filter((name: any) => name === usr).length > 1, // remove users who are only followed once ...
    )
    .filter((usr) => !ignored.includes(usr))
  const links = []
  for (let i = 0; i < data.length; i++) {
    const source = nodes.indexOf(data[i].name)
    if (source === -1) {
      continue
    }
    for (let j = 0; j < data[i].followings.length; j++) {
      const target = nodes.indexOf(data[i].followings[j])
      if (target == -1) {
        continue
      }
      links.push({ source, target })
    }
  }
  return {
    nodes: nodes.map((name) => ({ name })),
    links,
  }
}

const generateChart = (data: any, ignored: any) => {
  const { nodes, links } = prepareData(data, ignored)

  var circleObjects
  var linkObjects
  var focusedNode: any
  var rootNode: any
  var hoveredNode
  var nodeStack: any = []

  const setHoveredNode = (user: any) => {
    const output = d3Select('#node-hover-name')
    hoveredNode = user
    if (hoveredNode) {
      output.text(hoveredNode.name)
    } else {
      output.text('-')
    }
  }

  const setFocusedNode = (index: any, back?: any) => {
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
      d3Select('#node-link').attr(
        'href',
        index != null ? `https://instagram.com/${nodes[index].name}` : '#',
      )
      d3Select('#node-link').text(nodes[index].name as string)
      ticked()
      return
    }
    focusedNode = null
    d3Select('#node-link').text('-')
    ticked()
  }

  d3Select('#node-back').on('click', () =>
    setFocusedNode(nodeStack.pop(), true),
  )
  const nodesCopy = nodes.map((node) => ({ ...node }))
  const linksCopy = links.map((link) => ({ ...link }))
  setFocusedNode(
    nodes.findIndex((usr) => usr.name === 'joshoty'),
    true,
  )

  // Zoom handling
  const zoom = d3Zoom().on('zoom', handleZoom)
  var transform: d3ZoomTransform
  function handleZoom(e: d3ZoomEvent<any, any>) {
    d3Select('svg g').attr('transform', (transform = e.transform) as any)
  }
  d3Select('svg')
    .call(zoom as any)
    .call(zoom.transform as any, d3ZoomIdentity)
  d3Select('svg').on('pointermove', (e) => {
    const p = transform.invert(d3Pointer(e))
  });

  (window as any).d3Loading = false

  d3ForceSimulation(nodesCopy as any)
    .force('charge', d3ForceManyBody().strength(-250))
    .force('center', d3ForceCenter(width / 2, height / 2))
    .force('link', d3ForceLink().links(linksCopy))
    .on('tick', ticked)

  function updateLinks() {
    linkObjects = d3Select('#theg')
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
      } as d3ValueFn<any, any, any>)
      .attr('x1', function (d: any) {
        return d.source.x
      })
      .attr('y1', function (d: any) {
        return d.source.y
      })
      .attr('x2', function (d: any) {
        return d.target.x
      })
      .attr('y2', function (d: any) {
        return d.target.y
      })
  }

  function updateNodes() {
    circleObjects = d3Select('#theg')
      .selectAll('circle')
      .data(nodesCopy)
      .join('circle')
      .attr('r', function (d: any) {
        if (focusedNode && focusedNode.index == d.index) {
          return 15
        }
        return 10
      })
      .style('fill', function (d: any) {
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
      .attr('cx', function (d: any) {
        return d.x
      })
      .attr('cy', function (d: any) {
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

  function ticked() {
    updateLinks()
    updateNodes()
  }
}

export default async function init() {
  const data = await d3Json('export.json').then((data) => data)
  const ignored = await d3Json('ignored.json').then((data) => data)
  generateChart(data, ignored)
}
