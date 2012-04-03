/**
*   This module is responsible for loading and saving images
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
        }
    return {
        loadImage: {
            init: loadImageInit,
            execute: loadImage
        },
        save: {
            init: saveInit,
            execute: save
        }
    };
}()));