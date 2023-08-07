import os
import argparse
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

num_of_players_to_queue_up = 4
offset_num = 8  # Will queue up fake users starting at this number and increasing

queue_message_id = None # Replace None with your queue message ID string to queue for a specific queue.

def main(queue_id):
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    example_ids = []
    for num in range(num_of_players_to_queue_up):
        example_ids.append(str(num + offset_num))
        
    database = client[database_name]

    player_collection = database[player_collection_name]
    queue_collection = database[queue_collection_name]
    queueplayers_collection = database[queueplayers_collection_name]

    if not queue_collection.find_one({"messageId": queue_id}):
        print("No Queue found in DB with message ID", queue_id)
        return -1
    
    for fake_id in example_ids:
        player = player_collection.find_one({"discordId": fake_id})
        if not player:
            print("No Player with the Example Discord ID", fake_id, "in the DB. May need to insert some example discord users.")
            return -1
        queue_player = queueplayers_collection.find_one({'discordId': player['discordId'], 'messageId': queue_id})
        if queue_player:
            print("Player", fake_id, "already in queue", queue_id + ".",  "Skipping.")
            continue
        queue_player = {
            'discordId': fake_id,
            'messageId': queue_id,
            'ready': False
        }
        post_id = queueplayers_collection.insert_one(queue_player).inserted_id
        print("PlayerID", fake_id, "queued in", queue_id)


if __name__ == "__main__":
    if queue_message_id:
        main(queue_message_id)
    else:
        parser = argparse.ArgumentParser(
                        prog='ChangePlayerElo',
                        description='Changes a specific player\'s ELO to a specific amount')
        parser.add_argument('queueMessageId')
        args = parser.parse_args()
        print(args.queueMessageId)
        if type(args.queueMessageId) != type(str):
            args.queueMessageId = str(args.queueMessageId)
        main(args.queueMessageId)