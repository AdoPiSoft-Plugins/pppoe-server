#!/bin/sh
if [ $NODE_ENV != "development" ]; then
  ppp=$1
  wan=$2
  mark=9

  iptables -t mangle -D FORWARD -o $ppp -j MARK --set-mark $mark || true
  iptables -t mangle -D FORWARD -i $ppp -j MARK --set-mark $mark || true
  ip link delete $ppp || true
fi