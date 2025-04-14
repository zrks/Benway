#!/usr/bin/env bash
# This script is used to initialize the environment for the project.
echo "setting it up..."

apt update && apt install -y \
    docker.io \
    docker-compose

echo "yo" > /tmp/yo.txt

cat /tmp/yo.txt
