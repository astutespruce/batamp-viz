import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# These variables are stored in .env in the project root
DATABASIN_USER = os.getenv("DATABASIN_USER")
DATABASIN_KEY = os.getenv("DATABASIN_KEY")

