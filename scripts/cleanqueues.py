import os
from dotenv import load_dotenv
from pymongo import DESCENDING
from pymongo.mongo_client import MongoClient

dotenv_path = os.path.abspath(os.path.join(os.path.dirname( __file__ ), '..', '.env'))

load_dotenv(dotenv_path=dotenv_path)
databaseToken = os.getenv('databaseToken')
database_name = os.getenv('DB_NAME', 'ShadowrunDB2')
queue_collection_name = os.getenv('QUEUE_COLLECTION_NAME', 'queues')


queue_exceptions = {'1141413027950899320',
                    '1141413088772501505',
                    '1141413134125518999',
                    '1141413262009847988'} # Populate with queue message ID strings of queues you want to skip and leave data for in the DB

queue_exception_filter = { '$nor' : [{"messageId" : queue_exception} for queue_exception in queue_exceptions]}

def main():
    try:
        client = MongoClient(databaseToken)
        print("Connected successfully!")
    except:
        print("Could not connect to MongoDB")
        return -1
        
    database = client[database_name]

    queue_collection = database[queue_collection_name]

    queue_count = queue_collection.count_documents(queue_exception_filter)
    total_queues_count = queue_collection.count_documents({})

    print("Found", str(queue_count) + "/" + str(total_queues_count), "queues")
    
    queues_deleted = queue_collection.delete_many(queue_exception_filter)

    print("Deleted", queues_deleted.deleted_count, "queues")

    print("Queues still in DB:", queue_collection.count_documents({}))
        

if __name__ == "__main__":
    main()
