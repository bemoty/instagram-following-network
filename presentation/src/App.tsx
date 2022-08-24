import React, { useEffect } from 'react'

function App() {
  const [loading, setLoading] = React.useState(true)
  useEffect(() => {
    if ((window as any).d3Loading == null) {
      return
    }
    console.log("ololo")
    setLoading((window as any).d3Loading)
  }, [(window as any).d3Loading])
  return <>{loading ? <p>Loading ...</p> : null}</>
}

export default App
