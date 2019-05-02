import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)

DATABASIN_USER = os.getenv("DATABASIN_USER")
DATABASIN_KEY = os.getenv("DATABASIN_KEY")

