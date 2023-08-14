import argparse
import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'test')
guild_collection_name = os.getenv('GUILD_COLLECTION_NAME', 'guilds')
player_collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')

guild_id = "930362820627943495"

diamond_adj = 0.25
platinum_adj = 0.15
gold_adj = 0.1
silver_adj = 0.05
bronze_adj = 0

def softEloReset():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        

    database = client[database_name]

    guilds_collection = database[guild_collection_name]
    player_collection = database[player_collection_name]
    guild = guilds_collection.find_one({"guildId" : guild_id})
    if not guild:
        print("Could not find any guild with ID", guild_id)
        return -1
    diamond_min = guild["diamondMin"]
    diamond_max = guild["diamondMax"]
    platinum_min = guild["platinumMin"]
    platinum_max = guild["platinumMax"]
    gold_min = guild["goldMin"]
    gold_max = guild["goldMax"]
    silver_min = guild["silverMin"]
    silver_max = guild["silverMax"]
    bronze_min = guild["bronzeMin"]
    bronze_max = guild["bronzeMax"]

    players = player_collection.find({})
    if not players:
        print("Could not find any players in players collection")
        return -1
    
    for player in players:
        old_elo_score = player['ranking']
        if old_elo_score >= diamond_min and old_elo_score <= diamond_max:
            new_elo_score = old_elo_score * (1 - diamond_adj)
        elif old_elo_score >= platinum_min and old_elo_score <= platinum_max:
            new_elo_score = old_elo_score * (1 - platinum_adj)
        elif old_elo_score >= gold_min and old_elo_score <= gold_max:
            new_elo_score = old_elo_score * (1 - gold_adj)
        elif old_elo_score >= silver_min and old_elo_score <= silver_max:
            new_elo_score = old_elo_score * (1 - silver_adj)
        elif old_elo_score >= bronze_min and old_elo_score <= bronze_max:
            new_elo_score = old_elo_score * (1 - bronze_adj)
        filter = {'discordId': player['discordId']}
        new_rating_value = { '$set': {'rating': new_elo_score}}
        try:
            player_collection.update_one(filter, new_rating_value)
        except:
            print("Could not update the elo score of player with Discord ID:", player['discordId'])

if __name__ == "__main__":
    softEloReset()

