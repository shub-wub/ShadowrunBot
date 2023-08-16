import os
from dotenv import load_dotenv
from math import floor
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'ShadowrunDB2')
guild_collection_name = os.getenv('GUILD_COLLECTION_NAME', 'guilds')
player_collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')

guild_id = "1046846781704642631"

diamond_pct_adj = 0.25
platinum_pct_adj = 0.15
gold_pct_adj = 0.1
silver_pct_adj = 0.05
bronze_pct_adj = 0

starting_elo = 1000

diamond_elo_base = 1400
platinum_elo_base = 1300
gold_elo_base = 1200
silver_elo_base = 1100
bronze_elo_base = 1000

# players = [['111613988076310528', "BumJamas {D}     |"],
#            ['1046992393745989734', "Shabadime {D}    |"],
#            ['98635549719396352',  "A.Rassick {P}    |"],
#            ['722200170003038219', "Mandarin {P}     |"],
#            ['875064982180597832', "Final {G}        |"],
#            ['624731881371336736', "Atsona {G}       |"],
#            ['670444654155530240', "Bryman360 {S}    |"],
#            ['757060966952337509', "FluffyBob {S}    |"],
#            ['421558155718295553', "hormelVEVO {B}   |"],
#            ['693542711890018334', "BloodBrother {N} |"]]

discord_ids = {'111613988076310528': "BumJamas",
               '1046992393745989734': "Shaba",
               '98635549719396352': "Rassick",
               '722200170003038219': "Mandarin",
               '875064982180597832': "Final",
               '624731881371336736': "Atsona",
               '670444654155530240': "Bryman360",
               '757060966952337509': "FluffyBob",
               '421558155718295553': "hormelVEVO",
               '693542711890018334': "BloodBrother",
               }

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

    players = player_collection.find({})
    if not players:
        print("Could not find any players in players collection")
        return -1
    # print("\n\n\n")
    # print("--------------------------------------------")
    # print("Player           |", "Old  |" "Algo2|", "Algo3|", "Hybrid")
    # print("--------------------------------------------")
    for player in players:

        old_elo_score = player['rating']
        # new_score_1 = resetAlgo1(guild, old_elo_score)
        # new_score_2 = resetAlgo2(old_elo_score)
        new_score_3 = resetAlgo3(guild, old_elo_score)
        # new_score_4 = resetAlgo4(old_elo_score)
        # new_score_5 = resetAlgo5(guild, old_elo_score)

        # print(player_info[1], old_elo_score, "|", new_score_2, "|", new_score_1, "|", new_score_3 )
        filter = {'discordId': player['discordId']}
        new_rating_value = { '$set': {'rating': new_score_3, 'wins': 0, 'losses': 0}}
        try:
            player_collection.update_one(filter, new_rating_value)
            if player['discordId'] in discord_ids:
                print("-------------Updated user", discord_ids[player['discordId']], "from", old_elo_score, "to", new_score_3)
            else:
                print("Updated player.id", player['discordId'], "from", old_elo_score, "to", new_score_3)
        except:
            print("Could not update the elo score of player with Discord ID:", player['discordId'])
        # player = player_collection.find_one({'discordId': player_info[0]})


def resetAlgo1(guild, old_elo_score):
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
    if old_elo_score >= diamond_min and old_elo_score <= diamond_max:
        new_elo_score = old_elo_score * (1 - diamond_pct_adj)
    elif old_elo_score >= platinum_min and old_elo_score <= platinum_max:
        new_elo_score = old_elo_score * (1 - platinum_pct_adj)
    elif old_elo_score >= gold_min and old_elo_score <= gold_max:
        new_elo_score = old_elo_score * (1 - gold_pct_adj)
    elif old_elo_score >= silver_min and old_elo_score <= silver_max:
        new_elo_score = old_elo_score * (1 - silver_pct_adj)
    elif old_elo_score >= bronze_min and old_elo_score <= bronze_max:
        new_elo_score = old_elo_score * (1 - bronze_pct_adj)
    return floor(new_elo_score)


def resetAlgo2(old_elo_score):
    return floor((old_elo_score + starting_elo) / 2)


def resetAlgo4(old_elo_score):
    return floor((old_elo_score + starting_elo + starting_elo) / 3)


def resetAlgo3(guild, old_elo_score):
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
    if old_elo_score >= diamond_min and old_elo_score <= diamond_max:
        new_elo_score = floor((old_elo_score + platinum_elo_base) / 2)
    elif old_elo_score >= platinum_min and old_elo_score <= platinum_max:
        new_elo_score = floor((old_elo_score + platinum_elo_base) / 2)
    elif old_elo_score >= gold_min and old_elo_score <= gold_max:
        new_elo_score = floor((old_elo_score + gold_elo_base) / 2)
    elif old_elo_score >= silver_min and old_elo_score <= silver_max:
        new_elo_score = floor((old_elo_score + silver_elo_base) / 2)
    elif old_elo_score >= bronze_min and old_elo_score <= bronze_max:
        new_elo_score = floor((old_elo_score + bronze_elo_base) / 2)

    return floor(new_elo_score)


def resetAlgo5(guild, old_elo_score):
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
    if old_elo_score >= diamond_min and old_elo_score <= diamond_max:
        new_elo_score = floor((old_elo_score + diamond_elo_base) / 2)
    elif old_elo_score >= platinum_min and old_elo_score <= platinum_max:
        new_elo_score = floor((old_elo_score + platinum_elo_base) / 2)
    elif old_elo_score >= gold_min and old_elo_score <= gold_max:
        new_elo_score = floor((old_elo_score + gold_elo_base) / 2)
    elif old_elo_score >= silver_min and old_elo_score <= silver_max:
        new_elo_score = floor((old_elo_score + silver_elo_base) / 2)
    elif old_elo_score >= bronze_min and old_elo_score <= bronze_max:
        new_elo_score = floor((old_elo_score + bronze_elo_base) / 2)

    return floor(new_elo_score)




if __name__ == "__main__":
    softEloReset()
