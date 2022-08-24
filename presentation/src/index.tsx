import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import init from './d3'

var loading = true

init()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
