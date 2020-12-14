#!/bin/sh
ppp=$1
wan=$2

iptables -D FORWARD -o $ppp -i $wan -j ACCEPT || true
iptables -D FORWARD -i $ppp -o $wan -j ACCEPT || true
