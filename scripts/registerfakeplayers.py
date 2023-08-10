import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'test')
collection_name = os.getenv('PLAYER_COLLECTION_NAME', 'players')

players_to_register = 50

def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        

    database = client[database_name]

    player_collection = database[collection_name]

    for fake_id_num in range(1, players_to_register + 1):
        player = player_collection.find_one({"discordId": str(fake_id_num)})
        if player:
            continue
        player = {
            'discordId': str(fake_id_num),
            'rating': 1000 + players_to_register - fake_id_num,
            'wins': 0,
            'losses': 0,
            'kills': 0,
            'deaths': 0,
            'resurrects': 0,
            'bonusTotal': 0,
            'friendlyFire': 0
        }
        post_id = player_collection.insert_one(player).inserted_id
        print("PlayerID", fake_id_num, "registered", post_id)


if __name__ == "__main__":
    main()
    