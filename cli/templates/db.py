import psycopg
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

def connect_db():
    try:
        DB_URL = os.getenv("DB_URL")
        result = urlparse(DB_URL)
        conn = psycopg.connect(
            dbname=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port
        )
        conn = psycopg.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None
