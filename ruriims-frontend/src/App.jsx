import { useEffect } from 'react'
import axiosClient from "./api/axios";
import './App.css'

function App() {

  useEffect(() => {
    axiosClient.get('/test')
      .then(res => {
        console.log(res.data)
      })
      .catch(err => {
        console.error(err)
      })
  }, [])

  return (
    <div>
      <h1 className="text-4xl font-bold text-blue-500">
        Blue Heading
      </h1>
      <p className="text-red-500 text-lg">
        Red paragraph text
      </p>
    </div>
  )
}

export default App