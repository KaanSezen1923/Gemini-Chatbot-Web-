import React from 'react'
import { useState} from 'react';
import axios from 'axios';


const Login = ({onLogin}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          const response = await axios.post("http://localhost:8000/login", { email, password });
          onLogin(response.data.access_token);
        } catch (err) {
          setError(err.response?.data?.detail || "Login failed.");
        }
      };
  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <form onSubmit={handleSubmit}>
            <input 
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Email'
            className="w-full p-2 border rounded mb-2"
            />
            <input 
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Password'
            className="w-full p-2 border rounded mb-2"
            />
            <button type='submit' className="bg-blue-500 text-white p-2 rounded">
                Login
            </button>
        </form>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      
    </div>
  )
}

export default Login
