/**
*   This module is responsible for the layers control
*/
imageEditor.extend((function () {
    var _getImageSize = function (image) {
            var size;
            image.style.visibility = 'hidden';
            document.body.appendChild(image);
            size = { width: $(image).width(), height: $(image).height() };
            image.parentNode.removeChild(image);
            return size;
        },

        _getImagePosition = function (size) {
            var bigProp = (size.width > size.height) ? 'width' : 'height',
                smallProp = (size.width <= size.height) ? 'width' : 'height',
                dimension = (bigProp === 'width') ? 'left' : 'top',
                opposite = (smallProp === 'width') ? 'left' : 'top',
                max = size[bigProp],
                min = size[smallProp],
                attrs = {};
            attrs[dimension] = 0;
            attrs[opposite] = (max - min) / 2;
            attrs.size = max;
            return attrs;
        },

        loadImageInit = function () {
        },

        loadImage = function (args, url) {
            var canvas,
                context,
                imageSize,
                attrs,
                image = document.createElement('img');
            image.src = url;
            image.onload = function () {
                imageSize = _getImageSize(this);
                attrs = _getImagePosition(imageSize);
                canvas = imageEditor.addLayer(attrs.size, attrs.size);
                context = canvas.getContext('2d');
                context.drawImage(image, attrs.left, attrs.top);
                imageEditor.execute('reorderLayers');
            };
        },

        saveInit = function (args) {
            var self = this;
            $('#saveButton').jqxButton({ width: 50, theme: 'classic' });
            $('#saveButton').bind('click', function () {
                self.execute('save');
            });
        },

        save = function () {
            var canvas = this.overlayLayers(),
                image = canvas.toDataURL('image/png'),
                data = { image: image },
                obj;
            $.ajax({
                url: 'save.php',
                type: 'post',
                data: data,
                success: function (data) {
                    obj = $.parseJSON(data);
                    window.location = obj.url;
                }
            });
        },

        //optimize
        _moveHandler = function (elem, position, movables) {
            var i,
                count = movables.length,
                item,
                currentPosition;
            for (i = 0; i < count; i += 1) {
                item = movables[i];
                currentPosition = imageEditor.getLayerPosition($('#' + $(item).data('layer')));
                imageEditor.setLayerPosition(currentPosition, i);
            }
        },

        _getSmallCopy = function (canvas, copy) {
            var context = copy[0].getContext('2d');
            copy[0].width = canvas[0].width;
            copy[0].height = canvas[0].height;
            context.drawImage(canvas[0], 0, 0);
            copy[0].style.width = '30px';
            copy[0].style.height = '30px';
        },

        _initList = function () {
            var layers = imageEditor.getLayers(),
                selectedLayer = imageEditor.getSelectedPosition(),
                layer,
                image,
                li,
                i;
            for (i = 0; i < layers.length; i += 1) {
                layer = $('#' + layers[i].id);
                li =  $('<li class="flc-reorderer-movable image-editor-layers" data-layer="' + layers[i].id + '">' +
                    '<a href="#" class="image-editor-layer-selector">&nbsp;&nbsp;&nbsp;Layer</a></li>');
                $('#image-editor-layers-list').append(li);
                if (i === selectedLayer) {
                    li.addClass('image-editor-layers-selected');
                }                
                image = $('<canvas/>');
                li.prepend(image);
                _getSmallCopy(layer, image);
            }
        },

        selectLayerInit = function () {
            var layer,
                layerId;
            $('.image-editor-layer-selector').click(function () {
                layer = $(this).parent().data('layer');
                layerId = imageEditor.getLayerPosition($('#' + layer));
                imageEditor.selectLayer(layerId);
            });
        },

        reorderInit = function () {
            $('#image-editor-layers-list').empty();
            $('#image-editor-layers-list').unbind();
            _initList();
            fluid.reorderList($('#image-editor-layers-list'), {
                listeners: {
                    afterMove: _moveHandler
                }
            });
            selectLayerInit();
        },

        _layerSelected = function (layerId) {
            var current = $('#image-editor-layers-list').children('.image-editor-layers-selected');
            if (current[0]) {
                current.removeClass('image-editor-layers-selected');
            }
            $('li[data-layer=' + layerId + ']').addClass('image-editor-layers-selected');
        },

        layerControlInit = function () {
            $(document).bind('image-editor-layer-added', function (event) {
                reorderInit();
            });
            $(document).bind('image-editor-layer-selected', function (event) {
                _layerSelected(event.args.layer.id);
            });
            $(document).bind('image-editor-layer-removed', function (event) {
                var id = event.args.layer.id;
                $('li[data-layer=' + id + ']').remove();
                _layerSelected(id);                
            });            
        };
    return {
        loadImage: {
            init: loadImageInit,
            execute: loadImage
        },
        save: {
            init: saveInit,
            execute: save
        },
        layerControl: {
            init: layerControlInit
        },
        reorderLayers: {
            init: reorderInit,
            execute: reorderInit
        },
        selectLayer: {
            init: selectLayerInit
        }
    };
}()));