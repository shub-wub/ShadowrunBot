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

def changeEloScore(player_id: str, new_elo_score: int):
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        

    database = client[database_name]

    player_collection = database[player_collection_name]
    player = player_collection.find_one({"discordId": player_id})
    if not player:
        print("Could not find the player with Discord ID:", player_id)
        return -1
    
    filter = {'discordId': player_id}
    new_rating_value = { '$set': {'rating': new_elo_score}}
    try:
        player_collection.update_one(filter, new_rating_value)
    except:
        print("Could not update the elo score of player with Discord ID:", player_id)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
                    prog='ChangePlayerElo',
                    description='Changes a specific player\'s ELO to a specific amount')
    parser.add_argument('-p', dest="playerDiscordId")
    parser.add_argument('-e', dest="newEloScore")
    args = parser.parse_args()
    if type(args.playerDiscordId) != type(str):
        args.playerDiscordId = str(args.playerDiscordId)
    changeEloScore(args.playerDiscordId, args.newEloScore)

