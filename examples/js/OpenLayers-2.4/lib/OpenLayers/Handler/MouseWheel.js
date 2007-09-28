/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/release-license.txt 
 * for the full text of the license. */

/**
 * Handler for wheel up/down events.
 * 
 * @class
 * @requires OpenLayers/Handler.js
 */
OpenLayers.Handler.MouseWheel = OpenLayers.Class.create();
OpenLayers.Handler.MouseWheel.prototype = OpenLayers.Class.inherit( OpenLayers.Handler, {
    /** @type function **/
    wheelListener: null,

    /** @type OpenLayers.Pixel
     *  @private
     * 
     *  mousePosition is necessary because evt.clientX/Y is buggy in Moz on
     *  wheel events, so we cache and use the value from the last mousemove.
     **/
    mousePosition: null,

    /**
     * @constructor
     *
     * @param {OpenLayers.Control} control
     * @param {Object} callbacks An object containing a single function to be
     *                          called when the drag operation is finished.
     *                          The callback should expect to recieve a single
     *                          argument, the point geometry.
     * @param {Object} options
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
        this.wheelListener = this.onWheelEvent.bindAsEventListener(this);
    },

    /**
     * 
     */    
    destroy: function() {
        this.deactivate();
        this.wheelListener = null;
        OpenLayers.Handler.prototype.destroy.apply(this, arguments);
    },

    /**
     *  Mouse ScrollWheel code thanks to http://adomas.org/javascript-mouse-wheel/
     */

    /** Catch the wheel event and handle it xbrowserly
     * 
     * @param {Event} e
     */
    onWheelEvent: function(e){
        // first check keyboard modifiers
        if (!this.checkModifiers(e)) return;

        // first determine whether or not the wheeling was inside the map
        var inMap = false;
        var elem = OpenLayers.Event.element(e);
        while(elem != null) {
            if (this.map && elem == this.map.div) {
                inMap = true;
                break;
            }
            elem = elem.parentNode;
        }
        
        if (inMap) {
            var delta = 0;
            if (!e) {
                e = window.event;
            }
            if (e.wheelDelta) {
                delta = e.wheelDelta/120; 
                if (window.opera) {
                    delta = -delta;
                }
            } else if (e.detail) {
                delta = -e.detail / 3;
            }
            if (delta) {
                // add the mouse position to the event because mozilla has a bug
                // with clientX and clientY (see https://bugzilla.mozilla.org/show_bug.cgi?id=352179)
                // getLonLatFromViewPortPx(e) returns wrong values
                e.xy = this.mousePosition;
                if (delta < 0) {
                   this.callback("down", [e, delta]);
                } else {
                   this.callback("up", [e, delta]);
                }
            }
            
            //only wheel the map, not the window
            OpenLayers.Event.stop(e);
        }
    },

    mousemove: function (evt) {
        this.mousePosition = evt.xy;
    },

    activate: function (evt) {
        if (OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            //register mousewheel events specifically on the window and document
            var wheelListener = this.wheelListener;
            OpenLayers.Event.observe(window, "DOMMouseScroll", wheelListener);
            OpenLayers.Event.observe(window, "mousewheel", wheelListener);
            OpenLayers.Event.observe(document, "mousewheel", wheelListener);
            return true;
        } else {
            return false;
        }
    },

    deactivate: function (evt) {
        if (OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            // unregister mousewheel events specifically on the window and document
            var wheelListener = this.wheelListener;
            OpenLayers.Event.stopObserving(window, "DOMMouseScroll", wheelListener);
            OpenLayers.Event.stopObserving(window, "mousewheel", wheelListener);
            OpenLayers.Event.stopObserving(document, "mousewheel", wheelListener);
            return true;
        } else {
            return false;
        }
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Handler.MouseWheel"
});
