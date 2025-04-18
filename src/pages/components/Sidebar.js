import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Sidebar({ onNewChat, onSelectChat, selectedSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token bulunamadı. Kullanıcı giriş yapmış mı?");
        return;
      }
      const response = await axios.get('http://localhost:8000/chat-sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSessions(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setError("Lütfen giriş yapın.");
      } else {
        console.error('Oturumlar alınamadı:', error);
        setError("Oturumlar alınamadı. Tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDeleteSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/chat-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSessions(sessions.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Oturum silinemedi:', error);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4 flex flex-col">
      <button
        onClick={onNewChat}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Yeni Sohbet
      </button>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center">Yükleniyor...</div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 mb-2 rounded cursor-pointer hover:bg-gray-700 ${
                selectedSessionId === session.id ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 truncate"
                  onClick={() => onSelectChat(session)}
                >
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-sm text-gray-400">
                    {formatDate(session.created_at)}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 