#!/bin/sh

port=${CUSTOM_PORT:-20000}
name=$(hostname)
socat TCP-LISTEN:80,fork SYSTEM:"echo 'Hello from $name:80'" &
socat TCP-LISTEN:443,fork SYSTEM:"echo 'Hello from $name:443'" &
socat TCP-LISTEN:"$port",fork SYSTEM:"echo 'Hello from $name:$port'" &

exec "$@"