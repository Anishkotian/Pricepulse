import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth_routes, categories, dashboard, prices, products, shops

app = FastAPI(
    title="PricePulse API",
    version="1.0.0",
    description="Local product price comparison. Demonstration data only.",
)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth_routes, categories, shops, products, prices, dashboard):
    app.include_router(r.router)


@app.get("/")
def root():
    return {"app": "PricePulse API", "docs": "/docs"}