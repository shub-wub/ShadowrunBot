import os
import argparse
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'test')
queueplayers_collection_name = os.getenv('QUEUEPLAYERS_COLLECTION_NAME', 'queueplayers')
matches_collection_name = os.getenv('MATCHES_COLLECTION_NAME', 'matches')

queue_id = None # Replace with your queue message ID string to queue for a specific queue.


def main(queue_message_id):
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
    
    print("Clearing out queue", queue_message_id)
    database = client[database_name]
    queueplayers_collection = database[queueplayers_collection_name]
    matches_collection = database[matches_collection_name]


    post = queueplayers_collection.delete_many({'messageId': queue_message_id, "matchMessageId": {"$exists": False}})
    print(post.deleted_count)
    queue_players = queueplayers_collection.find({'messageId': queue_message_id})
    for player in queue_players:
        match = matches_collection.find_one({"messageId": player['matchMessageId'], "matchWinner": {"$exists": True}})
        if not match:
            queueplayers_collection.delete_one({"_id": player["_id"]})
    
    

if __name__ == "__main__":
    if queue_id:
        main(queue_id)
    else:
        parser = argparse.ArgumentParser(
                        prog='ChangePlayerElo',
                        description='Changes a specific player\'s ELO to a specific amount')
        parser.add_argument('queueMessageId')
        args = parser.parse_args()
        if type(args.queueMessageId) != type(str):
            args.queueMessageId = str(args.queueMessageId)
        main(args.queueMessageId)
