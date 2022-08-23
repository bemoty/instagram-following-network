const file = 'export.json'
const width = window.innerWidth
const height = window.innerHeight

// we don't care about memepages, celebrities, bands, etc., so we filter them here
const ignoredAccounts = [
  'gronkh',
  'unge',
  '9gag',
  'memezar',
  'memelord',
  'rammsteinofficial',
  'meme.ig',
  'nugget',
  'billieeilish',
  'funnyposts',
  'witchernetflix',
  'shirindavid',
  'stefaniegiesinger',
  'zendaya',
  'arianagrande',
  'hoenest',
  'colesprouse',
  'advice',
  'memequeen',
  'i_have_no_memes96_v2',
  'pubity',
  'badgalriri',
  'annitheduck',
  'feliciathegoat',
  'lilpeep',
  'bbnomula',
  'bringmethehorizon',
  'dog',
  'aoc',
  'alternative.outfits.ideas',
  'bunkerjunge.v2',
  'jasmingnu',
  'pandorya',
  'dealbunny.de',
  'wtf.social',
  'isyoufunny',
  'lachkrampfbilder',
  'deeplovegoals',
  'nannie',
  'spontanablack',
  'handiofiblood',
  'revedtv',
  'jujuvierundvierzig',
  'rezo',
  'badmomzjay',
  'bibisbeautypalace',
  'jokezar',
  'vong',
  'ich.und.der.alkohol',
  'bowerjamie',
  'world_record_egg',
  'instamoregame',
  'tattoofrei',
  'kurde.der.was.wurde',
  'hiroshimas.verstrahlter.junge',
  'couplesnote',
  'milliebobbybrown',
  'hitsblunt',
  'hiroshimas.verstrahlter.junge1',
  'iamcardib',
  'originalcandleguy',
  'olobersykes',
  'leagueoflegends',
  'first',
  'bunkerjunge.v2',
  'ironieposts',
  'epicfunnypage',
  'greatestreactions',
  'kidsgettinghurt',
  'instamemez.de',
  'raffasplasticlife',
  'theweeknd',
  'crispyrob',
  'kendalljenner',
  'kyliejenner',
  'travisscott',
  'rintintin',
  'monk.bhz',
  'bhz030',
  'suicideboys',
  'longusmongusbhz',
  'makko.hatdichlieb',
  'f1',
  'carlossainz55',
  'landonorris',
  'saradesideria',
  'werenotreallystrangers',
  'vinivicimusic',
  'k.ronaldo2016',
  'rickandmorty',
  'kaliuchis',
  'kuchentv',
  'therealjanboehmermann',
  'sza',
  'faktillon',
  'binbetrunken',
  'burgerkingaustria',
  'kitthey',
  'nathanwpylestrangeplanet',
  'beeple_crap',
  'kidd',
  'faker',
  'kendricklamar',
  'inscopenico',
  'bmw',
  'redbull',
  'wizkhalifa',
  'kronen.zeitung',
  'coupleontour',
  'simplicissimusyt',
  'recht2go',
  'nasa',
  'nasahubble',
  'vansskate',
  'supremenewyork',
  'sascha_huber_official',
  'dailyotis'
]

/** @param {boolean} loading */
const setLoading = (loading) => {
  if (loading) {
    document.getElementById('loading').style.display = 'block'
  } else {
    document.getElementById('loading').style.display = 'none'
  }
}

const prepareData = (data) => {
  const allFollowings = data.flatMap((usr) => usr.followings)
  const nodes = [
    ...new Set(allFollowings.concat(data.map((usr) => usr.name))),
  ].filter(
    (usr) => allFollowings.filter((name) => name === usr).length > 1, // remove users who are only followed once ...
  ).filter(
    (usr) => !ignoredAccounts.includes(usr),
  )
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

const generateChart = (data) => {
  const { nodes, links } = prepareData(data)
  var circleObjects
  var linkObjects
  var focusedNode
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
      d3.select('#node-name').text(nodes[index].name)
      ticked()
      return
    }
    focusedNode = null
    d3.select('#node-name').text('-')
    ticked()
  }
  d3.select('#node-back').on('click', () =>
    setFocusedNode(nodeStack.pop(), true),
  )
  const nodesCopy = nodes.map((node) => ({ ...node }))
  const linksCopy = links.map((link) => ({ ...link }))
  setFocusedNode(0, true)

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

  d3.forceSimulation(nodesCopy)
    .force('charge', d3.forceManyBody().strength(-250))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('link', d3.forceLink().links(linksCopy))
    .on('tick', ticked)

  setLoading(false)

  function updateLinks() {
    linkObjects = d3
      .select('#theg')
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
          return '#9e9e9e'
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
    circleObjects = d3
      .select('#theg')
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
        if (!focusedNode) {
          return '#2896d6'
        }
        if (d.index == focusedNode.index) {
          return '#000'
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
        console.log('clicked', user)
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

  /*
  const svg = d3
    .select('#bubble-chart')

  const tooltip = d3.select('.tooltip')

  const node = svg
    .selectAll()
    .data(bubble.children)
    .enter()
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)

  const circle = node
    .append('circle')
    .style('fill', (d) => colors[d.data.category])
    .on('mouseover', function (e, d) {
      tooltip.select('img').attr('src', d.data.img)
      tooltip.select('a').attr('href', d.data.link).text(d.data.name)
      tooltip
        .select('span')
        .attr('class', d.data.category)
        .text(d.data.category)
      tooltip.style('visibility', 'visible')

      d3.select(this).style('stroke', '#222')
    })
    .on('mousemove', (e) =>
      tooltip.style('top', `${e.pageY}px`).style('left', `${e.pageX + 10}px`),
    )
    .on('mouseout', function () {
      d3.select(this).style('stroke', 'none')
      return tooltip.style('visibility', 'hidden')
    })
    .on('click', (e, d) => window.open(d.data.link))

  const label = node
    .append('text')
    .attr('dy', 2)
    .text((d) => d.data.name.substring(0, d.r / 3))

  node
    .transition()
    .ease(d3.easeExpInOut)
    .duration(1000)
    .attr('transform', (d) => `translate(${d.x}, ${d.y})`)

  circle
    .transition()
    .ease(d3.easeExpInOut)
    .duration(1000)
    .attr('r', (d) => d.r)

  label
    .transition()
    .delay(700)
    .ease(d3.easeExpInOut)
    .duration(1000)
    .style('opacity', 1)
    */
}

;(async () => {
  data = await d3.json(file).then((data) => data)
  generateChart(data)
})()
