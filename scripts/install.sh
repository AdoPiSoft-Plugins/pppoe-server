#!/bin/sh

if [ $NODE_ENV = "development" ]; then
  PPP_PATH=$APPDIR/release/@adopisoft/plugins/pppoe-server/tmp/ppp
  ROOTPATH=$APPDIR/release/@adopisoft/plugins/pppoe-server/

  mkdir $PPP_PATH || true
  cp -rf $ROOTPATH/etc/ppp/* $PPP_PATH/
else
  ROOTPATH=$APPDIR/release/@adopisoft/plugins/pppoe-server/
  sudo apt-get install ppp -y
  PPP_PATH=/etc/ppp
  chmod a+x $ROOTPATH/scripts/*.sh
  cd $ROOTPATH/rp-pppoe-3.14/src/
  ./configure
  make clean
  make
  sudo make install
  mkdir $PPP_PATH || true
  cp -rf $ROOTPATH/etc/ppp/* $PPP_PATH/
  rm -rf $ROOTPATH/rp-pppoe-3.14
  rm -rf $ROOTPATH/etc
fi
