/**
*   This module is responsible for inverting image colors
*/
imageEditor.extend((function () {
    var init = function (args) {
            var self = this;
            $('#invertButton').jqxButton({ width: 50, theme: 'classic' });
            $('#invertButton').bind('click', function () {
                self.executeCommand('invert');
            });
        },

        invert = function (args, rectangle) {
            var canvas = args.canvas,
                context = args.context,
                rect = {
                    width: parseInt(canvas.width, 10),
                    height: parseInt(canvas.height, 10)
                },
                dataDesc = context.getImageData(0, 0, rect.width, rect.height),
                data = dataDesc.data,
                p = rect.width * rect.height,
                pix = p * 4,
                pix1 = pix + 1,
                pix2 = pix + 2;
            while (p) {
                p -= 1;
                data[pix -= 4] = 255 - data[pix];
                data[pix1 -= 4] = 255 - data[pix1];
                data[pix2 -= 4] = 255 - data[pix2];
            }
            context.putImageData(dataDesc, 0, 0);
            return true;
        },

        undo = function (args, rectangle) {
            invert(args, rectangle);
        };

    return {
        invert: {
            init: init,
            execute: invert,
            undo: undo
        }
    };
}()));