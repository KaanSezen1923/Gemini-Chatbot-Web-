import React from 'react'
import { useState } from 'react';

const ChatBox = ({ onSubmit, history }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    await onSubmit(query);
    setLoading(false);
    setQuery("");
  };


  return (
    <div>
      <h2> Chatbot </h2>
      <div>
        {history.map((entry,idx) => (
          <div key={idx} className="mb-4">
              <div className="mb-2">
                <p className="font-semibold text-blue-600">You:</p>
                <p className="ml-2">{entry.user}</p>
              </div>
              <div>
                <p className="font-semibold text-green-600">Chatbot:</p>
                <p className="ml-2">{entry.bot}</p>
              </div>
            </div>

        ) )}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sorunuzu buraya yazın..."
          className="w-full p-2 border rounded mb-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {loading ? "Yanıt bekleniyor..." : "Gönder"}
        </button>
      </form>
    </div>
  )
}

export default ChatBox
