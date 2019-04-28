#!/bin/bash

if [ ! -d /var/keys ]; then
    mkdir /var/keys
fi

if [ ! -f /var/keys/fullchain.crt ]; then
    ln -s /var/letsencrypt/live/$DOMAIN/fullchain.pem /var/keys/fullchain.crt
fi

if [ ! -f /var/keys/privkey.key ]; then
    ln -s /var/letsencrypt/live/$DOMAIN/privkey.pem /var/keys/privkey.key
fi
