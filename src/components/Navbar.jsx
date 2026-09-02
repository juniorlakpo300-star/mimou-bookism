import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"

const CODE_ADMIN = "MIMOU2026"

export default function Navbar(){
  const [show, setShow] = useState(false)
  const [code, setCode] = useState("")
  const navigate = useNavigate()

  function handleAdmin(e){
    e.preventDefault()
    if(localStorage.getItem("isAdmin") === "true"){
      navigate("/admimou")
    } else {
      setShow(true)
    }
  }

  function checkCode(e){
    e.preventDefault()
    if(code === CODE_ADMIN){
      localStorage.setItem("isAdmin", "true")
      setShow(false)
      setCode("")
      navigate("/admimou")
    } else {
      alert("Code faux!")
    }
  }

  return (
    <>
      <nav className="flex justify-between items-center p-4 bg-[#020617] border-b border-white/10">
        <Link to="/" className="font-bold text-xl">MIMOU BOOK</Link>
        <div className="flex gap-3 items-center">
          <Link to="/catalogue">Bibliothèque</Link>
          <Link to="/publier">Publier</Link>
          <button onClick={handleAdmin} className="bg-green-500 text-black px-4 py-1.5 rounded-lg font-bold">Admimou</button>
        </div>
      </nav>

      {show && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={checkCode} className="bg-white p-6 rounded-xl flex flex-col gap-4 w-[300px]">
            <h3 className="text-black font-bold text-lg">Code Admin</h3>
            <input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="Entre le code" className="p-3 border rounded-lg text-black outline-none" autoFocus />
            <div className="flex gap-2">
              <button className="flex-1 bg-green-500 p-3 rounded-lg font-bold">Valider</button>
              <button type="button" onClick={()=>setShow(false)} className="flex-1 bg-gray-200 p-3 rounded-lg text-black">Annuler</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}