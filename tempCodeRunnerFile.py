import memcache
client = memcache.Client(['127.0.0.1:11211'])
client.set('key', 'value')
print(client.get('key'))
