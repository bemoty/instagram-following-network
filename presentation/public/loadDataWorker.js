const prepareData = (data, ignored) => {
  const allFollowings = data.flatMap((usr) => usr.followings)
  const nodes = [
    ...new Set(
      allFollowings
        .filter(
          (usr) => allFollowings.filter((name) => name === usr).length >= 2, // remove users who are only followed once ...
        )
        .concat(data.map((usr) => usr.name)),
    ),
  ].filter((usr) => !ignored.includes(usr))
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

self.onmessage = (e) => {
    const { data, ignored } = e.data
    self.postMessage(prepareData(data, ignored))
}
