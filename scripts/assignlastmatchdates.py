import asyncio
import discord
import os

from datetime import datetime, timedelta
from dotenv import load_dotenv
from math import floor
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'ShadowrunDB2')
matches_collection_name = os.getenv('MATCHS_COLLECTION_NAME', 'matches')
matchplayers_collection_name = os.getenv('MATCHPLAYERS_COLLECTION_NAME', 'matchplayers')
player_collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')


intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)
@client.event
async def on_ready():
    print(f'Logged on as {client.user}!')
    match_channel = await client.fetch_channel('1112491115858374798')
    try:
        mclient = MongoClient(databaseToken)
        print("Connected to MongoDB successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
    recent_matches = []
        

    database = mclient[database_name]

    player_collection = database[player_collection_name]
    matches_collection = database[matches_collection_name]
    matchplayers_collection = database[matchplayers_collection_name]
    matches = matches_collection.find({}).sort('_id', -1)
    total_matches = matches_collection.count_documents({})
    currenttime = datetime.now()
    cutoffdate = currenttime - timedelta(days=21)
    active_players = 0
    i = 0
    for _match in matches:
        i += 1
        print("Processing ", str(i) + "/" + str(total_matches))
        matchMessageId = _match['messageId']
        try:
            msg = await match_channel.fetch_message(matchMessageId)
        except:
            print("Couldn't find message with ID", matchMessageId, "in Matches Channel")
            continue
        if not msg:
            continue
        matchdate = msg.created_at
        matchdate = matchdate.replace(tzinfo=None)
        print("Match was played on", matchdate, end=" ")
        if  cutoffdate > matchdate:
            print("and is older than 21 days")
        else:
            print()
            matchplayers = matchplayers_collection.find({'matchMessageId': matchMessageId})
            for matchplayer in matchplayers:
                discordId = matchplayer['discordId']
                try:
                    player = player_collection.find_one({'discordId': discordId})
                    if player and ('lastMatchDate' not in player or player['lastMatchDate'] < matchdate):
                        if 'lastMatchDate' not in player:
                            active_players += 1
                        filter = {'discordId': player['discordId']}
                        new_matchdate_value = { '$set': {'lastMatchDate': matchdate}}
                        player_collection.update_one(filter, new_matchdate_value)
                        print("Player with ID", discordId, "latest match so far was on", matchdate)
                except:
                    print("Error with Player ID", discordId, "- Moving On")
                    continue

    # Search for players who still don't have a lastMatchDate and inject in a date from long ago
    
    filter = {'lastMatchDate': {'$exists': False}}
    longtimeago = currenttime - timedelta(days=120)
    new_matchdate_value = {'$set': {'lastMatchDate': longtimeago}}
    inactive_players = player_collection.update_many(filter,new_matchdate_value)
    print("Recent Matches:")
    for _match in recent_matches:
        print(_match)
    print("Active Players:", active_players)
    print("Inactive Players:", inactive_players.modified_count)




client.run(os.getenv('token'))
