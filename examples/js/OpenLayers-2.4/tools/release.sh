#!/bin/sh
VERSION=$1
echo "Building OpenLayers $VERSION"
svn export http://svn.openlayers.org/tags/openlayers/release-$VERSION OpenLayers-$VERSION
cd OpenLayers-$VERSION/build
./build.py full
mkdir /www/openlayers/htdocs/api/$VERSION
cp OpenLayers.js /www/openlayers/htdocs/api/$VERSION
cd ..
cp -a img/ /www/openlayers/htdocs/api/$VERSION
cp -a theme/ /www/openlayers/htdocs/api/$VERSION
rm tools/*.pyc
cd ..
tar -zvcf OpenLayers-$VERSION.tar.gz OpenLayers-$VERSION
zip -9r OpenLayers-$VERSION.zip OpenLayers-$VERSION
cp OpenLayers-$VERSION.{tar.gz,zip} /www/openlayers/htdocs/download/
