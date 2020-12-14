#!/bin/sh
sudo apt-get install ppp -y
ROOTPATH=/opt/adopisoft/plugins/pppoe-server/scripts
cd $ROOTPATH/rp-pppoe-3.14/src/
./configure
make
sudo make install
mkdir /etc/ppp || true
cp -rf $ROOTPATH/etc/ppp/* /etc/ppp/
rm -rf $ROOTPATH/rp-pppoe-3.14