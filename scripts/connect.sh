#!/bin/sh
ppp=$1
wan=$2
down=$3
up=$4

iptables -D FORWARD -o $ppp -i $wan -j ACCEPT || true
iptables -D FORWARD -i $ppp -o $wan -j ACCEPT || true
iptables -I FORWARD -o $ppp -i $wan -j ACCEPT || true
iptables -I FORWARD -i $ppp -o $wan -j ACCEPT || true

tc qdisc del dev $ppp root || true
tc qdisc del dev $ppp handle ffff: ingress || true

tc qdisc add dev $ppp root tbf rate ${down}kbit latency 50ms burst ${down}kbit || true
tc qdisc add dev $ppp handle ffff: ingress || true
tc filter add dev $ppp parent ffff: u32 match u32 0 0 police rate ${up}kbit burst ${up}kbit || true