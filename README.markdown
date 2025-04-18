# Gemini Chatbot Web

A web-based chatbot application integrated with Google's Gemini API, allowing users to upload PDFs, engage in real-time conversations, and manage chat sessions. The app features user authentication, a responsive UI, and a sidebar for chat session management.

## Features

- **Real-Time Chat**: Interact with the Gemini AI model for dynamic conversations.
- **PDF Upload**: Upload and process PDF files for contextual queries.
- **Chat History**: View and manage conversation history with a clean interface.
- **User Authentication**: Secure login and signup functionality.
- **Session Management**: Create, view, and delete chat sessions via a sidebar.
- **Responsive Design**: Modern, user-friendly interface built with Tailwind CSS.

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: FastAPI (assumed, based on API endpoints)
- **API**: Google Gemini API for conversational AI
- **HTTP Client**: Axios for API requests
- **Authentication**: JWT-based authentication
- **Deployment**: [Specify deployment platform, e.g., Vercel, if applicable]

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- A valid **Google Gemini API key** (Obtain from [Google AI Studio](https://aistudio.google.com/app/apikey))
- A running FastAPI backend at `http://localhost:8000` (or your configured URL)
- A modern web browser (Chrome, Firefox, etc.)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/KaanSezen1923/Gemini-Chatbot-Web-.git
   cd Gemini-Chatbot-Web-
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add your configuration:
     ```env
     REACT_APP_GEMINI_API_KEY=your_api_key_here
     REACT_APP_BACKEND_URL=http://localhost:8000
     ```

4. **Run the Application**:
   ```bash
   npm start
   ```

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost:3000`.

## Backend Setup

The frontend assumes a FastAPI backend running at `http://localhost:8000` with endpoints for:
- `/login` (POST): User login
- `/signup` (POST): User registration
- `/chat-sessions` (GET, DELETE): Chat session management

Ensure the backend is configured with:
- JWT authentication
- Google Gemini API integration
- CORS enabled for `http://localhost:3000`

Refer to the backend repository or documentation for setup instructions.

## Usage

1. **Sign Up / Log In**:
   - Navigate to the signup or login page to create an account or authenticate.
   - Upon successful login, a JWT token is stored in `localStorage`.

2. **Upload PDFs**:
   - Use the PDF upload form to submit files for processing.
   - Uploaded PDFs can be queried in the chatbot.

3. **Chat with the Bot**:
   - Enter queries in the chat input field and submit.
   - View conversation history in the chatbox.

4. **Manage Sessions**:
   - Use the sidebar to create new chats, select existing sessions, or delete sessions.
   - Sessions are displayed with titles and creation timestamps.

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ChatBox.js        # Chat interface for user-bot interaction
│   │   ├── Login.js          # User login form
│   │   ├── Sidebar.js        # Chat session management sidebar
│   │   ├── Signup.js         # User signup form
│   │   ├── UploadForm.js     # PDF upload form
│   ├── App.js                # Main app component
│   ├── index.js              # Entry point
├── public/                   # Static assets
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a Pull Request.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For inquiries or feedback, contact [Kaan Sezen](https://github.com/KaanSezen1923) or open an issue on the [GitHub repository](https://github.com/KaanSezen1923/Gemini-Chatbot-Web-/issues).

## Acknowledgments

- [Google Gemini API](https://ai.google.dev/) for conversational AI.
- [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/) for the frontend.
- [FastAPI](https://fastapi.tiangolo.com/) (assumed) for the backend.
- The open-source community for their support.