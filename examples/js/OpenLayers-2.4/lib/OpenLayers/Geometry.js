/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/release-license.txt 
 * for the full text of the license. */
 
/**
 * @class
 * @requires OpenLayers/Format/WKT.js
 * @requires OpenLayers/Feature/Vector.js
 */
OpenLayers.Geometry = OpenLayers.Class.create();
OpenLayers.Geometry.prototype = {

    /** @type String */
    id: null,

    /** This is set when a Geometry is added as Component of another Geometry
     * 
     * @type OpenLayers.Geometry */
    parent: null,

    /** @type OpenLayers.Bounds */
    bounds: null,

    /**
     * @constructor
     */
    initialize: function() {
        this.id = OpenLayers.Util.createUniqueID(this.CLASS_NAME+ "_");
    },
    
    /**
     * 
     */
    destroy: function() {
        this.id = null;

        this.bounds = null;

    },
    
    /**
     * Set the bounds for this Geometry.
     * 
     * @param {OpenLayers.Bounds} object
     */
    setBounds: function(bounds) {
        if (bounds) {
            this.bounds = bounds.clone();
        }
    },
    
    /**
     * Nullify this components bounds and that of its parent as well.
     */
    clearBounds: function() {
        this.bounds = null;
        if (this.parent) {
            this.parent.clearBounds();
        }    
    },
    
    /**
     * Extend the existing bounds to include the new bounds. 
     * If geometry's bounds is not yet set, then set a new Bounds.
     * 
     * @param {OpenLayers.Bounds} newBounds
     */
    extendBounds: function(newBounds){
        var bounds = this.getBounds();
        if (!bounds) {
            this.setBounds(newBounds);
        } else {
            this.bounds.extend(newBounds);
        }
    },
    
    /**
     * Get the bounds for this Geometry. If bounds is not set, it 
     * is calculated again, this makes queries faster.
     * 
     * @type OpenLayers.Bounds
     */
    getBounds: function() {
        if (this.bounds == null) {
            this.calculateBounds();
        }
        return this.bounds;
    },
    
    /** Recalculate the bounds for the geometry. 
     * 
     */
    calculateBounds: function() {
        //
        // This should be overridden by subclasses.
        //
    },
    
    /**
     * Note: This is only an approximation based on the bounds of the 
     * geometry.
     * 
     * @param {OpenLayers.LonLat} lonlat
     * @param {float} toleranceLon Optional tolerance in Geometric Coords
     * @param {float} toleranceLat Optional tolerance in Geographic Coords
     * 
     * @returns Whether or not the geometry is at the specified location
     * @type Boolean
     */
    atPoint: function(lonlat, toleranceLon, toleranceLat) {
        var atPoint = false;
        var bounds = this.getBounds();
        if ((bounds != null) && (lonlat != null)) {

            var dX = (toleranceLon != null) ? toleranceLon : 0;
            var dY = (toleranceLat != null) ? toleranceLat : 0;
    
            var toleranceBounds = 
                new OpenLayers.Bounds(this.bounds.left - dX,
                                      this.bounds.bottom - dY,
                                      this.bounds.right + dX,
                                      this.bounds.top + dY);

            atPoint = toleranceBounds.containsLonLat(lonlat);
        }
        return atPoint;
    },
    
    /**
     * @returns The length of the geometry
     * @type float
     */
    getLength: function() {
        //to be overridden by geometries that actually have a length
        //
        return 0.0;
    },

    /**
     * @returns The area of the geometry
     * @type float
     */
    getArea: function() {
        //to be overridden by geometries that actually have an area
        //
        return 0.0;
    },

    /**
     * @returns the Well-Known Text representation of a geometry
     * @type String
     */
    toString: function() {
        return OpenLayers.Format.WKT.prototype.write(
            new OpenLayers.Feature.Vector(this)
        );
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Geometry"
};
