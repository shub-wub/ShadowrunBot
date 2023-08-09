import os
from datetime import datetime, timezone
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

# This helps setup a queue where only one person needs to queue before the match is generated

# Elo scores of [1050, 1026, 1009, 999, 1049, 1025, 1010, 1000] will team up the first four and the last four
players_and_new_scores = [
    ["670444654155530240", 1050],
    ["421558155718295553", 1026],
    ["312505608844738562", 1009],
    ["238329746671271936", 999],
    ["256566189566722048", 1049],
    ["236408429487456266", 1025],
    ["111613988076310528", 1010],
    ["95376035620589568", 1000],
]

exception_id = players_and_new_scores[0][0] # The first person in the above list  will not be queued up.
                                            # It allows that person to hit the "Queue" button, which will
                                            # update the queue with everyone else
                                            # Ideally, this is the tester's Discord ID

queue_message_id = "1138885962382979183" # Replace None with your queue message ID string to queue for a specific queue.

# If not queuing for a specific queue, players will be queued up to most recent queue with the following rankMin/rankMax parameters
rankMin = 1000
rankMax = 1008


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
    if not queue_message_id:
        queue_id = queue_collection.find_one({"rankMin": {"$lte": rankMin}, "rankMax": {"$gte": rankMax}}, sort=[('_id', DESCENDING)])['messageId']
        if not queue_id:
            print("No queue found with rankMin of", rankMin, "and rankMax of", rankMax)
    else:
        queue_id = queue_message_id
        if not queue_id:
            print("No Queue found in DB with message ID", queue_message_id)
            return -1
    i = 0
    for player_id, new_elo_score in players_and_new_scores:
        player = player_collection.find_one({"discordId": player_id})
        if not player:
            print("Could not find the player with Discord ID:", player_id)
            return -1
        
        filter = {'discordId': player_id}
        new_rating_value = {'$set': {'rating': new_elo_score}}
        try:
            player_collection.update_one(filter, new_rating_value)
            pass
        except:
            print("Could not update the elo score of player with Discord ID:", player_id)

        if player_id == exception_id:
            print("player_id", player_id, "with ELO score of", new_elo_score, "but not queued in")
            continue

        queue_player = queueplayers_collection.find_one({'discordId': player['discordId']})
        if queue_player and 'matchMessageId' in queue_player:
            print("Player is in a match and can not be queued up")
            continue
        elif queue_player and queue_player['messageId'] == queue_message_id:
            filter = {'_id': queue_player['_id']}
            new_position = { '$set' : {'queuePosition': i + 1} }
            queueplayers_collection.update_one(filter, new_position)
            print("Player", player_id, "already in a queue", queue_player['messageId'] + ".",  "Changed their ELO score to", str(new_elo_score) + ".", "New position in queue is", i + 1)      
            i += 1
            continue
        elif queue_player:
            print("Player is in another queue")
            continue
            

        queue_player = {
            'discordId': player_id,
            'messageId': queue_id,
            'queuePosition': None, #i + 1,
            'queueTime': datetime.now()
        }
        print(queue_player['queueTime'])
        post_id = queueplayers_collection.insert_one(queue_player).inserted_id
        print("player_id", player_id, "with ELO score of", new_elo_score, "queued in", queue_id, "with position", str(i + 1) + ".")
        i += 1


if __name__ == "__main__":
    main()

