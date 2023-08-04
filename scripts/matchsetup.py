import argparse
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

players_and_new_scores = [
    # ["670444654155530240", 1048], #bryman
    # ["1129495534130962472", 1026], #brymanbot
    # ["507288913518395402", 1009], #srg
    # ["312505608844738562", 999], #shub
    # ["95376035620589568", 1049], #bagel
    # ["421558155718295553", 1025], #hormel
    # ["111613988076310528", 1010], #bum
    # ["238329746671271936", 1000], #sinful

    ["1", 1048], 
    ["2", 1026], 
    ["3", 1009], 
    ["4", 1049], 
    ["5", 1025], 
    ["6", 1010], 
    ["7", 1000], 
]

exceptionId = "134760443850784769" # This one person will not be queued up. It allows that person to hit the "Queue" button,
                                   # which will update the queue with everyone else and only this person needs to press "Ready". Ideally, this is the tester's Discord ID
queueMessageId = "1136851868656611368"

def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
    database = client[database_name]

    player_collection = database[player_collection_name]
    queue_collection = database[queue_collection_name]
    queueplayers_collection = database[queueplayers_collection_name]
    queue_id = queue_collection.find_one({"messageId": queueMessageId}, sort=[('_id', DESCENDING)])['messageId']
    if not queue_id:
        print("No Queue that allows 1000-1008 in the DB. May need to insert an example queue with that range.")
        return -1
    for playerId, new_elo_score in players_and_new_scores:
        player = player_collection.find_one({"discordId": playerId})
        if not player:
            print("Could not find the player with Discord ID:", playerId)
            return -1
        
        filter = {'discordId': playerId}
        new_rating_value = { '$set': {'rating': new_elo_score}}
        try:
            player_collection.update_one(filter, new_rating_value)
        except:
            print("Could not update the elo score of player with Discord ID:", playerId)

        if playerId == exceptionId:
            print("PlayerID", playerId, "with ELO score of", new_elo_score, "but not queued in")
            continue
        queue_player = queueplayers_collection.find_one({'discordId': player['discordId'], 'messageId': queue_id})
        if queue_player:
            print("Player", playerId, "already in queue", queue_id + ".",  "Skipping.")
            continue
        queue_player = {
            'discordId': playerId,
            'messageId': queue_id,
            'ready': True
        }
        post_id = queueplayers_collection.insert_one(queue_player).inserted_id
        print("PlayerID", playerId, "with ELO score of", new_elo_score, "queued in", queue_id, "and readied up")


if __name__ == "__main__":
    main()