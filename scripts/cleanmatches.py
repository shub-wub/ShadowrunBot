import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'ShadowrunDB2')
player_collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')
matches_collection_name = os.getenv('MATCHES_COLLECTION_NAME', 'matches')
matchplayers_collection_name = os.getenv('MATCHPLAYERS_COLLECTION_NAME', 'matchplayers')


match_exceptions = {'1141501818824835262',
                       '1141514910694654074',
                       '1141527753301172244',
                       '1141539152383463476',
                       '1141539982817894420',
                       '1141549437991272580',
                       '1141550459786625044',
                       '1141572570198589501'} # Populate with queue message ID strings of matches you want to skip and leave data for in the DB

match_exception_filter = { '$nor' : [{"messageId" : match_exception} for match_exception in match_exceptions]}
matchplayer_exception_filter = { '$nor' : [{"matchMessageId" : match_exception} for match_exception in match_exceptions]}

def main():

    # answer = 'x'
    # while answer != 'y' and answer != 'n' and answer != 'Y' and answer != 'N':
    #     answer = input("This will delete everything in queueplayers. Make sure nobody else has data in there. Proceed? (y/N): ")
    # if answer == 'n' or answer == 'N':
    #     return
    
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    matches_collection = database[matches_collection_name]
    matchplayers_collection = database[matchplayers_collection_name]

    matches_count = matches_collection.count_documents(match_exception_filter)
    total_matches_count = matches_collection.count_documents({})
    matchplayers_count = matchplayers_collection.count_documents(matchplayer_exception_filter)
    total_matchplayers_count = matchplayers_collection.count_documents({})

    print("Found", str(matches_count) + "/" + str(total_matches_count), "matches")
    print("Found", str(matchplayers_count) + "/" + str(total_matchplayers_count), "matchplayers")
    
    matches_deleted = matches_collection.delete_many(match_exception_filter)
    matchplayers_deleted = matchplayers_collection.delete_many(matchplayer_exception_filter)

    print("Deleted", matches_deleted.deleted_count, "matches")
    print("Deleted", matchplayers_deleted.deleted_count, "match players")

    print("Matches still in DB:", matches_collection.count_documents({}))
    print("Match players still in DB:", matchplayers_collection.count_documents({}))

        

if __name__ == "__main__":
    main()
