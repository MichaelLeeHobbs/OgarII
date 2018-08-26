#!/bin/bash
cd controller
docker build -t ogar-controller .
cd ../haproxy
docker build -t ogar-haproxy .
cd ../web
docker build -t ogar-web .