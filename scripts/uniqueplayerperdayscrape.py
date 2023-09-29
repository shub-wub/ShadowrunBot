from datetime import datetime, timedelta, timezone


print(datetime.now(timezone.utc))
print((datetime.now(timezone.utc) - timedelta(16)).date)

import discord
import os

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

days_of_history_to_check = 16
match_days = [[] for _ in range(days_of_history_to_check)]
unique_players_per_day = [set() for _ in range(days_of_history_to_check)]

intents = discord.Intents.default()
intents.message_content = True

dclient = discord.Client(intents=intents)
@dclient.event
async def on_ready():
    print(f'Logged on as {dclient.user}!')
    match_channel = await dclient.fetch_channel('1112491115858374798')
    try:
        mclient = MongoClient(databaseToken)
        print("Connected to MongoDB successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        

    print("Fetching DB credentials")
    database = mclient[database_name]

    matches_collection = database[matches_collection_name]
    matchplayers_collection = database[matchplayers_collection_name]
    matches = matches_collection.find({}).sort('_id', -1)
    total_matches = matches_collection.count_documents({})
    currenttime = datetime.now(timezone.utc) + timedelta(hours=6)
    cutoffdate = currenttime - timedelta(days=days_of_history_to_check)
    print("Beginning unique player scraping")
    i = 0
    for _match in matches:
        i += 1
        print("Processing ", str(i) + "/" + str(total_matches), end=" ")
        matchMessageId = _match['messageId']
        try:
            msg = await match_channel.fetch_message(matchMessageId)
        except:
            print("Couldn't find message with ID", matchMessageId, "in Matches Channel")
            continue
        if not msg:
            continue
        matchdate = msg.created_at
        
        print("Match was played on", matchdate, end=" ")
        if matchdate < cutoffdate:
            print("and is older than {days_of_history_to_check} days")
            continue
        else:
            print("which was", (currenttime - matchdate).days, "days ago")
            match_days[(currenttime - matchdate).days].append(matchMessageId)

    
    for match_day in range(len(match_days)):
        print("Processing day", match_day, "/", days_of_history_to_check, "for unique players")
        for matchMessageId in match_days[match_day]:
            match_players = matchplayers_collection.find({'matchMessageId': matchMessageId})
            for match_player in match_players:
                if match_player['discordId'] not in unique_players_per_day[match_day]:
                    unique_players_per_day[match_day].add(match_player['discordId'])
    
    for day in range(days_of_history_to_check, 0, -1):
        print(day, " days ago", len(unique_players_per_day[day - 1]), "unique players played among", len(match_days[day - 1]), "matches on",
              (datetime.now(tz=timezone.utc) - timedelta(day)).date())



dclient.run(os.getenv('token'))