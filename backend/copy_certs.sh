#!/bin/bash

if [ ! -d /var/keys ]; then
    mkdir /var/keys
fi

if [ ! -L /var/keys/fullchain.crt ]; then
    ln -s /var/letsencrypt/live/$DOMAIN/fullchain.pem /var/keys/fullchain.crt
fi

if [ ! -L /var/keys/privkey.key ]; then
    ln -s /var/letsencrypt/live/$DOMAIN/privkey.pem /var/keys/privkey.key
fi
