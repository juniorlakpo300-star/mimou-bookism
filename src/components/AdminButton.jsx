import { useState } from "react"
import { useNavigate } from "react-router-dom"

const CODE_ADMIN = "MIMOU2026" // <--- CHANGE TON CODE ICI

export default function AdminButton(){
  const [show, setShow] = useState(false)
  const [code, setCode] = useState("")
  const navigate = useNavigate()

  function checkCode(e){
    e.preventDefault()
    if(code === CODE_ADMIN){
      localStorage.setItem("isAdmin", "true")
      alert("Mode Admin activé")
      navigate("/admimou")
    } else {
      alert("Code faux")
    }
    setShow(false)
    setCode("")
  }

  return (
    <>
      <button onClick={()=>setShow(true)} 
        style={{position:"fixed", bottom:10, right:15, opacity:0.2, background:"transparent", border:"none", color:"white", cursor:"pointer", fontSize:20}}>
        •
      </button>

      {show && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999}}>
          <form onSubmit={checkCode} style={{background:"white", padding:30, borderRadius:12, display:"flex", flexDirection:"column", gap:15}}>
            <h3 style={{color:"black"}}>Code Admin</h3>
            <input type="password" value={code} onChange={e=>setCode(e.target.value)} placeholder="Code" style={{padding:10, border:"1px solid #ccc", borderRadius:8}} />
            <div style={{display:"flex", gap:10}}>
              <button type="submit" style={{padding:10, background:"#22c55e", borderRadius:8, flex:1}}>Entrer</button>
              <button type="button" onClick={()=>setShow(false)} style={{padding:10, background:"#eee", borderRadius:8, flex:1}}>Annuler</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}