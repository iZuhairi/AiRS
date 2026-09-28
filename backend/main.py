from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime
import requests
import httpx

DISC_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1522244639468552254/VlzWSU_MtDf5_auKLoDV7obGaY1CNb4FPkLGr1QOTtQzmvGjFiERZ59s6TTWddJ5kcqu"

def send_discord_alert(ip, port, mac, status):
    data = {
        "content": f"🚨 **PORT SECURITY VIOLATION DETECTED!** 🚨\n**IP:** `{ip}`\n**Port:** `{port}`\n**MAC:** `{mac}`\n**Status:** `{status}`"
    }
    requests.post(DISC_WEBHOOK_URL, json=data)

SQLALCHEMY_DATABASE_URL = "sqlite:///./airs.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String)
    ip_address = Column(String, unique=True)
    status = Column(Boolean, default=True)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    device_ip = Column(String, index=True)
    port = Column(String)
    mac_address = Column(String)
    status = Column(String)
    timestamp = Column(String)

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    timestamp = Column(String)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DeviceCreate(BaseModel):
    hostname: str
    ip_address: str
    status: bool = True

class IncidentCreate(BaseModel):
    device_ip: str
    port: str
    mac_address: str
    status: str

async def query_ollama(prompt: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={"model": "llama3.2", "prompt": prompt, "stream": False},
                timeout=30.0
            )
            return response.json().get("response", "AI Engine error.")
        except Exception:
            return "Failed to connect to local Ollama. Ensure 'ollama serve' is running."

@app.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    return db.query(Device).all()

@app.post("/devices")
def create_device(device: DeviceCreate, db: Session = Depends(get_db)):
    db_device = Device(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@app.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).all()

@app.post("/incidents")
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    new_incident = Incident(
        **incident.dict(),
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(new_incident)
    log = Log(
        message=f"Violation on {incident.device_ip} ({incident.port}) MAC: {incident.mac_address}",
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(log)
    db.commit()
    db.refresh(new_incident)
    
    send_discord_alert(incident.device_ip, incident.port, incident.mac_address, incident.status)
    
    return new_incident

@app.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    return db.query(Log).order_by(Log.id.desc()).all()

@app.post("/ai-chat")
async def chat_ai(data: dict):
    response = await query_ollama(data.get("message", ""))
    return {"reply": response}