import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'test')
player_collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')
queue_collection_name = os.getenv('QUEUE_COLLECTION_NAME', 'queues')


queue_exceptions = [  # Populate with queue message ID strings of queues you want to skip and leave data for in the DB
    None
    ]

def main():    
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    queue_collection = database[queue_collection_name]

    queues = queue_collection.find({})
    for queue in queues:
        if queue['messageId'] not in queue_exceptions:
            queue_collection.delete_one({'messageId': queue['messageId']})
        

if __name__ == "__main__":
    main()
    