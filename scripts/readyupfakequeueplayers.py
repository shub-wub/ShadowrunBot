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

num_of_players_to_ready_up = 4
offset_num = 8 # Will ready up fake users starting at this number and increasing

queue_message_id = None # Replace None with your queue message ID string to queue for a specific queue.

# If not queuing for a specific queue, players will be queued up to most recent queue with the following rankMin/rankMax parameters
rank_min = 1000
rank_max = 1008

def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    example_ids = []
    for num in range(num_of_players_to_ready_up):
        example_ids.append(str(num + offset_num))

    database = client[database_name]

    player_collection = database[player_collection_name]
    queue_collection = database[queue_collection_name]
    queueplayers_collection = database[queueplayers_collection_name]

    if not queue_message_id:
        queue_id = queue_collection.find_one({"rankMin": {"$lte": rank_min}, "rankMax": {"$gte": rank_max}}, sort=[('_id', DESCENDING)])['messageId']
        if not queue_id:
            print("No queue found with rankMin of", rank_min, "and rankMax of", rank_max)
    else:
        queue_id = queue_collection.find_one({"messageId": queue_message_id})
        if not queue_id:
            print("No Queue found in DB with message ID", queue_message_id)
            return -1
    
    for fake_id in example_ids:
        player = player_collection.find_one({"discordId": fake_id})
        if not player:
            print("No Player with the Example Discord ID", fake_id, "in the DB. May need to insert some example discord users.")
            return -1
        queue_player = queueplayers_collection.find_one({'discordId': player['discordId'], 'messageId': queue_id})
        if not queue_player:
            print("Player", fake_id, "not in queue", queue_id + ".",  "Skipping.")
            continue

        filter = {'discordId': fake_id, 'messageId': queue_id}
        new_ready_value = { '$set': {'ready': True}}
        queueplayers_collection.update_one(filter, new_ready_value)
        print("Setting Player", fake_id, "to a ready state")


if __name__ == "__main__":
    main()
    