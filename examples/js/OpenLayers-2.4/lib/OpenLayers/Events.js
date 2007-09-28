/* Copyright (c) 2006 MetaCarta, Inc., published under the BSD license.
 * See http://svn.openlayers.org/trunk/openlayers/release-license.txt 
 * for the full text of the license. */

/**
 *  @requires OpenLayers/Util.js
 * 
 *  @class (Not really a class, but kind of)
 * 
 */
OpenLayers.Event = {

    /** A hashtable cache of the event observers.
     *   Keyed by element._eventCacheID
     * 
     * @type Object
     */
    observers: false,
    
    /** @final @type int */
    KEY_BACKSPACE: 8,

    /** @final @type int */
    KEY_TAB: 9,

    /** @final @type int */
    KEY_RETURN: 13,

    /** @final @type int */
    KEY_ESC: 27,

    /** @final @type int */
    KEY_LEFT: 37,

    /** @final @type int */
    KEY_UP: 38,

    /** @final @type int */
    KEY_RIGHT: 39,

    /** @final @type int */
    KEY_DOWN: 40,

    /** @final @type int */
    KEY_DELETE: 46,


    /**
     * @param {Event} event
     * 
     * @returns The element that caused the alert
     * @type DOMElement
     */
    element: function(event) {
        return event.target || event.srcElement;
    },

    /**
     * @param {Event} event
     * 
     * @returns Whether or not the event was the result of a left click
     * @type boolean
     */
    isLeftClick: function(event) {
        return (((event.which) && (event.which == 1)) ||
                ((event.button) && (event.button == 1)));
    },

    /** Stops an event from propagating. 
     * 
     * @param {Event} event
     * @param {Boolean} allowDefault If true, we stop the event chain but 
     *                               still allow the default browser 
     *                               behaviour (text selection, radio-button 
     *                               clicking, etc)
     *                               Default false
     */
    stop: function(event, allowDefault) {
        
        if (!allowDefault) { 
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        }
                
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    },

    /** 
     * @param {Event} event
     * @param {String} tagName
     * 
     * @returns The first node with the given tagName, starting from the node 
     *           the event was triggered on and traversing the DOM upwards
     * @type DOMElement
     */
    findElement: function(event, tagName) {
        var element = OpenLayers.Event.element(event);
        while (element.parentNode && (!element.tagName ||
              (element.tagName.toUpperCase() != tagName.toUpperCase())))
            element = element.parentNode;
        return element;
    },

    /** 
     * @param {DOMElement || String} elementParam
     * @param {String} name
     * @param {function} observer
     * @param {Boolean} useCapture
     * 
     */
    observe: function(elementParam, name, observer, useCapture) {
        var element = OpenLayers.Util.getElement(elementParam);
        useCapture = useCapture || false;

        if (name == 'keypress' &&
           (navigator.appVersion.match(/Konqueror|Safari|KHTML/)
           || element.attachEvent)) {
            name = 'keydown';
        }

        //if observers cache has not yet been created, create it
        if (!this.observers) {
            this.observers = new Object();
        }

        //if not already assigned, make a new unique cache ID
        if (!element._eventCacheID) {
            var idPrefix = "eventCacheID_";
            if (element.id) {
                idPrefix = element.id + "_" + idPrefix;
            }
            element._eventCacheID = OpenLayers.Util.createUniqueID(idPrefix);
        }

        var cacheID = element._eventCacheID;

        //if there is not yet a hash entry for this element, add one
        if (!this.observers[cacheID]) {
            this.observers[cacheID] = new Array();
        }

        //add a new observer to this element's list
        this.observers[cacheID].push({
            'element': element,
            'name': name,
            'observer': observer,
            'useCapture': useCapture
        });

        //add the actual browser event listener
        if (element.addEventListener) {
            element.addEventListener(name, observer, useCapture);
        } else if (element.attachEvent) {
            element.attachEvent('on' + name, observer);
        }
    },

    /** Given the id of an element to stop observing, cycle through the 
     *   element's cached observers, calling stopObserving on each one, 
     *   skipping those entries which can no longer be removed.
     * 
     * @param {DOMElement || String} elementParam
     */
    stopObservingElement: function(elementParam) {
        var element = OpenLayers.Util.getElement(elementParam);
        var cacheID = element._eventCacheID;

        this._removeElementObservers(OpenLayers.Event.observers[cacheID]);
    },

    /**
     * @private
     * 
     * @param {Array(Object)} elementObservers Array of (element, name, 
     *                                         observer, usecapture) objects, 
     *                                         taken directly from hashtable
     */
    _removeElementObservers: function(elementObservers) {
        if (elementObservers) {
            for(var i = elementObservers.length-1; i >= 0; i--) {
                var entry = elementObservers[i];
                var args = new Array(entry.element,
                                     entry.name,
                                     entry.observer,
                                     entry.useCapture);
                var removed = OpenLayers.Event.stopObserving.apply(this, args);
            }
        }
    },

    /**
     * @param {DOMElement || String} elementParam
     * @param {String} name
     * @param {function} observer
     * @param {Boolean} useCapture
     * 
     * @returns Whether or not the event observer was removed
     * @type Boolean
     */
    stopObserving: function(elementParam, name, observer, useCapture) {
        useCapture = useCapture || false;
    
        var element = OpenLayers.Util.getElement(elementParam);
        var cacheID = element._eventCacheID;

        if (name == 'keypress') {
            if ( navigator.appVersion.match(/Konqueror|Safari|KHTML/) || 
                 element.detachEvent) {
              name = 'keydown';
            }
        }

        // find element's entry in this.observers cache and remove it
        var foundEntry = false;
        var elementObservers = OpenLayers.Event.observers[cacheID];
        if (elementObservers) {
    
            // find the specific event type in the element's list
            var i=0;
            while(!foundEntry && i < elementObservers.length) {
                var cacheEntry = elementObservers[i];
    
                if ((cacheEntry.name == name) &&
                    (cacheEntry.observer == observer) &&
                    (cacheEntry.useCapture == useCapture)) {
    
                    elementObservers.splice(i, 1);
                    if (elementObservers.length == 0) {
                        delete OpenLayers.Event.observers[cacheID];
                    }
                    foundEntry = true;
                    break; 
                }
                i++;           
            }
        }
    
        //actually remove the event listener from browser
        if (element.removeEventListener) {
            element.removeEventListener(name, observer, useCapture);
        } else if (element && element.detachEvent) {
            element.detachEvent('on' + name, observer);
        }
        return foundEntry;
    },
    
    /** Cycle through all the element entries in the events cache and call
     *   stopObservingElement on each. 
     */
    unloadCache: function() {
        if (OpenLayers.Event.observers) {
            for (var cacheID in OpenLayers.Event.observers) {
                var elementObservers = OpenLayers.Event.observers[cacheID];
                OpenLayers.Event._removeElementObservers.apply(this, 
                                                           [elementObservers]);
            }
            OpenLayers.Event.observers = false;
        }
    },
    
    /** @final @type String */
    CLASS_NAME: "OpenLayers.Event"
};

/* prevent memory leaks in IE */
OpenLayers.Event.observe(window, 'unload', OpenLayers.Event.unloadCache, false);

if (window.Event) {
  OpenLayers.Util.extend(window.Event, OpenLayers.Event);
} else {
  var Event = OpenLayers.Event;
}

/**
 * @class
 */
OpenLayers.Events = OpenLayers.Class.create();
OpenLayers.Events.prototype = {

    /** @final @type Array: supported events */
    BROWSER_EVENTS: [
        "mouseover", "mouseout",
        "mousedown", "mouseup", "mousemove", 
        "click", "dblclick",
        "resize", "focus", "blur"
    ],

    /** Hashtable of Array(Function): events listener functions 
     * @type Object */
    listeners: null,

    /** @type Object: the code object issuing application events */
    object: null,

    /** @type DOMElement: the DOM element receiving browser events */
    element: null,

    /** @type Array: list of support application events */
    eventTypes: null,

    /**
    * @type Function: bound event handler attached to elements
    * @private
    */
    eventHandler: null,

    /** @type Boolean */
    fallThrough: null,

    /**
     * @constructor 
     * 
     * @param {OpenLayers.Map} object The js object to which this Events object
     *                                is being added
     * @param {DOMElement} element A dom element to respond to browser events
     * @param {Array} eventTypes Array of custom application events
     * @param {Boolean} fallThrough Allow events to fall through after these 
     *                              have been handled?
     */
    initialize: function (object, element, eventTypes, fallThrough) {
        this.object     = object;
        this.element    = element;
        this.eventTypes = eventTypes;
        this.fallThrough = fallThrough;
        this.listeners  = new Object();

        // keep a bound copy of handleBrowserEvent() so that we can
        // pass the same function to both Event.observe() and .stopObserving()
        this.eventHandler = this.handleBrowserEvent.bindAsEventListener(this);

        // if eventTypes is specified, create a listeners list for each 
        // custom application event.
        if (this.eventTypes != null) {
            for (var i = 0; i < this.eventTypes.length; i++) {
                this.listeners[ this.eventTypes[i] ] = new Array();
            }
        }
        
        // if a dom element is specified, add a listeners list 
        // for browser events on the element and register them
        if (this.element != null) {
            this.attachToElement(element);
        }
    },

    /**
     * 
     */
    destroy: function () {
        if (this.element) {
            OpenLayers.Event.stopObservingElement(this.element);
        }
        this.element = null;

        this.listeners = null;
        this.object = null;
        this.eventTypes = null;
        this.fallThrough = null;
        this.eventHandler = null;
    },

    /**
     * @param {HTMLDOMElement} element a DOM element to attach browser events to
     */
    attachToElement: function (element) {
        for (var i = 0; i < this.BROWSER_EVENTS.length; i++) {
            var eventType = this.BROWSER_EVENTS[i];

            // every browser event has a corresponding application event 
            // (whether it's listened for or not).
            if (this.listeners[eventType] == null) {
                this.listeners[eventType] = new Array();
            }
            
            // use Prototype to register the event cross-browser
            OpenLayers.Event.observe(element, eventType, this.eventHandler);
        }
        // disable dragstart in IE so that mousedown/move/up works normally
        OpenLayers.Event.observe(element, "dragstart", OpenLayers.Event.stop);
    },

    /**
     * @param {String} type Name of the event to register
     * @param {Object} obj The object to bind the context to for the callback#.
     *                     If no object is specified, default is the Events's 
     *                     'object' property.
     * @param {Function} func The callback function. If no callback is 
     *                        specified, this function does nothing.
     * 
     * #When the event is triggered, the 'func' function will be called, in the
     *   context of 'obj'. Imagine we were to register an event, specifying an 
     *   OpenLayers.Bounds Object as 'obj'. When the event is triggered, the 
     *   context in the callback function will be our Bounds object. This means
     *   that within our callback function, we can access the properties and 
     *   methods of the Bounds object through the "this" variable. So our 
     *   callback could execute something like: 
     *   
     *     leftStr = "Left: " + this.left;
     *   
     *                   or
     *  
     *     centerStr = "Center: " + this.getCenterLonLat();
     * 
     */
    register: function (type, obj, func) {

        if (func != null) {
            if (obj == null)  {
                obj = this.object;
            }
            var listeners = this.listeners[type];
            if (listeners != null) {
                listeners.push( {obj: obj, func: func} );
            }
        }
    },

    /**
     *   TODO: get rid of this in 3.0 - Decide whether listeners should be 
     *         called in the order they were registered or in reverse order.
     * 
     * @param {String} type Name of the event to register
     * @param {Object} obj The object to bind the context to for the callback#.
     *                     If no object is specified, default is the Events's 
     *                     'object' property.
     * @param {Function} func The callback function. If no callback is 
     *                        specified, this function does nothing.
     */
    registerPriority: function (type, obj, func) {

        if (func != null) {
            if (obj == null)  {
                obj = this.object;
            }
            var listeners = this.listeners[type];
            if (listeners != null) {
                listeners.unshift( {obj: obj, func: func} );
            }
        }
    },
    
    /**
     * @param {String} type
     * @param {Object} obj If none specified, defaults to this.object
     * @param {Function} func
     */
    unregister: function (type, obj, func) {
        if (obj == null)  {
            obj = this.object;
        }
        var listeners = this.listeners[type];
        if (listeners != null) {
            for (var i = 0; i < listeners.length; i++) {
                if (listeners[i].obj == obj && listeners[i].func == func) {
                    listeners.splice(i, 1);
                    break;
                }
            }
        }
    },

    /** Remove all listeners for a given event type. If type is not registered,
     *   does nothing.
     * 
     * @param {String} type
     */
    remove: function(type) {
        if (this.listeners[type] != null) {
            this.listeners[type] = new Array();
        }
    },

    /** Trigger a specified registered event
     * 
     * @param {String} type
     * @param {Event} evt
     */
    triggerEvent: function (type, evt) {

        // prep evt object with object & div references
        if (evt == null) {
            evt = new Object();
        }
        evt.object = this.object;
        evt.element = this.element;

        // execute all callbacks registered for specified type
        // get a clone of the listeners array to
        // allow for splicing during callbacks
        var listeners = (this.listeners[type]) ?
                            this.listeners[type].slice() : null;
        if ((listeners != null) && (listeners.length > 0)) {
            for (var i = 0; i < listeners.length; i++) {
                var callback = listeners[i];
                var continueChain;
                if (callback.obj != null) {
                    // use the 'call' method to bind the context to callback.obj
                    continueChain = callback.func.call(callback.obj, evt);
                } else {
                    continueChain = callback.func(evt);
                }
    
                if ((continueChain != null) && (continueChain == false)) {
                    // if callback returns false, execute no more callbacks.
                    break;
                }
            }
            // don't fall through to other DOM elements
            if (!this.fallThrough) {           
                OpenLayers.Event.stop(evt, true);
            }
        }
    },

    /** Basically just a wrapper to the triggerEvent() function, but takes 
     *   care to set a property 'xy' on the event with the current mouse 
     *   position.
     * 
     * @private
     * 
     * @param {Event} evt
     */
    handleBrowserEvent: function (evt) {
        evt.xy = this.getMousePosition(evt); 
        this.triggerEvent(evt.type, evt)
    },

    /**
     * @private 
     * 
     * @param {Event} evt
     * 
     * @returns The current xy coordinate of the mouse, adjusted for offsets
     * @type OpenLayers.Pixel
     */
    getMousePosition: function (evt) {
        if (!this.element.offsets) {
            this.element.offsets = OpenLayers.Util.pagePosition(this.element);
            this.element.offsets[0] += (document.documentElement.scrollLeft
                         || document.body.scrollLeft);
            this.element.offsets[1] += (document.documentElement.scrollTop
                         || document.body.scrollTop);
        }
        return new OpenLayers.Pixel(
            (evt.clientX + (document.documentElement.scrollLeft
                         || document.body.scrollLeft)) - this.element.offsets[0], 
            (evt.clientY + (document.documentElement.scrollTop
                         || document.body.scrollTop)) - this.element.offsets[1] 
        ); 
    },

    /** @final @type String */
    CLASS_NAME: "OpenLayers.Events"
};
