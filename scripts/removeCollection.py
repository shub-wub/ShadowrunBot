import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'ShadowrunDB2')
player_collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')


def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    player_collection = database[player_collection_name]
    player_collection.drop()
        

if __name__ == "__main__":
    main()
