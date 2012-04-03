/**
*   This module is responsible for the image rotation.
*/
imageEditor.extend((
    function () {
        var init = function (args) {
                var self = this;
                $('#rotate-slider').jqxSlider({ min: 0, max: 360, step: 90, mode: 'fixed', ticksFrequency: 90, width: 200, theme: 'classic' });
                $('#rotate-slider').bind('change', function (event) {
                    var inputAngle = $('#rotate-slider').jqxSlider('step');
                    self.execute('rotate', inputAngle);
                });
            },

            execute = function (args, inputAngle) {
                var oldCanvas = args.canvas,
                    oldCanvasPosition = oldCanvas.id,
                    oldContext = oldCanvas.getContext('2d'),
                    width = parseInt(oldCanvas.width, 10),
                    height = parseInt(oldCanvas.height, 10),
                    layerPosition = this.getSelectedPosition(),
                    newCanvas = this.addLayer(width, height, true),
                    context = newCanvas.getContext('2d');
                newCanvas.style.left = oldCanvas.style.left;
                newCanvas.style.top = oldCanvas.style.top;
                context.clearRect(0, 0, width, height);
                context.save();
                context.translate(width / 2, height / 2);
                context.rotate(inputAngle * Math.PI / 180);
                context.translate(-width / 2, -width / 2);
                context.drawImage(oldCanvas, 0, 0);
                context.restore();
                oldContext.clearRect(0, 0, width, height);
                oldContext.drawImage(newCanvas, 0, 0);
                this.removeLayer(this.getLayersCount() - 1, true);
            },

            undo = function (args, angle) {
                this.execute('rotate', -angle);
            };

        return {
            rotate: {
                init: init,
                execute: execute,
                undo: undo
            }
        };
    }()
));