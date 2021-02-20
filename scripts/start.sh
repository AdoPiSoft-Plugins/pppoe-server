#!/bin/sh
killall pppd || true
killall pppoe-server || true
ppp=$1
pppoe-server -C isp -L 172.32.50.1 -p /etc/ppp/ipaddress_pool -I $ppp -m 1412