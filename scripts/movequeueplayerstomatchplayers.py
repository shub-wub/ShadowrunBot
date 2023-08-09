import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'test')
queueplayers_collection_name = os.getenv('QUEUEPLAYERS_COLLECTION_NAME', 'queueplayers')
matches_collection_name = os.getenv('MATCHES_COLLECTION_NAME', 'matches')
matchplayers_collection_name = os.getenv('MATCHPLAYERS_COLLECTION_NAME', 'matchplayers')

queue_exceptions = set()

def main():    
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    queueplayers_collection = database[queueplayers_collection_name]
    matches_collection = database[matches_collection_name]
    matchplayers_collection = database[matchplayers_collection_name]

    if not queueplayers_collection.find_one({}):
        print("No entries found in queueplayers")
        return


    queueplayer_move_count = 0
    queueplayer_not_move_count = 0
    queueplayers_processed = 0
    matches_removed_count = 0
    queueplayer_with_no_match = 0

    original_matches_with_no_winner = matches_collection.count_documents({"matchWinner": {"$exists": False}})
    original_matches_with_winners = matches_collection.count_documents({"matchWinner": {"$exists": True}})
    original_total_matches = matches_collection.count_documents({})
    original_queueplayers_total = queueplayers_collection.count_documents({})
    original_matchplayers_total = matchplayers_collection.count_documents({})

    finished_matches = set()

    matches_no_winner = matches_collection.find({"matchWinner": {"$exists": False}})
    for match_nw in matches_no_winner:
        matches_collection.delete_one({'_id': match_nw['_id']})
        matches_removed_count += 1

    matches_with_winner = matches_collection.find({"matchWinner": {"$exists": True}})
    for match_ww in matches_with_winner:
        finished_matches.add(match_ww['messageId'])

    queue_players = queueplayers_collection.find({})
    for queue_player in queue_players:
        moving = False
        if queue_player['messageId'] in queue_exceptions:
            continue
        if 'matchMessageId' in queue_player:
            if queue_player['matchMessageId'] in finished_matches:
                match_player = {
                    'discordId': queue_player['discordId'],
                    'matchMessageId': queue_player['matchMessageId'],
                    'team': queue_player['team']
                }
                matchplayers_collection.insert_one(match_player)
                queueplayer_move_count += 1
                moving = True
        else:
            queueplayer_with_no_match += 1
        if not moving:
            queueplayer_not_move_count += 1
        queueplayers_processed += 1
        print("Queue players processed so far ....", str(queueplayers_processed) + "/" + str(original_queueplayers_total))
    
    queueplayers_collection.delete_many({})
    print("================================")
    print("Matches to be removed from script...........", matches_removed_count)
    print("Before Script Matches with no match winner..", original_matches_with_no_winner)
    print("After Script Matches with no match winner...", matches_collection.count_documents({"matchWinner": {"$exists": False}}))
    print("Before Script Matches with winners..........", original_matches_with_winners)
    print("After Script Matches with winners...........", matches_collection.count_documents({"matchWinner": {"$exists": True}}))
    print("Before Script Matches total.................", original_total_matches)
    print("After Script Matches total..................", matches_collection.count_documents({}))
    print("Queue Players being moved...................", queueplayer_move_count)
    print("Queue Players not being moved...............", queueplayer_not_move_count)
    print("Total queue players deleted.................", queueplayers_processed)
    print("Before Script Total queue players...........", original_queueplayers_total)
    print("After Script Total queue players............", queueplayers_collection.count_documents({}))
    print("Before Script Total Match Players...........", original_matchplayers_total)
    print("After Script Total Match players............", matchplayers_collection.count_documents({}))
    print("================================")


if __name__ == "__main__":
    main()
