import UploadForm from "./components/UploadForm";
import { useState, useEffect } from "react";
import ChatBox from "./components/ChatBox";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Sidebar from "./components/Sidebar";
import axios from "axios";

export default function Home() {
  
  const [token, setToken] = useState(null); 
  const [uploadMessage, setUploadMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [showSignup, setShowSignup] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      setToken(savedToken || null); 
    }
  }, []); 

  const handleLogin = (accessToken) => {
    setToken(accessToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", accessToken);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setToken(null);
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await axios.post("http://localhost:8000/upload-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      });
      setUploadMessage(response.data.message);
    } catch (error) {
      setUploadMessage(error.response?.data?.detail || "Yükleme başarısız.");
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleChatSubmit = async (query) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/chat",
        { query },
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      setChatHistory([...chatHistory, { user: query, bot: response.data.response }]);
      setSelectedSessionId(response.data.session_id);
    } catch (error) {
      setChatHistory([
        ...chatHistory,
        { user: query, bot: "Hata: " + (error.response?.data?.detail || "Bir sorun oluştu.") },
      ]);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/chat-sessions",
        {},
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      setSelectedSessionId(response.data.id);
      setChatHistory([]);
    } catch (error) {
      console.error("Yeni sohbet oluşturulamadı:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const handleSelectChat = async (session) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/chat-sessions/${session.id}/messages`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      setSelectedSessionId(session.id);
      setChatHistory(
        response.data.map((msg) => ({
          user: msg.message,
          bot: msg.response,
        }))
      );
    } catch (error) {
      console.error("Sohbet mesajları alınamadı:", error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

 
  if (!token){
    return (
      <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
        {showSignup ? (
          <>
            <Signup onLogin={handleLogin} />
            <p className="mt-4">
              You already have an account?{" "}
              <button
                className="text-blue-500 underline"
                onClick={() => setShowSignup(false)}
              >
                Log in
              </button>
            </p>
          </>
        ) : (
          <>
            <Login onLogin={handleLogin} />
            <p className="mt-4">
              You don't have an account?{" "}
              <button
                className="text-blue-500 underline"
                onClick={() => setShowSignup(true)}
              >
                Sign up
              </button>
            </p>
          </>
        )}
      </div>
    );
  }
  

  
  return (
    <div className="flex h-screen">
      <Sidebar
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        selectedSessionId={selectedSessionId}
      />
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gemini Chatbot with Pdf</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          > 
          {token ? " Çıkış Yap " : "Giriş Yap"}
          </button>
        </div>
        <div className="max-w-3xl mx-auto grid gap-6">
          <UploadForm onUpload={handleUpload} message={uploadMessage} />
          <ChatBox onSubmit={handleChatSubmit} history={chatHistory} />
        </div>
      </div>
    </div>
  );
}