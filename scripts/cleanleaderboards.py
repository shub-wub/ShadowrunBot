import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'ShadowrunDB2')
leaderboards_collection_name = os.getenv('LEADERBOARDS_COLLECTION_NAME', 'leaderboards')


leaderboard_exceptions = {'1136886222728474765',
                          '1141588607166070804'} # Populate with leaderboard message ID strings of leaderboards you want to skip and leave data for in the DB

leaderboard_exception_filter = { '$nor' : [{"messageId" : leaderboard_exception} for leaderboard_exception in leaderboard_exceptions]}

def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    leaderboard_collection = database[leaderboards_collection_name]

    leaderboards_count = leaderboard_collection.count_documents(leaderboard_exception_filter)
    total_leaderboards_count = leaderboard_collection.count_documents({})

    print("Found", str(leaderboards_count) + "/" + str(total_leaderboards_count), "leaderboards")
    
    leaderboards_deleted = leaderboard_collection.delete_many(leaderboard_exception_filter)

    print("Deleted", leaderboards_deleted.deleted_count, "leaderboards")

    print("Leaderboards still in DB:", leaderboard_collection.count_documents({}))
        

if __name__ == "__main__":
    main()
