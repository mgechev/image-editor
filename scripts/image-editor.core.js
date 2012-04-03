/*jslint nomen: true, unparam: true, indent: 4, maxerr: 50 */

var imageEditor = imageEditor || {};

(function () {

    'use strict';

    imageEditor = (function () {

        var modules = {},
            layers = [],
            selectedLayerPosition = 0,
            ctrlPressed = false,
            config,
            idPrefix = 'image-editor-layer-',
            idCounter = 0,
            eventPrefix = 'image-editor-',

            /**
            *   Extending the imageEditor function with external module.
            *
            *   @method extend
            *   @param child - an external module used for extending the functionality
            */
            extend = function (child) {
                var prop;
                for (prop in child) {
                    if (child.hasOwnProperty(prop)) {
                        modules[prop] = child[prop];
                    }
                }
            },

            /**
            *   Create new event with specified argumsts and fire it.
            *
            *   @method trigger
            *   @param id - id of the event (for example 'click')
            *   @param args - event arguments
            *   @return the result of the jQuery trigger with argument the event we've created
            */
            _trigger = function (id, args) {
                var event = $.Event(id);
                event.args = args;
                return $(document).trigger(event);
            },

            /**
            *   Fixing layers' z-indexes depnding on their order
            *
            *   @method _fixZIndexes
            */
            _fixZIndexes = function () {
                var count = layers.length - 1,
                    i;
                for (i = 0; i <= count; i += 1) {
                    layers[i].style.zIndex = count - i + 1;
                }
            },

            /**
            *   Getting the count of the layers
            *
            *   @method getLayersCount
            *   @return number which is equal to the layers count
            */
            getLayersCount = function () {
                return layers.length;
            },

            /**
            *   Selecting layer. If a layer is selected the user can make perform different manipulations on it.
            *
            *   @method selectLayer
            *   @param position - position of the layer that the user wish to select
            *   @param silent - parameters which indicateswhether selected event will be fired
            *   @return the selected layer
            */
            selectLayer = function (position, silent) {
                var current = layers[position],
                    max = layers.length - 1;
                if (position > max && position < 0) {
                    return undefined;
                }
                selectedLayerPosition = position;
                if (!silent) {
                    _trigger(eventPrefix + 'layer-selected', {
                        layer: current,
                        layerPosition: position
                    });
                }
                return current;
            },

            /**
            *   Adding new layer
            *
            *   @method addLayer
            *   @param with of the layer
            *   @param height of the layer
            *   @param silent - indicates whether an event will be triggered
            *   @return the created canvas
            */
            addLayer = function (width, height, silent) {
                var canvas = document.createElement('canvas');
                config.wrapper.appendChild(canvas);
                canvas.style.position = 'absolute';
                canvas.style.left = '0px';
                canvas.style.top = '0px';
                canvas.id = idPrefix + idCounter;
                canvas.width = width;
                canvas.height = height;
                $(canvas).draggable();
                layers.push(canvas);
                _fixZIndexes();
                idCounter += 1;
                if (!silent) {
                    _trigger(eventPrefix + 'layer-added', {
                        layer: canvas,
                        layerPosition: layers.length - 1
                    });
                }
                return canvas;
            },

            /**
            *   Overlaying all layers.
            *
            *   @method overlayLayers
            *   @return the result layer
            */
            overlayLayers = function () {
                var count = layers.length,
                    overlay = addLayer($(config.wrapper).width(), $(config.wrapper).height()),
                    context = overlay.getContext('2d'),
                    current,
                    border,
                    i;
                for (i = count - 1; i >= 0; i -= 1) {
                    current = layers[i];
                    border = current.style.border;
                    current.style.border = '';
                    context.drawImage(current, parseInt(current.style.left, 10), parseInt(current.style.top, 10));
                    current.style.border = border;
                }
                return overlay;
            },

            /**
            *   Setting the correct layer position for the selected layer after deletion
            *
            *   @method _fixSelectedLayer
            *   @param position - deleted layer
            */
            _fixSelectedLayer = function (position) {
                if (selectedLayerPosition === position) {
                    if (selectedLayerPosition > 0) {
                        selectLayer(selectedLayerPosition - 1, true);
                    } else {
                        if (getLayersCount() >= 1) {
                            selectLayer(1, true);
                        }
                    }
                } else {
                    if (selectedLayerPosition > position) {
                        selectLayer(selectedLayerPosition - 1, true);
                    }
                }
            },

            /**
            *   Removing layer with specific position
            *
            *   @method removeLayer
            *   @param position of the layer we wish to delete
            *   @param silent - indicates whether the method will trigger deleted event
            */
            removeLayer = function (position, silent) {
                var current = layers[position],
                    max = layers.length - 1,
                    domId = current;
                if (getLayersCount() < 2) {
                    return;
                }
                if (position > max && position < 0) {
                    return;
                }
                layers.splice(position, 1);
                _fixSelectedLayer(position);
                current.parentNode.removeChild(current);
                _fixZIndexes();
                if (!silent) {
                    _trigger(eventPrefix + 'layer-removed', {
                        layer: domId,
                        layerPosition: position
                    });
                }
            },

            /**
            *   Changing the position of a specific layer
            *            
            *   @method setLayerPosition
            *   @param layerPosition the position of the layer we wish to move
            *   @param position - the new position of the layer
            *   @return the layer which position we've changed
            */
            setLayerPosition = function (layerPosition, position) {
                var current = layers[layerPosition],
                    maxBound = layers.length - 1,
                    min = Math.min(layerPosition, position),
                    max = Math.max(layerPosition, position),
                    temp = layers[max],
                    i;
                if (layerPosition > maxBound && layerPosition < 0) {
                    return undefined;
                }
                for (i = max; i >= min; i -= 1) {
                    layers[i] = layers[i - 1];
                }
                layers[min] = temp;
                _fixZIndexes();
                return current;
            },

            /**
            *   Private method used for getting the required for execution module and it's parameters
            *
            *   @method commandHandler
            *   @param args - arguments object contains the module's name (string) and all the required parameters for the execution
            *   @return object - object with two properties - the module (the command) and the parameters
            */
            commandHandler = function (args, defaultParameters) {
                var command = args[0],
                    parameters = Array.prototype.slice.call(args, 1);
                command = modules[command];
                if (!command) {
                    throw new Error('Invalid namespace!');
                }
                return { command: command, parameters: parameters, defaultParameters: defaultParameters };
            },

            /**
            *   Returning the default parameters used by every method which is called by execute
            *
            *   @method _getDefaultParameters
            *   @return object containing all important parameters
            */
            _getDefaultParameters = function () {
                var canvas = layers[selectedLayerPosition],
                    context;
                if (canvas) {
                    context = canvas.getContext('2d');
                }
                return {
                    canvas: canvas,
                    context: context
                };
            },

            /**
            *   Running the module's execute method
            *
            *   @method execute
            *   @param c - command which can be string (if it is then it's handled by the commandHandler) or object containing the module and it's parameters
            *   @return the result from the command execution
            */
            execute = function (c) {
                var defaultParameters = _getDefaultParameters();
                if (typeof c === 'string') {
                    c = commandHandler(arguments, defaultParameters);
                }
                return c.command.execute.apply(this, [defaultParameters, c.parameters]);
            },

            current = 0,
            commands = [],
            maxStackSize = 5,
            undone = false,
            /**
            *   Executing a command and saving it into a stack for eventually undo in future
            *
            *   @method executeCommand
            *   @param command name and parameters
            *   @return the result from the command execution
            */
            executeCommand = function () {
                if (undone) {
                    commands = [];
                    current = 0;
                    undone = false;
                }
                var defaultParameters = _getDefaultParameters(),
                    c = commandHandler(arguments, defaultParameters);
                if (current >= maxStackSize) {
                    commands.splice(0, 1);
                } else {
                    current += 1;
                }
                commands.push(c);
                return execute(c);
            },

            /**
            *   Undo the last oparation if such exists
            *
            *   @method undo
            *   @return the undone command result
            */
            undo = function () {
                var temp = current - 1,
                    c = commands[temp];
                if (c && typeof c.command.undo === 'function') {
                    current -= 1;
                    undone = true;
                    return c.command.undo.apply(this, [c.defaultParameters, c.parameters]);
                } else {
                    throw new Error('Invalid operation!');
                }
            },

            /**
            *   Redo the last undone command if such exists
            *
            *   @method redo
            *   @return the redone command result
            */
            redo = function () {
                var c = commands[current];
                if (c && typeof c.command.execute === 'function') {
                    current += 1;
                    return c.command.execute.apply(this, [_getDefaultParameters(), c.parameters]);
                } else {
                    throw new Error('Invalid operation!');
                }
            },

            /**
            *   Getting the application canvas
            *
            *   @method getLayer
            *   @return canvas
            */
            getLayer = function () {
                return layers[selectedLayerPosition];
            },

            /**
            *   Getting the canvas context
            *
            *   @method getContext
            *   @return canvas context
            */
            getContext = function () {
                return layers[selectedLayerPosition].getContext('2d');
            },

            /**
            *   Getting the position of the selected layer
            *
            *   @method getSelectedPosition
            *   @return the position of the selected layer
            */
            getSelectedPosition = function () {
                return selectedLayerPosition;
            },

            /**
            *   Getting the position of a layer.
            *
            *   @method getLayerPosition
            *   @param layer - DOM canvas element
            *   @return a number which is indicating the layer position
            */
            getLayerPosition = function (layer) {
                layer = layer[0] || layer;
                var i;
                for (i = 0; i < layers.length; i += 1) {
                    if (layers[i] === layer) {
                        return i;
                    }
                }
                return -1;
            },

            /**
            *   Getting all layers
            *
            *   @method getLayers
            *   @return an array with all layers
            */
            getLayers = function () {
                return layers;
            },

            /**
            *   Attaching event listeners
            *
            *   @method _addEventListeners
            */
            _addEventListeners = function () {
                var self = this;
                $(document).on('keydown', function (event) {
                    if (event.keyCode === 17) {
                        ctrlPressed = true;
                    }
                });
                $(document).on('keyup', function (event) {
                    if (event.keyCode === 17) {
                        ctrlPressed = false;
                    }
                });
                $(document).on('keydown', function (event) {
                    if (ctrlPressed && event.keyCode === 90) {
                        undo.apply(self);
                    }
                });
                $(document).on('keydown', function (event) {
                    if (ctrlPressed && event.keyCode === 89) {
                        redo.apply(self);
                    }
                });
            },

            /**
            *   Creating the config object.
            *
            *   @method _setConfig
            */
            _setConfig = function () {
                config = {
                    'wrapper': document.getElementById('canvasWrapper')
                };
            },

            /**
            *   Getting the prefix of the canvases ids
            *
            *   @method getIdPrefix
            *   @return the prefix of the canvases' ids
            */
            getIdPrefix = function () {
                return idPrefix;
            },

            /**
            *   Setting the canvases' ids prefix
            *
            *   @method setIdPrefix
            */
            setIdPrefix = function (prefix) {
                return idPrefix;
            },

            /**
            *    Initialize all modules. Actually is just calling the init method of every module in modules.
            *
            *    @method init
            */
            init = function () {
                var module;
                _addEventListeners.apply(this);
                for (module in modules) {
                    if (modules.hasOwnProperty(module)) {
                        if (typeof modules[module].init === 'function') {
                            modules[module].init.apply(this, _getDefaultParameters());
                        }
                    }
                }
                _setConfig();
            };

        return {
            init: init,
            extend: extend,
            executeCommand: executeCommand,
            execute: execute,
            undo: undo,
            redo: redo,
            getLayer: getLayer,
            getContext: getContext,
            addLayer: addLayer,
            selectLayer: selectLayer,
            removeLayer: removeLayer,
            getLayersCount: getLayersCount,
            getSelectedPosition: getSelectedPosition,
            setLayerPosition: setLayerPosition,
            overlayLayers: overlayLayers,
            getIdPrefix: getIdPrefix,
            setIdPrefix: setIdPrefix,
            getLayerPosition: getLayerPosition,
            getLayers: getLayers
        };
    }());
}());