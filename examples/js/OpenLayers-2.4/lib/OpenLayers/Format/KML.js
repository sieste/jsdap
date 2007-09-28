/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/release-license.txt 
 * for the full text of the license. */

/**
 * Read only KML. 
 * @requires OpenLayers/Format.js
 * @requires OpenLayers/Feature/Vector.js
 * @requires OpenLayers/Ajax.js
 */
OpenLayers.Format.KML = OpenLayers.Class.create();
OpenLayers.Format.KML.prototype = 
  OpenLayers.Class.inherit( OpenLayers.Format, {
    
    featureNS: "http://mapserver.gis.umn.edu/mapserver",
    
    collectionName: "FeatureCollection",
    
    kmlns: "http://earth.google.com/kml/2.0",
    
    /**
     * Read data from a string, and return a list of features. 
     * 
     * @param {string|XMLNode} data data to read/parse.
     */
     read: function(data) {
        if (typeof data == "string") { 
            data = OpenLayers.parseXMLString(data);
        }    
        var featureNodes = OpenLayers.Ajax.getElementsByTagNameNS(data, this.kmlns, "", "Placemark");
        
        var features = [];
        
        // Process all the featureMembers
        for (var i = 0; i < featureNodes.length; i++) {
            var feature = this.parseFeature(featureNodes[i]);

            if (feature) {
                features.push(feature);
            }
        }
        return features;
     },

     /**
      * This function is the core of the KML parsing code in OpenLayers.
      * It creates the geometries that are then attached to the returned
      * feature, and calls parseAttributes() to get attribute data out.
      * @param DOMElement xmlNode
      */
     parseFeature: function(xmlNode) {
        var geom;
        var p; // [points,bounds]

        var feature = new OpenLayers.Feature.Vector();

        // match Point
        if (OpenLayers.Ajax.getElementsByTagNameNS(xmlNode,
            this.kmlns, "", "Point").length != 0) {
            var point = OpenLayers.Ajax.getElementsByTagNameNS(xmlNode,
                this.kmlns, "", "Point")[0];
            
            p = this.parseCoords(point);
            if (p.points) {
                geom = p.points[0];
                // TBD Bounds only set for one of multiple geometries
                geom.extendBounds(p.bounds);
            }
        
        // match LineString 
        } else if (OpenLayers.Ajax.getElementsByTagNameNS(xmlNode,
            this.kmlns, "", "LineString").length != 0) {
            var linestring = OpenLayers.Ajax.getElementsByTagNameNS(xmlNode,
                this.kmlns, "", "LineString")[0];
            p = this.parseCoords(linestring);
            if (p.points) {
                geom = new OpenLayers.Geometry.LineString(p.points);
                // TBD Bounds only set for one of multiple geometries
                geom.extendBounds(p.bounds);
            }
        }
        
        feature.geometry = geom;
        feature.attributes = this.parseAttributes(xmlNode);
        
        return feature;
    },        
    
    /**
     * recursive function parse the attributes of a KML node.
     * Searches for any child nodes which aren't geometries,
     * and gets their value.
     * @param DOMElement xmlNode
     */
    parseAttributes: function(xmlNode) {
        var nodes = xmlNode.childNodes;
        var attributes = {};
        for(var i = 0; i < nodes.length; i++) {
            var name = nodes[i].nodeName;
            var value = OpenLayers.Util.getXmlNodeValue(nodes[i]);
            // Ignore Geometry attributes
            // match ".//gml:pos|.//gml:posList|.//gml:coordinates"
            if((name.search(":pos")!=-1)
              ||(name.search(":posList")!=-1)
              ||(name.search(":coordinates")!=-1)){
               continue;    
            }
            
            // Check for a leaf node
            if((nodes[i].childNodes.length == 1 && nodes[i].childNodes[0].nodeName == "#text")
                || (nodes[i].childNodes.length == 0 && nodes[i].nodeName!="#text")) {
                attributes[name] = value;
            }
            OpenLayers.Util.extend(attributes, this.parseAttributes(nodes[i]))
        }   
        return attributes;
    },
    
    /**
     * Extract Geographic coordinates from an XML node.
     * @private
     * @param {XMLNode} xmlNode 
     * 
     * @return an array of OpenLayers.Geometry.Point points.
     * @type Array
     */
    parseCoords: function(xmlNode) {
        var p = [];
        p.points = [];
        // TBD: Need to handle an array of coordNodes not just coordNodes[0]
        
        var coordNodes = OpenLayers.Ajax.getElementsByTagNameNS(xmlNode, this.kmlns, "", "coordinates")[0];
        var coordString = OpenLayers.Util.getXmlNodeValue(coordNodes);
        
        var firstCoord = coordString.split(" ");
        
        while (firstCoord[0] == "") 
            firstCoord.shift();
        
        var dim = firstCoord[0].split(",").length;

        // Extract an array of Numbers from CoordString
        var nums = (coordString) ? coordString.split(/[, \n\t]+/) : [];
        
        
        // Remove elements caused by leading and trailing white space
        while (nums[0] == "") 
            nums.shift();
        
        while (nums[nums.length-1] == "") 
            nums.pop();
        
        for(i = 0; i < nums.length; i = i + dim) {
            x = parseFloat(nums[i]);
            y = parseFloat(nums[i+1]);
            p.points.push(new OpenLayers.Geometry.Point(x, y));
            
            if (!p.bounds) {
                p.bounds = new OpenLayers.Bounds(x, y, x, y);
            } else {
                p.bounds.extend(x, y);
            }
        }
        return p;
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Format.KML" 
    
});     
