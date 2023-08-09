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

# Can add any number of users to the following list
players_and_new_scores = [
    ["1", 1050],
    ["2", 1026],
    ["3", 1009],
    ["4", 999],
    ["5", 1049],
    ["6", 1025],
    ["7", 1010],
    ["8", 1000],
]

def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        

    database = client[database_name]

    player_collection = database[player_collection_name]

    for player_id, new_elo_score in players_and_new_scores:
        player = player_collection.find_one({"discordId": player_id})
        if not player:
            print("Could not find the player with Discord ID:", player_id + ". Skipping")
            continue
        
        filter = {'discordId': player_id}
        new_rating_value = { '$set': {'rating': new_elo_score}}
        try:
            player_collection.update_one(filter, new_rating_value)
        except:
            print("Could not update the elo score of player with Discord ID:", player_id)

if __name__ == "__main__":
    main()

