#!/bin/bash
git pull
echo "Building ogar-controller"
cd controller
cp -R ../datafiles ./
docker build -t michaelleehobbs/ogar-controller:latest .
docker push michaelleehobbs/ogar-controller
echo "Building haproxy"
cd ../haproxy
docker build -t michaelleehobbs/ogar-haproxy:latest .
docker push michaelleehobbs/ogar-haproxy
echo "Building web"
cd ../web
docker build -t michaelleehobbs/ogar-web:latest .
docker push michaelleehobbs/ogar-web
echo "Building client"
cd ../client
docker build -t michaelleehobbs/ogar-client:latest .
docker push michaelleehobbs/ogar-client
echo "Building core"
cd ../core
docker build -t michaelleehobbs/ogar-core:latest .
docker push michaelleehobbs/ogar-core