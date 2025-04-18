import os
import tempfile
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from astrapy import DataAPIClient
from astrapy.constants import VectorMetric
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import google.generativeai as genai
from tqdm import tqdm
from pydantic import BaseModel
import uuid
from database import get_db, User, PDF, ChatHistory, ChatSession
from auth import get_current_user, UserCreate, UserLogin, Token, create_access_token, get_password_hash, verify_password
from sqlalchemy.orm import Session
from datetime import timedelta

app = FastAPI()

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class ChatRequest(BaseModel):
    query:str 
    
load_dotenv()
token = os.getenv("ASTRA_DB_APPLICATION_TOKEN")
api_endpoint = os.getenv("ASTRA_DB_API_ENDPOINT")
gemini_api_key = os.getenv("GEMINI_API_KEY")

client = DataAPIClient(token)
db = client.get_database_by_api_endpoint(api_endpoint)

embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", google_api_key=gemini_api_key)
genai.configure(api_key=gemini_api_key)
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

collection_name = "vector_test"
if collection_name not in db.list_collection_names():
    collection = db.create_collection(collection_name, dimension=768, metric=VectorMetric.COSINE)
else:
    collection = db.get_collection(collection_name)
    
@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=30))
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=30))
    return {"access_token": access_token, "token_type": "bearer"}
    
@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Yalnızca PDF dosyaları kabul edilir.")

    try:
        pdf_content = await file.read()
        
        
        db_pdf = PDF(
            filename=file.filename,
            content=pdf_content,
            user_id=current_user.id
        )
        db.add(db_pdf)
        db.commit()
        
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name

        loader = PyPDFLoader(temp_file_path, extract_images=False)
        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=300)
        chunks = text_splitter.split_documents(documents)
        os.unlink(temp_file_path)

        chunk_contents = [chunk.page_content for chunk in chunks if chunk.page_content.strip()]
        if not chunk_contents:
            raise ValueError("PDF'de geçerli içerik bulunamadı.")

        ids = [str(uuid.uuid4()) for _ in range(len(chunk_contents))]
        vectors = [embeddings.embed_query(chunk) for chunk in chunk_contents]
        documents = [{"_id": ids[i], "text": chunk_contents[i], "$vector": vectors[i]} for i in range(len(chunk_contents))]

        collection.insert_many(documents)
        
        return {"message": f"{len(documents)} adet chunk başarıyla Astra DB'ye eklendi ve PDF veritabanına kaydedildi."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF işlenirken hata oluştu: {str(e)}")
    
@app.post("/chat-sessions")
async def create_chat_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        session = ChatSession(
            user_id=current_user.id,
            title="Yeni Sohbet"
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"id": session.id, "title": session.title, "created_at": session.created_at}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oturum oluşturulurken hata oluştu: {str(e)}")

@app.get("/chat-sessions")
async def get_chat_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()
        return [{"id": session.id, "title": session.title, "created_at": session.created_at} for session in sessions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oturumlar alınırken hata oluştu: {str(e)}")

@app.delete("/chat-sessions/{session_id}")
async def delete_chat_session(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Oturum bulunamadı")
        db.delete(session)
        db.commit()
        return {"message": "Oturum başarıyla silindi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oturum silinirken hata oluştu: {str(e)}")

@app.get("/chat-sessions/{session_id}/messages")
async def get_session_messages(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Oturum bulunamadı")
        messages = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.timestamp.asc()).all()
        return [{"id": msg.id, "message": msg.message, "response": msg.response, "timestamp": msg.timestamp} for msg in messages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mesajlar alınırken hata oluştu: {str(e)}")

@app.post("/chat")
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        
        active_session = db.query(ChatSession).filter(
            ChatSession.user_id == current_user.id
        ).order_by(ChatSession.created_at.desc()).first()

        if not active_session:
            
            active_session = ChatSession(
                user_id=current_user.id,
                title=request.query[:50] + "..." if len(request.query) > 50 else request.query
            )
            db.add(active_session)
            db.commit()
            db.refresh(active_session)

        query_vector = embeddings.embed_query(request.query)
        results = collection.find(sort={"$vector": query_vector}, limit=10)

        context = "".join([result.get("text", "No text available") + "\n" for result in results]) or "No relevant context found in the database."

        system_prompt = (
            "You are a specialized artificial intelligence assistant. "
            "Your task is to answer the user's question based on the provided context. "
            "If the answer is not found in the context, use your own trained knowledge to respond.\n\n"
            f"Context: {context}\n\n"
            f"Question: {request.query}"
        )

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            generation_config=generation_config,
            system_instruction=system_prompt
        )
        chat_session = model.start_chat(history=[])
        response = chat_session.send_message(request.query)
        
       
        chat_history = ChatHistory(
            session_id=active_session.id,
            message=request.query,
            response=response.text
        )
        db.add(chat_history)
        db.commit()

        
        if active_session.title == "Yeni Sohbet":
           
            summary_prompt = f"Bu sorguyu 5-7 kelime ile özetle: {request.query}"
            summary_response = chat_session.send_message(summary_prompt)
            active_session.title = summary_response.text.strip()
            db.commit()
        
        return {
            "response": response.text,
            "session_id": active_session.id,
            "session_title": active_session.title
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sorgu işlenirken hata oluştu: {str(e)}")

@app.get("/chat-history")
async def get_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        history = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id).order_by(ChatHistory.timestamp.desc()).all()
        return [{"id": chat.id, "message": chat.message, "response": chat.response, "timestamp": chat.timestamp} for chat in history]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sohbet geçmişi alınırken hata oluştu: {str(e)}")

@app.delete("/chat-history/{chat_id}")
async def delete_chat(chat_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        chat = db.query(ChatHistory).filter(ChatHistory.id == chat_id, ChatHistory.user_id == current_user.id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Sohbet bulunamadı")
        db.delete(chat)
        db.commit()
        return {"message": "Sohbet başarıyla silindi"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sohbet silinirken hata oluştu: {str(e)}")


    