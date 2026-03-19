"use client";
import { useState } from "react";
import { request } from "../lib/api";

export default function Home(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [token,setToken]=useState("");

  return (
    <div style={{padding:20}}>
      <h1>The One SaaS</h1>

      <input placeholder="email" onChange={e=>setEmail(e.target.value)} />
      <input placeholder="password" type="password" onChange={e=>setPassword(e.target.value)} />

      <br/><br/>

      <button onClick={async()=>{
        await request("/auth/register",{method:"POST",body:JSON.stringify({email,password})});
        alert("registered");
      }}>Register</button>

      <button onClick={async()=>{
        const res = await request("/auth/login",{method:"POST",body:JSON.stringify({email,password})});
        setToken(res.token);
      }}>Login</button>

      <button onClick={async()=>{
        const res = await request("/execute?token="+token,{method:"POST"});
        alert(JSON.stringify(res));
      }}>Run AI</button>

    </div>
  )
}
