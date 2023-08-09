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
queueplayers_collection_name = os.getenv('QUEUEPLAYERS_COLLECTION_NAME', 'queueplayers')


queue_exceptions = set() # Populate with queue message ID strings of queues you want to skip and leave data for in the DB

def main():

    answer = 'x'
    while answer != 'y' and answer != 'n' and answer != 'Y' and answer != 'N':
        answer = input("This will delete everything in queueplayers. Make sure nobody else has data in there. Proceed? (y/N): ")
    if answer == 'n' or answer == 'N':
        return
    
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    queue_collection = database[queue_collection_name]
    queueplayers_collection = database[queueplayers_collection_name]

    if not queueplayers_collection.count_documents({}):
        print("No entries found in queueplayers")
        return

    queue_players = queueplayers_collection.find()
    queue_ids_for_deletion = set()
    for queue_player in queue_players:
        if queue_player['messageId'] in queue_exceptions:
            continue
        elif queue_player['messageId'] not in queue_ids_for_deletion:
            queue_ids_for_deletion.add(queue_player['messageId'])
        queueplayers_collection.delete_one({'id': queue_player['id']})
    
    for queue_id in queue_ids_for_deletion:
        queue_collection.delete_one({'messageId': queue_id})
        

if __name__ == "__main__":
    main()
