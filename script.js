$(function () {
    onLoad();
});
function onLoad() {
    pixel_width_form = document.getElementById("width_choose");
    pixel_width_form.addEventListener("submit", formSubmit, false);
    $("#use_upload").click(function () {
        $(".wrapper").hide();
        $("#upload_wrapper").show();
    });

    $("#image-form").submit(function (e) {
        e.preventDefault();
        var imageInput = document.getElementById("image-input");

        var file = imageInput.files[0];
        if (!file.type.match(/image.*/)) alert("Please select an image file");
        var reader = new FileReader();
        reader.onload = (() => {
            return function (e) {
                $("#image-value").attr("src", e.target.result);
                $(".wrapper").show();
            };
        })(file);
        reader.readAsDataURL(file);
    });
}

function formSubmit(e) {
    e.preventDefault();
    sel_val = document.getElementById("pixelwidth");

    var pxSkip = parseInt(sel_val.value);
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    var img = new Image();
    img.src = $("#image-value").attr("src");
    img.onload = function () {
        const start = performance.now();
        table = document.createElement("table", {
            height: img.height,
            width: img.width,
            cellPadding: 0,
            cellSpacing: 0,
        });

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        function componentToHex(c) {
            var hex = c.toString(16);
            return String(hex.length === 1 ? "0" + hex : hex);
        }

        function rgbToHex(r, g, b, a) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b) + componentToHex(a);
        }

        const style = document.createElement("style");
        style.innerHTML = `
        body {
            width: max-content;
        }
        table {
            border: none;
            border-spacing: 0;
        }
        td {
            height: ${pxSkip}px;
            margin: 0;
            padding: 0;
        }
        `;

        ctx.drawImage(img, 0, 0);

        // add table to page
        const result = document.getElementById("generated");
        result.innerHTML = "";
        result.appendChild(table);
        result.appendChild(style);

        for (var j = 0; j < canvas.height; j += pxSkip) {
            const row = document.createElement("tr");
            let prevColor = null;
            let count = 0;
            for (var i = 0; i < canvas.width; i += pxSkip) {
                //getImage data is slow, change to be whole width of canvas & iterate that.
                imageData = ctx.getImageData(i, j, pxSkip, pxSkip).data;
                // average the pixels
                const reds = imageData.filter((_, i) => i % 4 === 0);
                const greens = imageData.filter((_, i) => i % 4 === 1);
                const blues = imageData.filter((_, i) => i % 4 === 2);
                const alphas = imageData.filter((_, i) => i % 4 === 3);
                const r = Math.round(reds.reduce((a, b) => a + b, 0) / reds.length);
                const g = Math.round(greens.reduce((a, b) => a + b, 0) / greens.length);
                const b = Math.round(blues.reduce((a, b) => a + b, 0) / blues.length);
                const a = Math.round(alphas.reduce((a, b) => a + b, 0) / alphas.length);
                const color = rgbToHex(r, g, b, a);
                if (prevColor === color) {
                    count++;
                    if (i + pxSkip >= canvas.width) {
                        const col = document.createElement("td");
                        col.style.backgroundColor = prevColor;
                        col.style.width = `${count * pxSkip}px`;
                        col.colSpan = count;
                        row.appendChild(col);
                    }
                } else {
                    if (prevColor) {
                        const col = document.createElement("td");
                        col.style.backgroundColor = prevColor;
                        col.style.width = `${count * pxSkip}px`;
                        col.colSpan = count;
                        row.appendChild(col);
                    }
                    prevColor = color;
                    count = 1;
                }
            }
            table.appendChild(row);
        }

        const end = performance.now();
        result.appendChild(
            document.createTextNode("Took " + (Math.round(((end - start) / 1000) * 100) / 100 + " seconds"))
        );
    };
}
