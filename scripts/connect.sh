#!/bin/sh
ppp=$1
wan=$2
down=$3
up=$4
mark=9

iptables -t mangle -D FORWARD -o $ppp -j MARK --set-mark $mark || true
iptables -t mangle -D FORWARD -i $ppp -j MARK --set-mark $mark || true
iptables -t mangle -A FORWARD -o $ppp -j MARK --set-mark $mark || true
iptables -t mangle -A FORWARD -i $ppp -j MARK --set-mark $mark || true

tc qdisc del dev $ppp root || true
tc qdisc del dev $ppp handle ffff: ingress || true

tc qdisc add dev $ppp root tbf rate ${down}kbit latency 50ms burst ${down}kbit || true
tc qdisc add dev $ppp handle ffff: ingress || true
tc filter add dev $ppp parent ffff: u32 match u32 0 0 police rate ${up}kbit burst ${up}kbit || true